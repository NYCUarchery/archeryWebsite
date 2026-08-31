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
	EliminationID  uint `json:"elimination_id"`
	EntrantCount   int  `json:"entrant_count"`
	AdvancingCount int  `json:"advancing_count"`
	BracketSize    int  `json:"bracket_size"`
	StageCount     int  `json:"stage_count"`
	Created        bool `json:"created"`
}

// BracketInitRequest fixes the size of a bracket before a roster exists.  The
// roster remains editable until scoring, confirmation, winner selection, or
// explicit advancement locks it.
type BracketInitRequest struct {
	AdvancingCount int `json:"advancing_count" binding:"required,min=4,max=128"`
}

type BracketAdvanceResponse struct {
	EliminationID uint  `json:"elimination_id"`
	SourceStageID uint  `json:"source_stage_id"`
	TargetStageID *uint `json:"target_stage_id,omitempty"`
	Finalized     bool  `json:"finalized"`
	Changed       bool  `json:"changed"`
}

// BracketFirstRoundSyncResponse reports whether an open bracket's initial
// seed slots changed. The endpoint never advances a match or locks the roster.
type BracketFirstRoundSyncResponse struct {
	EliminationID uint `json:"elimination_id"`
	Changed       bool `json:"changed"`
}

var (
	errBracketConflict  = errors.New("elimination bracket is partial or incompatible")
	errBracketPending   = errors.New("every source match needs exactly one winner")
	errBracketLocked    = errors.New("complete elimination bracket cannot be changed through manual APIs")
	errBracketEmptySlot = errors.New("cannot score, confirm, or select a winner for an empty bracket slot")
	errBracketUnranked  = errors.New("every player set must have a rank before starting the elimination")
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

// bitReversedSeedOrder returns first-round pairs with odd seeds on the left
// and the paired even seed on the right. For eight slots it is
// 1,8,5,4,3,6,7,2.
func bitReversedSeedOrder(size int) []int {
	order := make([]int, size)
	bits := 0
	for (1 << bits) < size/2 {
		bits++
	}
	for matchIndex := 0; matchIndex < size/2; matchIndex++ {
		reversed := 0
		for bit := 0; bit < bits; bit++ {
			reversed = reversed<<1 | (matchIndex>>bit)&1
		}
		left := 2*reversed + 1
		order[matchIndex*2] = left
		order[matchIndex*2+1] = size + 1 - left
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
		if err := ensureManualBracketMutationAllowed(tx, elimination); err != nil {
			return err
		}
		return mutation(tx, elimination)
	})
}

// ensureManualBracketMutationAllowed is the transaction-level guard shared by
// legacy player-set APIs and the composite match settings endpoint. The caller
// must already hold the elimination row lock.
func ensureManualBracketMutationAllowed(tx *gorm.DB, elimination database.Elimination) error {
	var playerSets []database.PlayerSet
	if err := tx.Where("elimination_id = ?", elimination.ID).Find(&playerSets).Error; err != nil {
		return err
	}
	bracket, err := loadBracket(tx, elimination.ID)
	if err != nil {
		return err
	}
	if elimination.BracketSeedCount > 0 && bracketStageMatchShapeIsComplete(bracket, nextPowerOfTwo(elimination.BracketSeedCount)) {
		return errBracketLocked
	}
	if elimination.BracketSeedCount == 0 && len(playerSets) > 0 && bracketStageMatchShapeIsComplete(bracket, nextPowerOfTwo(len(playerSets))) {
		return errBracketLocked
	}
	return nil
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
				if len(bracket[lastStage].Matches) == 1 {
					if matchIndex >= len(bracket[lastStage].Matches[0].Results) {
						return false, nil
					}
					return bracket[lastStage].Matches[0].Results[matchIndex].PlayerSetId != nil, nil
				}
				if len(bracket[lastStage].Matches) != 2 || matchIndex >= len(bracket[lastStage].Matches[0].Results) || matchIndex >= len(bracket[lastStage].Matches[1].Results) {
					return false, nil
				}
				return bracket[lastStage].Matches[0].Results[matchIndex].PlayerSetId != nil ||
					bracket[lastStage].Matches[1].Results[matchIndex].PlayerSetId != nil, nil
			}
			targetMatch := matchIndex / 2
			targetSlot := matchIndex % 2
			if stageIndex+1 >= len(bracket) || targetMatch >= len(bracket[stageIndex+1].Matches) || targetSlot >= len(bracket[stageIndex+1].Matches[targetMatch].Results) {
				return false, nil
			}
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

