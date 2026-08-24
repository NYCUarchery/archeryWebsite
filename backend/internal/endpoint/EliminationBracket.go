package endpoint

import (
	"backend/internal/database"
	"errors"
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

// BracketInitResponse is deliberately small: callers should fetch the normal
// elimination resource when they need the complete bracket graph.
type BracketInitResponse struct {
	EliminationID uint `json:"elimination_id"`
	EntrantCount  int  `json:"entrant_count"`
	BracketSize   int  `json:"bracket_size"`
	StageCount    int  `json:"stage_count"`
	Created       bool `json:"created"`
}

type BracketAdvanceResponse struct {
	EliminationID uint  `json:"elimination_id"`
	SourceStageID uint  `json:"source_stage_id"`
	TargetStageID *uint `json:"target_stage_id,omitempty"`
	Finalized     bool  `json:"finalized"`
	Changed       bool  `json:"changed"`
}

var (
	errBracketConflict = errors.New("elimination bracket is partial or incompatible")
	errBracketPending  = errors.New("every source match needs exactly one winner")
	errBracketLocked   = errors.New("complete elimination bracket cannot be changed through manual APIs")
)

type bracketMatch struct {
	Match   database.Match
	Results []database.MatchResult
}

type bracketStage struct {
	Stage   database.Stage
	Matches []bracketMatch
}

func nextPowerOfTwo(value int) int {
	result := 1
	for result < value {
		result <<= 1
	}
	return result
}

// standardSeedOrder returns the conventional bracket positions.  For eight
// entrants it is 1,8,4,5,2,7,3,6, thus the highest seeds only meet late.
func standardSeedOrder(size int) []int {
	if size <= 1 {
		return []int{1}
	}
	order := []int{1, 2}
	for len(order) < size {
		nextSize := len(order) * 2
		next := make([]int, 0, nextSize)
		for _, seed := range order {
			next = append(next, seed, nextSize+1-seed)
		}
		order = next
	}
	return order
}

func expectedBracketMatchCounts(bracketSize int) []int {
	counts := make([]int, 0)
	for matches := bracketSize / 2; matches >= 2; matches /= 2 {
		counts = append(counts, matches)
	}
	// The final stage contains both gold and bronze matches.
	return append(counts, 2)
}

func bracketStageMatchShapeIsComplete(bracket []bracketStage, bracketSize int) bool {
	expected := expectedBracketMatchCounts(bracketSize)
	if len(bracket) != len(expected) {
		return false
	}
	for stageIndex, stage := range bracket {
		if len(stage.Matches) != expected[stageIndex] {
			return false
		}
		for _, match := range stage.Matches {
			if len(match.Results) != 2 {
				return false
			}
		}
	}
	return true
}

func withManualBracketMutation(eliminationID uint, mutation func(*gorm.DB, database.Elimination) error) error {
	return database.DB.Transaction(func(tx *gorm.DB) error {
		var elimination database.Elimination
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&elimination, eliminationID).Error; err != nil {
			return err
		}
		var playerSets []database.PlayerSet
		if err := tx.Where("elimination_id = ?", eliminationID).Find(&playerSets).Error; err != nil {
			return err
		}
		if validateBracketEntrants(playerSets) == nil {
			bracket, err := loadBracket(tx, eliminationID)
			if err != nil {
				return err
			}
			if bracketStageMatchShapeIsComplete(bracket, nextPowerOfTwo(len(playerSets))) {
				return errBracketLocked
			}
		}
		return mutation(tx, elimination)
	})
}

func bracketWinnerMutationIsLocked(tx *gorm.DB, bracket []bracketStage, eliminationID, resultID uint) (bool, error) {
	for stageIndex, stage := range bracket {
		for matchIndex, match := range stage.Matches {
			containsResult := false
			for _, result := range match.Results {
				containsResult = containsResult || result.ID == resultID
			}
			if !containsResult {
				continue
			}
			lastStage := len(bracket) - 1
			if stageIndex == lastStage {
				var awardedMedals int64
				err := tx.Model(&database.Medal{}).Where("elimination_id = ? AND player_set_id <> 0", eliminationID).Count(&awardedMedals).Error
				return awardedMedals != 0, err
			}
			if stageIndex == lastStage-1 {
				return bracket[lastStage].Matches[0].Results[matchIndex].PlayerSetId != nil ||
					bracket[lastStage].Matches[1].Results[matchIndex].PlayerSetId != nil, nil
			}
			targetMatch := matchIndex / 2
			targetSlot := matchIndex % 2
			return bracket[stageIndex+1].Matches[targetMatch].Results[targetSlot].PlayerSetId != nil, nil
		}
	}
	return false, errBracketConflict
}

func matchEndsAndArrows(teamSize int) (int, int, error) {
	switch teamSize {
	case 1:
		return 5, 3, nil
	case 2:
		return 4, 4, nil
	case 3:
		return 4, 6, nil
	default:
		return 0, 0, fmt.Errorf("unsupported elimination team_size %d", teamSize)
	}
}

func validateBracketEntrants(playerSets []database.PlayerSet) error {
	if len(playerSets) < 4 {
		return errors.New("at least four player sets are required")
	}
	seen := make(map[int]bool, len(playerSets))
	for _, playerSet := range playerSets {
		if playerSet.Rank < 1 || playerSet.Rank > len(playerSets) || seen[playerSet.Rank] {
			return errors.New("player set ranks must be unique and continuous from 1")
		}
		seen[playerSet.Rank] = true
	}
	return nil
}

func loadBracket(tx *gorm.DB, eliminationID uint) ([]bracketStage, error) {
	var stages []database.Stage
	if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).Where("elimination_id = ?", eliminationID).Order("id asc").Find(&stages).Error; err != nil {
		return nil, err
	}
	loaded := make([]bracketStage, len(stages))
	for stageIndex, stage := range stages {
		loaded[stageIndex].Stage = stage
		var matches []database.Match
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).Where("stage_id = ?", stage.ID).Order("id asc").Find(&matches).Error; err != nil {
			return nil, err
		}
		loaded[stageIndex].Matches = make([]bracketMatch, len(matches))
		for matchIndex, match := range matches {
			loaded[stageIndex].Matches[matchIndex].Match = match
			if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).Where("match_id = ?", match.ID).Order("id asc").Find(&loaded[stageIndex].Matches[matchIndex].Results).Error; err != nil {
				return nil, err
			}
		}
	}
	return loaded, nil
}

func expectedFirstRoundSlots(playerSets []database.PlayerSet, bracketSize int) []*uint {
	byRank := make(map[int]uint, len(playerSets))
	for _, playerSet := range playerSets {
		byRank[playerSet.Rank] = playerSet.ID
	}
	firstSlots := make([]*uint, bracketSize)
	for position, rank := range standardSeedOrder(bracketSize) {
		if playerSetID, ok := byRank[rank]; ok {
			id := playerSetID
			firstSlots[position] = &id
		}
	}
	return firstSlots
}

func sameOptionalID(left, right *uint) bool {
	if left == nil || right == nil {
		return left == nil && right == nil
	}
	return *left == *right
}

func targetSlotIsCompatible(actual, expected *uint) bool {
	// A decided source may still be waiting for the explicit advance action.
	if actual == nil {
		return true
	}
	return expected != nil && *actual == *expected
}

func decidedWinnerAndLoser(results []database.MatchResult) (*uint, *uint) {
	var winner, loser *uint
	for _, result := range results {
		if result.IsWinner {
			winner = result.PlayerSetId
		} else if result.PlayerSetId != nil {
			loser = result.PlayerSetId
		}
	}
	return winner, loser
}