func validateBracketSeedCount(seedCount int) error {
	if seedCount < 4 || seedCount > 128 {
		return errors.New("advancing_count must be between 4 and 128")
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
		if playerSet.Rank > 0 && playerSet.Rank <= bracketSize {
			byRank[playerSet.Rank] = playerSet.ID
		}
	}
	firstSlots := make([]*uint, bracketSize)
	for position, seed := range bitReversedSeedOrder(bracketSize) {
		if playerSetID, ok := byRank[seed]; ok {
			id := playerSetID
			firstSlots[position] = &id
		}
	}
	return firstSlots
}

func rankedRoster(playerSets []database.PlayerSet, seedCount int) []database.PlayerSet {
	roster := make([]database.PlayerSet, 0, seedCount)
	for _, playerSet := range playerSets {
		if playerSet.Rank > 0 && playerSet.Rank <= seedCount {
			roster = append(roster, playerSet)
		}
	}
	return roster
}

// validateRosterForLock permits unranked/out-of-cut reserves. Callers also
// validate the complete first-round rank projection before locking play, so a
// reserve can never be mistaken for an active slot.
func validateRosterForLock(playerSets []database.PlayerSet, seedCount int) error {
	seen := make(map[int]bool, len(playerSets))
	for _, playerSet := range playerSets {
		if playerSet.Rank == 0 {
			continue
		}
		if playerSet.Rank < 0 || seen[playerSet.Rank] {
			return errBracketConflict
		}
		seen[playerSet.Rank] = true
	}
	return nil
}

func validateRosterForSetup(playerSets []database.PlayerSet, seedCount int) error {
	seen := make(map[int]bool, len(playerSets))
	for _, playerSet := range playerSets {
		if playerSet.Rank == 0 {
			continue
		}
		if playerSet.Rank < 0 || seen[playerSet.Rank] {
			return errBracketConflict
		}
		seen[playerSet.Rank] = true
	}
	return nil
}