func bracketShapeIsCompatible(tx *gorm.DB, bracket []bracketStage, playerSets []database.PlayerSet, bracketSize, teamSize int) (bool, error) {
	expected := expectedBracketMatchCounts(bracketSize)
	if len(bracket) != len(expected) {
		return false, nil
	}
	if len(bracket) == 0 {
		return false, nil
	}
	var medals []database.Medal
	if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).Where("elimination_id = ?", bracket[0].Stage.EliminationId).Order("type asc, id asc").Find(&medals).Error; err != nil {
		return false, err
	}
	if len(medals) != 3 || medals[0].Type != 0 || medals[1].Type != 1 || medals[2].Type != 2 {
		return false, nil
	}
	endsPerResult, arrowsPerEnd, err := matchEndsAndArrows(teamSize)
	if err != nil {
		return false, err
	}
	validPlayerSetIDs := make(map[uint]bool, len(playerSets))
	for _, playerSet := range playerSets {
		validPlayerSetIDs[playerSet.ID] = true
	}
	expectedFirstSlots := expectedFirstRoundSlots(playerSets, bracketSize)
	for stageIndex, stage := range bracket {
		if len(stage.Matches) != expected[stageIndex] {
			return false, nil
		}
		for matchIndex, match := range stage.Matches {
			if len(match.Results) != 2 {
				return false, nil
			}
			winnerCount := 0
			knownCount := 0
			for resultIndex, result := range match.Results {
				isEmptySlot := result.PlayerSetId == nil
				if result.PlayerSetId != nil && !validPlayerSetIDs[*result.PlayerSetId] {
					return false, nil
				}
				if result.PlayerSetId != nil {
					knownCount++
				}
				if result.IsWinner {
					winnerCount++
					if result.PlayerSetId == nil {
						return false, nil
					}
				}
				if isEmptySlot && (result.TotalPoints != 0 || result.ShootOffScore != -1 || result.IsWinner || result.LaneNumber != 0) {
					return false, nil
				}
				if stageIndex == 0 {
					expectedSlot := expectedFirstSlots[matchIndex*2+resultIndex]
					if !sameOptionalID(result.PlayerSetId, expectedSlot) {
						return false, nil
					}
				}
				var ends []database.MatchEnd
				if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).Where("match_result_id = ?", result.ID).Order("id asc").Find(&ends).Error; err != nil {
					return false, err
				}
				if len(ends) != endsPerResult {
					return false, nil
				}
				for _, end := range ends {
					if isEmptySlot && (end.TotalScore != 0 || end.IsConfirmed) {
						return false, nil
					}
					var scores []database.MatchScore
					if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).Where("match_end_id = ?", end.ID).Find(&scores).Error; err != nil {
						return false, err
					}
					if len(scores) != arrowsPerEnd {
						return false, nil
					}
					if isEmptySlot {
						for _, score := range scores {
							if score.Score != -1 {
								return false, nil
							}
						}
					}
				}
			}
			if winnerCount > 1 || stageIndex == 0 && knownCount == 1 && winnerCount != 1 || stageIndex > 0 && winnerCount == 1 && knownCount != 2 {
				return false, nil
			}
		}
	}

	lastStage := len(bracket) - 1
	for stageIndex := 0; stageIndex < lastStage; stageIndex++ {
		for matchIndex, sourceMatch := range bracket[stageIndex].Matches {
			winner, loser := decidedWinnerAndLoser(sourceMatch.Results)
			if stageIndex == lastStage-1 {
				if !targetSlotIsCompatible(bracket[lastStage].Matches[0].Results[matchIndex].PlayerSetId, winner) ||
					!targetSlotIsCompatible(bracket[lastStage].Matches[1].Results[matchIndex].PlayerSetId, loser) {
					return false, nil
				}
				continue
			}
			targetMatch := matchIndex / 2
			targetSlot := matchIndex % 2
			if !targetSlotIsCompatible(bracket[stageIndex+1].Matches[targetMatch].Results[targetSlot].PlayerSetId, winner) {
				return false, nil
			}
		}
	}

	gold, silver := decidedWinnerAndLoser(bracket[lastStage].Matches[0].Results)
	bronze, _ := decidedWinnerAndLoser(bracket[lastStage].Matches[1].Results)
	for medalIndex, expectedPlayerSetID := range []*uint{gold, silver, bronze} {
		if medals[medalIndex].PlayerSetId != 0 && (expectedPlayerSetID == nil || medals[medalIndex].PlayerSetId != *expectedPlayerSetID) {
			return false, nil
		}
	}
	return true, nil
}

func createBracketMatch(tx *gorm.DB, stageID uint, slots [2]*uint, teamSize int) (bracketMatch, error) {
	match := database.Match{StageId: stageID}
	if err := tx.Create(&match).Error; err != nil {
		return bracketMatch{}, err
	}
	endsPerResult, arrowsPerEnd, err := matchEndsAndArrows(teamSize)
	if err != nil {
		return bracketMatch{}, err
	}
	created := bracketMatch{Match: match, Results: make([]database.MatchResult, 2)}
	for slot, playerSetID := range slots {
		result := database.MatchResult{MatchId: match.ID, PlayerSetId: playerSetID, ShootOffScore: -1, LaneNumber: 0}
		if err := tx.Create(&result).Error; err != nil {
			return bracketMatch{}, err
		}
		created.Results[slot] = result
		for endIndex := 0; endIndex < endsPerResult; endIndex++ {
			end := database.MatchEnd{MatchResultId: result.ID, TotalScore: 0, IsConfirmed: false}
			if err := tx.Create(&end).Error; err != nil {
				return bracketMatch{}, err
			}
			for scoreIndex := 0; scoreIndex < arrowsPerEnd; scoreIndex++ {
				if err := tx.Create(&database.MatchScore{MatchEndId: end.ID, Score: -1}).Error; err != nil {
					return bracketMatch{}, err
				}
			}
		}
	}
	return created, nil
}

func createBracket(tx *gorm.DB, elimination database.Elimination, playerSets []database.PlayerSet, bracketSize int) ([]bracketStage, error) {
	firstSlots := expectedFirstRoundSlots(playerSets, bracketSize)

	counts := expectedBracketMatchCounts(bracketSize)
	bracket := make([]bracketStage, len(counts))
	for stageIndex, matchCount := range counts {
		stage := database.Stage{EliminationId: elimination.ID}
		if err := tx.Create(&stage).Error; err != nil {
			return nil, err
		}
		bracket[stageIndex].Stage = stage
		bracket[stageIndex].Matches = make([]bracketMatch, matchCount)
		for matchIndex := 0; matchIndex < matchCount; matchIndex++ {
			var slots [2]*uint
			if stageIndex == 0 {
				slots = [2]*uint{firstSlots[matchIndex*2], firstSlots[matchIndex*2+1]}
			}
			match, err := createBracketMatch(tx, stage.ID, slots, elimination.TeamSize)
			if err != nil {
				return nil, err
			}
			bracket[stageIndex].Matches[matchIndex] = match
		}
	}
	if _, err := autoAdvanceByes(tx, bracket); err != nil {
		return nil, err
	}
	return bracket, nil
}

func winnerAndLoser(results []database.MatchResult, allowBye bool) (*uint, *uint, error) {
	if len(results) != 2 {
		return nil, nil, errBracketConflict
	}
	winners := 0
	var winner, loser *uint
	for _, result := range results {
		if result.IsWinner {
			if result.PlayerSetId == nil {
				return nil, nil, errBracketConflict
			}
			winners++
			winner = result.PlayerSetId
			continue
		}
		if result.PlayerSetId != nil {
			loser = result.PlayerSetId
		}
	}
	if winners != 1 {
		return nil, nil, errBracketPending
	}
	if loser == nil && !allowBye {
		return nil, nil, errBracketPending
	}
	return winner, loser, nil
}

func putBracketSlot(tx *gorm.DB, result *database.MatchResult, playerSetID *uint) (bool, error) {
	if playerSetID == nil {
		return false, nil
	}
	if result.PlayerSetId != nil {
		if *result.PlayerSetId != *playerSetID {
			return false, errBracketConflict
		}
		return false, nil
	}
	blank, err := bracketSlotIsBlank(tx, *result)
	if err != nil {
		return false, err
	}
	if !blank {
		return false, errBracketConflict
	}
	if err := tx.Model(&database.MatchResult{}).Where("id = ?", result.ID).Update("player_set_id", *playerSetID).Error; err != nil {
		return false, err
	}
	id := *playerSetID
	result.PlayerSetId = &id
	return true, nil
}