func rosterHasOnlyUnsetRanks(playerSets []database.PlayerSet) bool {
	if len(playerSets) == 0 {
		return false
	}
	for _, playerSet := range playerSets {
		if playerSet.Rank != 0 {
			return false
		}
	}
	return true
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

func bracketShapeIsCompatible(tx *gorm.DB, bracket []bracketStage, playerSets []database.PlayerSet, seedCount, bracketSize, teamSize int) (bool, error) {
	expected := expectedBracketMatchCounts(bracketSize)
	if len(bracket) != len(expected) {
		return false, nil
	}
	if len(bracket) == 0 {
		return false, nil
	}
	// Medal rows remain required bracket structure.  Their PlayerSetId is a
	// materialized result and may be replaced by an administrator correction.
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
	for stageIndex, stage := range bracket {
		if len(stage.Matches) != expected[stageIndex] {
			return false, nil
		}
		stagePlayerSets := make(map[uint]bool)
		for _, match := range stage.Matches {
			if len(match.Results) != 2 {
				return false, nil
			}
			winnerCount := 0
			knownCount := 0
			for _, result := range match.Results {
				isEmptySlot := result.PlayerSetId == nil
				if result.PlayerSetId != nil && !validPlayerSetIDs[*result.PlayerSetId] {
					return false, nil
				}
				if result.PlayerSetId != nil {
					if stagePlayerSets[*result.PlayerSetId] {
						return false, nil
					}
					stagePlayerSets[*result.PlayerSetId] = true
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
				if isEmptySlot && (result.TotalPoints != 0 || result.ShootOffScore != -1 || result.IsWinner) {
					return false, nil
				}
				if result.Target != nil && *result.Target != "A" && *result.Target != "B" {
					return false, nil
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
			if winnerCount > 1 {
				return false, nil
			}
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
	return bracket, nil
}

// syncFirstRoundRoster is the sole writer for a roster-open bracket's first
// round.  It tolerates an empty roster and rank gaps, but refuses to erase a
// result that has started scoring or has been decided.
func syncFirstRoundRoster(tx *gorm.DB, elimination database.Elimination) (bool, error) {
	if elimination.BracketSeedCount == 0 || elimination.BracketRosterLocked {
		return false, nil
	}
	bracketSize := nextPowerOfTwo(elimination.BracketSeedCount)
	bracket, err := loadBracket(tx, elimination.ID)
	if err != nil {
		return false, err
	}
	if !bracketStageMatchShapeIsComplete(bracket, bracketSize) {
		return false, errBracketConflict
	}
	var playerSets []database.PlayerSet
	if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).Where("elimination_id = ?", elimination.ID).Order("`rank` asc, id asc").Find(&playerSets).Error; err != nil {
		return false, err
	}
	if rosterHasOnlyUnsetRanks(playerSets) {
		if _, err := database.AutoRankPlayerSets(tx, elimination.ID); err != nil {
			return false, err
		}
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).Where("elimination_id = ?", elimination.ID).Order("`rank` asc, id asc").Find(&playerSets).Error; err != nil {
			return false, err
		}
	}
	if err := validateRosterForSetup(playerSets, elimination.BracketSeedCount); err != nil {
		return false, err
	}
	expected := expectedFirstRoundSlots(rankedRoster(playerSets, elimination.BracketSeedCount), bracketSize)
	changed := false
	for matchIndex, match := range bracket[0].Matches {
		for resultIndex := range match.Results {
			result := &match.Results[resultIndex]
			want := expected[matchIndex*2+resultIndex]
			if sameOptionalID(result.PlayerSetId, want) {
				continue
			}
			started, err := bracketSlotHasStarted(tx, *result)
			if err != nil {
				return false, err
			}
			if started {
				return false, errBracketConflict
			}
			if err := tx.Model(&database.MatchResult{}).Where("id = ?", result.ID).Update("player_set_id", want).Error; err != nil {
				return false, err
			}
			result.PlayerSetId = want
			changed = true
		}
	}
	return changed, nil
}

func lockBracketRoster(tx *gorm.DB, elimination *database.Elimination) error {
	if elimination.BracketSeedCount == 0 || elimination.BracketRosterLocked {
		return nil
	}
	if err := tx.Model(&database.Elimination{}).Where("id = ?", elimination.ID).Update("bracket_roster_locked", true).Error; err != nil {
		return err
	}
	elimination.BracketRosterLocked = true
	return nil
}

// resolvedWinnerAndLoser accepts empty and one-entrant matches. A one-entrant
// match becomes a BYE only when an administrator advances its stage, never at
// bracket creation time. The returned bool reports whether the match has an
// entrant at all.
func resolvedWinnerAndLoser(tx *gorm.DB, results []database.MatchResult) (*uint, *uint, bool, error) {
	if len(results) != 2 {
		return nil, nil, false, errBracketConflict
	}
	winners := 0
	known := 0
	var winner, loser *uint
	var onlyKnown *database.MatchResult
	for index := range results {
		result := &results[index]
		if result.PlayerSetId != nil {
			known++
			onlyKnown = result
		}
		if result.IsWinner {
			if result.PlayerSetId == nil {
				return nil, nil, false, errBracketConflict
			}
			winners++
			winner = result.PlayerSetId
			continue
		}
		if result.PlayerSetId != nil {
			loser = result.PlayerSetId
		}
	}
	if known == 0 {
		return nil, nil, false, nil
	}
	if known == 1 {
		if winners > 1 {
			return nil, nil, false, errBracketConflict
		}
		if winners == 0 {
			if err := tx.Model(&database.MatchResult{}).Where("id = ?", onlyKnown.ID).Update("is_winner", true).Error; err != nil {
				return nil, nil, false, err
			}
		}
		return onlyKnown.PlayerSetId, nil, true, nil
	}
	if winners != 1 {
		return nil, nil, false, errBracketPending
	}
	return winner, loser, true, nil
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

type bracketSlotProjection struct {
	result      *database.MatchResult
	playerSetID *uint
}

// overwriteBracketSlots projects one or more source outputs into predefined
// child slots. A later correction may replace an earlier projection, retaining
// each target slot's score, confirmation, winner, and placement. Multiple
// destinations are validated together so a semifinal winner/loser correction
// can atomically swap gold and bronze entries.
func overwriteBracketSlots(tx *gorm.DB, stage *bracketStage, projections []bracketSlotProjection) (bool, error) {
	destinationIDs := make(map[uint]bool, len(projections))
	proposed := make(map[uint]*uint, len(projections))
	for _, projection := range projections {
		if projection.result == nil || destinationIDs[projection.result.ID] {
			return false, errBracketConflict
		}
		destinationIDs[projection.result.ID] = true
		proposed[projection.result.ID] = projection.playerSetID
	}
	// A projected winner may already occupy a sibling target slot because an
	// earlier write was stale. Treat that as a stage-local permutation: move
	// the displaced destination identity into the old sibling slot, then check
	// the whole resulting stage. This is required for A/B child-slot swaps.
	desired := make(map[uint]bool, len(projections))
	for _, playerSetID := range proposed {
		if playerSetID != nil {
			desired[*playerSetID] = true
		}
	}
	locations := make(map[uint][]*database.MatchResult)
	for matchIndex := range stage.Matches {
		for resultIndex := range stage.Matches[matchIndex].Results {
			result := &stage.Matches[matchIndex].Results[resultIndex]
			if result.PlayerSetId != nil {
				locations[*result.PlayerSetId] = append(locations[*result.PlayerSetId], result)
			}
		}
	}
	// Both sides below deliberately use caller projection order. A map may
	// index identities, but must never choose which displaced identity goes to
	// which external source slot: that mapping is observable score ownership.
	displaced := make([]*uint, 0, len(projections))
	for _, projection := range projections {
		if projection.result.PlayerSetId == nil || !desired[*projection.result.PlayerSetId] {
			displaced = append(displaced, projection.result.PlayerSetId)
		}
	}
	external := make([]*database.MatchResult, 0, len(projections))
	for _, projection := range projections {
		if projection.playerSetID == nil {
			continue
		}
		for _, result := range locations[*projection.playerSetID] {
			if !destinationIDs[result.ID] {
				external = append(external, result)
			}
		}
	}
	if len(external) > len(displaced) {
		return false, errBracketConflict
	}
	for index, result := range external {
		if _, duplicatedRewrite := proposed[result.ID]; duplicatedRewrite {
			return false, errBracketConflict
		}
		proposed[result.ID] = displaced[index]
	}
	// Validate the whole post-write stage, rather than each individual update.
	// This permits a legitimate cross-match swap without a transient duplicate,
	// while still rejecting a request that leaves any double booking behind.
	seen := make(map[uint]bool)
	for _, match := range stage.Matches {
		for _, candidate := range match.Results {
			playerSetID := candidate.PlayerSetId
			if replacement, isDestination := proposed[candidate.ID]; isDestination {
				playerSetID = replacement
			}
			if playerSetID == nil {
				continue
			}
			if seen[*playerSetID] {
				return false, errBracketConflict
			}
			seen[*playerSetID] = true
		}
	}
	changed := false
	for matchIndex := range stage.Matches {
		for resultIndex := range stage.Matches[matchIndex].Results {
			result := &stage.Matches[matchIndex].Results[resultIndex]
			playerSetID, rewritten := proposed[result.ID]
			if !rewritten || sameOptionalID(result.PlayerSetId, playerSetID) {
				continue
			}
			if err := tx.Model(&database.MatchResult{}).Where("id = ?", result.ID).Update("player_set_id", playerSetID).Error; err != nil {
				return false, err
			}
			if playerSetID == nil {
				result.PlayerSetId = nil
			} else {
				id := *playerSetID
				result.PlayerSetId = &id
			}
			changed = true
		}
	}
	return changed, nil
}

func overwriteBracketSlot(tx *gorm.DB, stage *bracketStage, result *database.MatchResult, playerSetID *uint) (bool, error) {
	return overwriteBracketSlots(tx, stage, []bracketSlotProjection{{result: result, playerSetID: playerSetID}})
}

func explicitWinnerAndLoser(results []database.MatchResult) (*uint, *uint, bool, error) {
	if len(results) != 2 {
		return nil, nil, false, errBracketConflict
	}
	var winner, loser *uint
	winnerCount := 0
	for _, result := range results {
		if result.IsWinner {
			if result.PlayerSetId == nil {
				return nil, nil, false, errBracketConflict
			}
			winnerCount++
			winner = result.PlayerSetId
			continue
		}
		loser = result.PlayerSetId
	}
	if winnerCount > 1 {
		return nil, nil, false, errBracketConflict
	}
	return winner, loser, winnerCount == 1, nil
}

// projectDecidedStages batches all changed sources of each stage before it
// writes their child slots. It avoids map-order dependent duplicate conflicts:
// cross-match swaps are evaluated as one final target-stage configuration.
// resolveByes is used only by explicit stage advancement; recovery follows
// explicit winner flags and never invents a result.
func projectDecidedStages(tx *gorm.DB, bracket []bracketStage, stageIndex int, affected map[int]bool, resolveByes, cascade bool) (bool, error) {
	if stageIndex < 0 || stageIndex >= len(bracket) {
		return false, errBracketConflict
	}
	lastStage := len(bracket) - 1
	if stageIndex == lastStage || len(affected) == 0 {
		return false, nil
	}
	projections := make([]bracketSlotProjection, 0, len(affected)*2)
	nextAffected := make(map[int]bool)
	for matchIndex := range bracket[stageIndex].Matches {
		if !affected[matchIndex] {
			continue
		}
		var winner, loser *uint
		var decided bool
		var err error
		if resolveByes {
			winner, loser, decided, err = resolvedWinnerAndLoser(tx, bracket[stageIndex].Matches[matchIndex].Results)
		} else {
			winner, loser, decided, err = explicitWinnerAndLoser(bracket[stageIndex].Matches[matchIndex].Results)
		}
		if err != nil {
			return false, err
		}
		if !decided {
			continue
		}
		if stageIndex == lastStage-1 {
			if len(bracket[lastStage].Matches) == 1 {
				if matchIndex >= len(bracket[lastStage].Matches[0].Results) {
					return false, errBracketConflict
				}
				projections = append(projections, bracketSlotProjection{result: &bracket[lastStage].Matches[0].Results[matchIndex], playerSetID: winner})
				nextAffected[0] = true
				continue
			}
			if len(bracket[lastStage].Matches) != 2 || matchIndex >= len(bracket[lastStage].Matches[0].Results) || matchIndex >= len(bracket[lastStage].Matches[1].Results) {
				return false, errBracketConflict
			}
			projections = append(projections,
				bracketSlotProjection{result: &bracket[lastStage].Matches[0].Results[matchIndex], playerSetID: winner},
				bracketSlotProjection{result: &bracket[lastStage].Matches[1].Results[matchIndex], playerSetID: loser},
			)
			nextAffected[0], nextAffected[1] = true, true
			continue
		}
		targetMatch, targetSlot := matchIndex/2, matchIndex%2
		if targetMatch >= len(bracket[stageIndex+1].Matches) || targetSlot >= len(bracket[stageIndex+1].Matches[targetMatch].Results) {
			return false, errBracketConflict
		}
		projections = append(projections, bracketSlotProjection{result: &bracket[stageIndex+1].Matches[targetMatch].Results[targetSlot], playerSetID: winner})
		nextAffected[targetMatch] = true
	}
	if len(projections) == 0 {
		return false, nil
	}
	changed, err := overwriteBracketSlots(tx, &bracket[stageIndex+1], projections)
	if err != nil || !cascade {
		return changed, err
	}
	// overwriteBracketSlots may have performed a sibling swap while resolving
	// stale target data. Every next-stage match is therefore eligible to carry
	// its already-selected winner forward.
	for matchIndex := range bracket[stageIndex+1].Matches {
		nextAffected[matchIndex] = true
	}
	propagated, err := projectDecidedStages(tx, bracket, stageIndex+1, nextAffected, false, true)
	return changed || propagated, err
}

func bracketSlotIsBlank(tx *gorm.DB, result database.MatchResult) (bool, error) {
	if result.PlayerSetId != nil {
		return false, nil
	}
	started, err := bracketSlotHasStarted(tx, result)
	return !started, err
}

// bracketSlotHasStarted ignores roster and placement metadata. It is used by
// roster-open synchronisation, which may replace or clear PlayerSetId but may
// never erase score, confirmation, or winner state.
func bracketSlotHasStarted(tx *gorm.DB, result database.MatchResult) (bool, error) {
	if result.TotalPoints != 0 || result.ShootOffScore != -1 || result.IsWinner {
		return true, nil
	}
	var ends []database.MatchEnd
	if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).Where("match_result_id = ?", result.ID).Find(&ends).Error; err != nil {
		return false, err
	}
	for _, end := range ends {
		if end.TotalScore != 0 || end.IsConfirmed {
			return true, nil
		}
		var scores []database.MatchScore
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).Where("match_end_id = ?", end.ID).Find(&scores).Error; err != nil {
			return false, err
		}
		for _, score := range scores {
			if score.Score != -1 {
				return true, nil
			}
		}
	}
	return false, nil
}

func advanceSourceMatch(tx *gorm.DB, bracket []bracketStage, stageIndex, matchIndex int) (bool, error) {
	winner, loser, occupied, err := resolvedWinnerAndLoser(tx, bracket[stageIndex].Matches[matchIndex].Results)
	if err != nil {
		return false, err
	}
	if !occupied {
		return false, nil
	}
	lastStage := len(bracket) - 1
	if stageIndex == lastStage {
		return false, nil
	}
	if stageIndex == lastStage-1 { // semi-final: winner to gold, loser to bronze
		return overwriteBracketSlots(tx, &bracket[lastStage], []bracketSlotProjection{
			{result: &bracket[lastStage].Matches[0].Results[matchIndex], playerSetID: winner},
			{result: &bracket[lastStage].Matches[1].Results[matchIndex], playerSetID: loser},
		})
	}
	targetMatch := matchIndex / 2
	targetSlot := matchIndex % 2
	return overwriteBracketSlot(tx, &bracket[stageIndex+1], &bracket[stageIndex+1].Matches[targetMatch].Results[targetSlot], winner)
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
			propagated, err := advanceSourceMatch(tx, bracket, 0, matchIndex)
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

func overwriteMedalPlayerSet(tx *gorm.DB, eliminationID uint, medalType int, playerSetID *uint) (bool, error) {
	var medal database.Medal
	if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).Where("elimination_id = ? AND type = ?", eliminationID, medalType).First(&medal).Error; err != nil {
		return false, err
	}
	want := uint(0)
	if playerSetID != nil {
		want = *playerSetID
	}
	if medal.PlayerSetId == want {
		return false, nil
	}
	if err := tx.Model(&database.Medal{}).Where("id = ?", medal.ID).Update("player_set_id", want).Error; err != nil {
		return false, err
	}
	return true, nil
}

// reprojectBracketMedals makes medal rows a materialized view of final match
// identities.  Forced PlayerSet corrections may happen after a final was
// finalized, so stale medal rows must be replaced rather than treated as a
// conflict.
func reprojectBracketMedals(tx *gorm.DB, eliminationID uint, final bracketStage) (bool, error) {
	if len(final.Matches) == 1 {
		gold, silver, decided, err := explicitWinnerAndLoser(final.Matches[0].Results)
		if err != nil || !decided {
			return false, err
		}
		goldChanged, err := overwriteMedalPlayerSet(tx, eliminationID, 0, gold)
		if err != nil {
			return false, err
		}
		silverChanged, err := overwriteMedalPlayerSet(tx, eliminationID, 1, silver)
		return goldChanged || silverChanged, err
	}
	if len(final.Matches) != 2 {
		return false, errBracketConflict
	}
	gold, silver, goldDecided, err := explicitWinnerAndLoser(final.Matches[0].Results)
	if err != nil {
		return false, err
	}
	bronze, _, bronzeDecided, err := explicitWinnerAndLoser(final.Matches[1].Results)
	if err != nil {
		return false, err
	}
	placements := []*uint{nil, nil, nil}
	resolved := []bool{false, false, false}
	if goldDecided {
		placements[0], placements[1] = gold, silver
		resolved[0], resolved[1] = true, true
	}
	if bronzeDecided {
		placements[2] = bronze
		resolved[2] = true
	}
	changed := false
	for medalType, playerSetID := range placements {
		if !resolved[medalType] {
			continue
		}
		updated, err := overwriteMedalPlayerSet(tx, eliminationID, medalType, playerSetID)
		if err != nil {
			return false, err
		}
		changed = changed || updated
	}
	return changed, nil
}

func finalizeBracket(tx *gorm.DB, eliminationID uint, final bracketStage) (bool, error) {
	if len(final.Matches) == 1 {
		gold, silver, occupied, err := resolvedWinnerAndLoser(tx, final.Matches[0].Results)
		if err != nil || !occupied {
			return false, err
		}
		goldChanged, err := overwriteMedalPlayerSet(tx, eliminationID, 0, gold)
		if err != nil {
			return false, err
		}
		silverChanged, err := overwriteMedalPlayerSet(tx, eliminationID, 1, silver)
		return goldChanged || silverChanged, err
	}
	if len(final.Matches) != 2 {
		return false, errBracketConflict
	}
	gold, silver, goldOccupied, err := resolvedWinnerAndLoser(tx, final.Matches[0].Results)
	if err != nil {
		return false, err
	}
	bronze, _, bronzeOccupied, err := resolvedWinnerAndLoser(tx, final.Matches[1].Results)
	if err != nil {
		return false, err
	}
	placements := []*uint{nil, nil, nil}
	if goldOccupied {
		placements[0], placements[1] = gold, silver
	}
	if bronzeOccupied {
		placements[2] = bronze
	}
	changed := false
	for medalType, playerSetID := range placements {
		updated, err := overwriteMedalPlayerSet(tx, eliminationID, medalType, playerSetID)
		if err != nil {
			return false, err
		}
		changed = changed || updated
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
//	@Accept		json
//	@Produce		json
//	@Param			id	path	int	true	"Elimination ID"
//	@Param			request	body	endpoint.BracketInitRequest	true	"Fixed advancing count"
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
	var request BracketInitRequest
	if err := context.ShouldBindJSON(&request); err != nil {
		context.JSON(http.StatusBadRequest, gin.H{"error": "invalid bracket request"})
		return
	}
	if err := validateBracketSeedCount(request.AdvancingCount); err != nil {
		context.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
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
		// Legacy manual PlayerSet creation leaves Rank at its zero value. When
		// no rank has been saved at all, derive the normal score-oriented rank
		// before seeding. A partially or fully saved ranking remains authoritative.
		if rosterHasOnlyUnsetRanks(playerSets) {
			if _, err := database.AutoRankPlayerSets(tx, id); err != nil {
				return err
			}
			if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).Where("elimination_id = ?", id).Order("`rank` asc, id asc").Find(&playerSets).Error; err != nil {
				return err
			}
		}
		if err := validateRosterForSetup(playerSets, request.AdvancingCount); err != nil {
			return err
		}
		var medals []database.Medal
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).Where("elimination_id = ?", id).Order("type asc, id asc").Find(&medals).Error; err != nil {
			return err
		}
		if len(medals) != 3 || medals[0].Type != 0 || medals[1].Type != 1 || medals[2].Type != 2 {
			return errBracketConflict
		}
		bracketSize := nextPowerOfTwo(request.AdvancingCount)
		bracket, err := loadBracket(tx, id)
		if err != nil {
			return err
		}
		created := false
		if len(bracket) != 0 {
			if elimination.BracketSeedCount == 0 || elimination.BracketSeedCount != request.AdvancingCount {
				return errBracketConflict
			}
			if !elimination.BracketRosterLocked {
				if _, err := syncFirstRoundRoster(tx, elimination); err != nil {
					return err
				}
				bracket, err = loadBracket(tx, id)
				if err != nil {
					return err
				}
				if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).Where("elimination_id = ?", id).Order("`rank` asc, id asc").Find(&playerSets).Error; err != nil {
					return err
				}
			}
			compatible, err := bracketShapeIsCompatible(tx, bracket, playerSets, request.AdvancingCount, bracketSize, elimination.TeamSize)
			if err != nil {
				return err
			}
			if !compatible {
				return errBracketConflict
			}
		} else {
			elimination.BracketSeedCount = request.AdvancingCount
			elimination.BracketRosterLocked = false
			if err := tx.Model(&database.Elimination{}).Where("id = ?", id).Updates(map[string]interface{}{
				"bracket_seed_count":    request.AdvancingCount,
				"bracket_roster_locked": false,
			}).Error; err != nil {
				return err
			}
			if _, err := createBracket(tx, elimination, rankedRoster(playerSets, request.AdvancingCount), bracketSize); err != nil {
				return err
			}
			if _, err := syncFirstRoundRoster(tx, elimination); err != nil {
				return err
			}
			created = true
		}
		data = BracketInitResponse{EliminationID: id, EntrantCount: len(playerSets), AdvancingCount: request.AdvancingCount, BracketSize: bracketSize, StageCount: len(expectedBracketMatchCounts(bracketSize)), Created: created}
		return nil
	})
	if err != nil {
		writeBracketError(context, err)
		return
	}
	context.JSON(http.StatusOK, data)
}