func bracketSlotIsBlank(tx *gorm.DB, result database.MatchResult) (bool, error) {
	if result.PlayerSetId != nil || result.TotalPoints != 0 || result.ShootOffScore != -1 || result.IsWinner || result.LaneNumber != 0 {
		return false, nil
	}
	var ends []database.MatchEnd
	if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).Where("match_result_id = ?", result.ID).Find(&ends).Error; err != nil {
		return false, err
	}
	for _, end := range ends {
		if end.TotalScore != 0 || end.IsConfirmed {
			return false, nil
		}
		var scores []database.MatchScore
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).Where("match_end_id = ?", end.ID).Find(&scores).Error; err != nil {
			return false, err
		}
		for _, score := range scores {
			if score.Score != -1 {
				return false, nil
			}
		}
	}
	return true, nil
}

func advanceSourceMatch(tx *gorm.DB, bracket []bracketStage, stageIndex, matchIndex int, allowBye bool) (bool, error) {
	winner, loser, err := winnerAndLoser(bracket[stageIndex].Matches[matchIndex].Results, allowBye)
	if err != nil {
		return false, err
	}
	lastStage := len(bracket) - 1
	if stageIndex == lastStage {
		return false, nil
	}
	if stageIndex == lastStage-1 { // semi-final: winner to gold, loser to bronze
		changed, err := putBracketSlot(tx, &bracket[lastStage].Matches[0].Results[matchIndex], winner)
		if err != nil {
			return false, err
		}
		loserChanged, err := putBracketSlot(tx, &bracket[lastStage].Matches[1].Results[matchIndex], loser)
		return changed || loserChanged, err
	}
	targetMatch := matchIndex / 2
	targetSlot := matchIndex % 2
	return putBracketSlot(tx, &bracket[stageIndex+1].Matches[targetMatch].Results[targetSlot], winner)
}

// autoAdvanceByes resolves structural BYEs in the first round only. A nil slot
// in a later round means that its source match is still pending, not a BYE.
func autoAdvanceByes(tx *gorm.DB, bracket []bracketStage) (bool, error) {
	if len(bracket) == 0 {
		return false, errBracketConflict
	}
	changed := false
	for matchIndex := range bracket[0].Matches {
		match := &bracket[0].Matches[matchIndex]
		if len(match.Results) != 2 {
			return false, errBracketConflict
		}
		known := make([]int, 0, 2)
		winnerExists := false
		for resultIndex, result := range match.Results {
			if result.PlayerSetId != nil {
				known = append(known, resultIndex)
			}
			winnerExists = winnerExists || result.IsWinner
		}
		if len(known) != 1 || winnerExists {
			continue
		}
		winnerResult := &match.Results[known[0]]
		if err := tx.Model(&database.MatchResult{}).Where("id = ?", winnerResult.ID).Update("is_winner", true).Error; err != nil {
			return false, err
		}
		winnerResult.IsWinner = true
		changed = true
		if len(bracket) > 1 {
			propagated, err := advanceSourceMatch(tx, bracket, 0, matchIndex, true)
			if err != nil {
				return false, err
			}
			changed = changed || propagated
		}
	}
	return changed, nil
}

func setMedalPlayerSet(tx *gorm.DB, eliminationID uint, medalType int, playerSetID *uint) (bool, error) {
	if playerSetID == nil {
		return false, nil
	}
	var medal database.Medal
	if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).Where("elimination_id = ? AND type = ?", eliminationID, medalType).First(&medal).Error; err != nil {
		return false, err
	}
	if medal.PlayerSetId != 0 {
		if medal.PlayerSetId != *playerSetID {
			return false, errBracketConflict
		}
		return false, nil
	}
	if err := tx.Model(&database.Medal{}).Where("id = ?", medal.ID).Update("player_set_id", *playerSetID).Error; err != nil {
		return false, err
	}
	return true, nil
}

func finalizeBracket(tx *gorm.DB, eliminationID uint, final bracketStage) (bool, error) {
	if len(final.Matches) != 2 {
		return false, errBracketConflict
	}
	gold, silver, err := winnerAndLoser(final.Matches[0].Results, false)
	if err != nil {
		return false, err
	}
	bronze, _, err := winnerAndLoser(final.Matches[1].Results, false)
	if err != nil {
		return false, err
	}
	changed := false
	for medalType, playerSetID := range []*uint{gold, silver, bronze} {
		medalChanged, err := setMedalPlayerSet(tx, eliminationID, medalType, playerSetID)
		if err != nil {
			return false, err
		}
		changed = changed || medalChanged
	}
	return changed, nil
}

// PostEliminationBracket initializes a deterministic, single-elimination
// bracket.  A complete compatible graph is idempotent; any partial graph is a
// conflict so that an operator never loses entered match data by accident.
//
//	@Summary		Initialize an elimination bracket
//	@Description	Creates a standard seeded bracket, including stages, gold and bronze finals, match results, ends, and scores. Requires a competition Admin.
//	@Tags			Elimination
//	@Produce		json
//	@Param			id	path	int	true	"Elimination ID"
//	@Success		200	{object}	endpoint.BracketInitResponse
//	@Failure		400	{object}	response.ErrorResponse
//	@Failure		403	{object}	response.ErrorResponse
//	@Failure		409	{object}	response.ErrorResponse
//	@Failure		500	{object}	response.ErrorResponse
//	@Router			/elimination/bracket/{id} [post]
func PostEliminationBracket(context *gin.Context) {
	id := Convert2uint(context, "id")
	elimination, err := database.GetOnlyEliminationById(id)
	if err != nil || elimination.ID == 0 {
		context.JSON(http.StatusBadRequest, gin.H{"error": "invalid elimination ID"})
		return
	}
	if !requireEliminationCompetitionAdmin(context, elimination) {
		return
	}

	var data BracketInitResponse
	err = database.DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&elimination, id).Error; err != nil {
			return err
		}
		var playerSets []database.PlayerSet
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).Where("elimination_id = ?", id).Order("`rank` asc, id asc").Find(&playerSets).Error; err != nil {
			return err
		}
		if err := validateBracketEntrants(playerSets); err != nil {
			return err
		}
		var medals []database.Medal
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).Where("elimination_id = ?", id).Order("type asc, id asc").Find(&medals).Error; err != nil {
			return err
		}
		if len(medals) != 3 || medals[0].Type != 0 || medals[1].Type != 1 || medals[2].Type != 2 {
			return errBracketConflict
		}
		bracketSize := nextPowerOfTwo(len(playerSets))
		bracket, err := loadBracket(tx, id)
		if err != nil {
			return err
		}
		created := false
		if len(bracket) != 0 {
			compatible, err := bracketShapeIsCompatible(tx, bracket, playerSets, bracketSize, elimination.TeamSize)
			if err != nil {
				return err
			}
			if !compatible {
				return errBracketConflict
			}
		} else {
			if _, err := createBracket(tx, elimination, playerSets, bracketSize); err != nil {
				return err
			}
			created = true
		}
		data = BracketInitResponse{EliminationID: id, EntrantCount: len(playerSets), BracketSize: bracketSize, StageCount: len(expectedBracketMatchCounts(bracketSize)), Created: created}
		return nil
	})
	if err != nil {
		writeBracketError(context, err)
		return
	}
	context.JSON(http.StatusOK, data)
}