// PostEliminationBracketFirstRoundSync reconciles an unstarted bracket's
// first-round slots with the persisted PlayerSet ranks. It is intentionally
// separate from stage advancement so an administrator can inspect the seeded
// bracket before locking it by scoring or advancing.
//
//	@Summary		Synchronize an open elimination bracket's first round
//	@Description	Locks the elimination and PlayerSet rows, validates the complete bracket shape and current setup ranks, then fills or clears only unstarted first-round seed slots. Requires a competition Admin. It is idempotent and does not lock the roster or advance matches.
//	@Tags			Elimination
//	@Produce		json
//	@Param			id	path	int	true	"Elimination ID"
//	@Success		200	{object}	endpoint.BracketFirstRoundSyncResponse
//	@Failure		400	{object}	response.ErrorResponse
//	@Failure		403	{object}	response.ErrorResponse
//	@Failure		409	{object}	response.ErrorResponse
//	@Failure		500	{object}	response.ErrorResponse
//	@Router			/elimination/bracket/{id}/sync-first-round [post]
func PostEliminationBracketFirstRoundSync(context *gin.Context) {
	id := Convert2uint(context, "id")
	elimination, err := database.GetOnlyEliminationById(id)
	if err != nil || elimination.ID == 0 {
		context.JSON(http.StatusBadRequest, gin.H{"error": "invalid elimination ID"})
		return
	}
	if !requireEliminationCompetitionAdmin(context, elimination) {
		return
	}

	data := BracketFirstRoundSyncResponse{EliminationID: id}
	err = database.DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&elimination, id).Error; err != nil {
			return err
		}
		if elimination.BracketSeedCount == 0 || elimination.BracketRosterLocked {
			return errBracketConflict
		}
		bracketSize := nextPowerOfTwo(elimination.BracketSeedCount)
		bracket, err := loadBracket(tx, id)
		if err != nil {
			return err
		}
		if !bracketStageMatchShapeIsComplete(bracket, bracketSize) {
			return errBracketConflict
		}
		var playerSets []database.PlayerSet
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).Where("elimination_id = ?", id).Order("`rank` asc, id asc").Find(&playerSets).Error; err != nil {
			return err
		}
		if err := validateRosterForSetup(playerSets, elimination.BracketSeedCount); err != nil {
			return err
		}
		changed, err := syncFirstRoundRoster(tx, elimination)
		if err != nil {
			return err
		}
		data.Changed = changed
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
		if elimination.BracketSeedCount == 0 {
			// Historical brackets predate roster synchronisation. They retain the
			// previous immutable contract rather than guessing a seed count.
			return errBracketConflict
		}
		if !elimination.BracketRosterLocked {
			if _, err := syncFirstRoundRoster(tx, elimination); err != nil {
				return err
			}
		}
		bracketSize := nextPowerOfTwo(elimination.BracketSeedCount)
		var playerSets []database.PlayerSet
		if err := tx.Where("elimination_id = ?", elimination.ID).Find(&playerSets).Error; err != nil {
			return err
		}
		if err := validateRosterForLock(playerSets, elimination.BracketSeedCount); err != nil {
			return err
		}
		bracket, err := loadBracket(tx, elimination.ID)
		if err != nil {
			return err
		}
		compatible, err := bracketShapeIsCompatible(tx, bracket, playerSets, elimination.BracketSeedCount, bracketSize, elimination.TeamSize)
		if err != nil {
			return err
		}
		if !compatible {
			return errBracketConflict
		}
		if err := lockBracketRoster(tx, &elimination); err != nil {
			return err
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
		affected := make(map[int]bool, len(bracket[sourceIndex].Matches))
		for matchIndex := range bracket[sourceIndex].Matches {
			affected[matchIndex] = true
		}
		changed, err := projectDecidedStages(tx, bracket, sourceIndex, affected, true, false)
		if err != nil {
			return err
		}
		data.Changed = changed
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
	case errors.Is(err, errBracketConflict), errors.Is(err, errBracketPending), errors.Is(err, errBracketLocked), errors.Is(err, errBracketEmptySlot), errors.Is(err, errBracketUnranked):
		context.JSON(http.StatusConflict, gin.H{"error": err.Error()})
	case errors.Is(err, errInvalidPlacement), errors.Is(err, errPlacementMode):
		context.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
	case errors.Is(err, gorm.ErrRecordNotFound):
		context.JSON(http.StatusBadRequest, gin.H{"error": "invalid elimination or stage"})
	default:
		// Validation errors intentionally return 400, while database failures are
		// internal errors. No database error produced here has a stable public
		// string that should be exposed.
		if err.Error() == "advancing_count must be between 4 and 128" || len(err.Error()) >= len("unsupported elimination team_size") && err.Error()[:len("unsupported elimination team_size")] == "unsupported elimination team_size" {
			context.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		context.JSON(http.StatusInternalServerError, gin.H{"error": "bracket operation failed"})
	}
}