// PostEliminationStageAdvance moves every completed match in a stage. Normal
// winners feed the next round; semi-final losers feed the bronze match; the
// final assigns gold, silver, and bronze medals.
//
//	@Summary		Advance an elimination stage
//	@Description	Propagates completed winners to the following stage, routes semi-final losers to bronze, or assigns final medals. Requires a competition Admin.
//	@Tags			Elimination
//	@Produce		json
//	@Param			stageid	path	int	true	"Source stage ID"
//	@Success		200	{object}	endpoint.BracketAdvanceResponse
//	@Failure		403	{object}	response.ErrorResponse
//	@Failure		409	{object}	response.ErrorResponse
//	@Failure		500	{object}	response.ErrorResponse
//	@Router			/elimination/stage/advance/{stageid} [post]
func PostEliminationStageAdvance(context *gin.Context) {
	stageID := Convert2uint(context, "stageid")
	stage, err := database.GetStageById(stageID)
	if err != nil || stage.ID == 0 {
		context.JSON(http.StatusBadRequest, gin.H{"error": "invalid stage ID"})
		return
	}
	elimination, err := database.GetOnlyEliminationById(stage.EliminationId)
	if err != nil || elimination.ID == 0 {
		context.JSON(http.StatusBadRequest, gin.H{"error": "invalid elimination"})
		return
	}
	if !requireEliminationCompetitionAdmin(context, elimination) {
		return
	}

	data := BracketAdvanceResponse{EliminationID: elimination.ID, SourceStageID: stageID}
	err = database.DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&elimination, elimination.ID).Error; err != nil {
			return err
		}
		var playerSets []database.PlayerSet
		if err := tx.Where("elimination_id = ?", elimination.ID).Find(&playerSets).Error; err != nil {
			return err
		}
		if err := validateBracketEntrants(playerSets); err != nil {
			return errBracketConflict
		}
		bracketSize := nextPowerOfTwo(len(playerSets))
		bracket, err := loadBracket(tx, elimination.ID)
		if err != nil {
			return err
		}
		compatible, err := bracketShapeIsCompatible(tx, bracket, playerSets, bracketSize, elimination.TeamSize)
		if err != nil {
			return err
		}
		if !compatible {
			return errBracketConflict
		}
		sourceIndex := -1
		for index, candidate := range bracket {
			if candidate.Stage.ID == stageID {
				sourceIndex = index
				break
			}
		}
		if sourceIndex < 0 {
			return errBracketConflict
		}
		if sourceIndex == len(bracket)-1 {
			changed, err := finalizeBracket(tx, elimination.ID, bracket[sourceIndex])
			if err != nil {
				return err
			}
			data.Finalized = true
			data.Changed = changed
			return nil
		}
		targetID := bracket[sourceIndex+1].Stage.ID
		data.TargetStageID = &targetID
		for matchIndex := range bracket[sourceIndex].Matches {
			changed, err := advanceSourceMatch(tx, bracket, sourceIndex, matchIndex, sourceIndex == 0)
			if err != nil {
				return err
			}
			data.Changed = data.Changed || changed
		}
		autoChanged, err := autoAdvanceByes(tx, bracket)
		if err != nil {
			return err
		}
		data.Changed = data.Changed || autoChanged
		return nil
	})
	if err != nil {
		writeBracketError(context, err)
		return
	}
	context.JSON(http.StatusOK, data)
}

func writeBracketError(context *gin.Context, err error) {
	switch {
	case errors.Is(err, errBracketConflict), errors.Is(err, errBracketPending), errors.Is(err, errBracketLocked):
		context.JSON(http.StatusConflict, gin.H{"error": err.Error()})
	case errors.Is(err, gorm.ErrRecordNotFound):
		context.JSON(http.StatusBadRequest, gin.H{"error": "invalid elimination or stage"})
	default:
		// Validation errors intentionally return 400, while database failures are
		// internal errors. No database error produced here has a stable public
		// string that should be exposed.
		if err.Error() == "at least four player sets are required" || err.Error() == "player set ranks must be unique and continuous from 1" || len(err.Error()) >= len("unsupported elimination team_size") && err.Error()[:len("unsupported elimination team_size")] == "unsupported elimination team_size" {
			context.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		context.JSON(http.StatusInternalServerError, gin.H{"error": "bracket operation failed"})
	}
}
