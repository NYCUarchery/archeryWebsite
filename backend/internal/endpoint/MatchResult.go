package endpoint

import (
	"backend/internal/database"
	response "backend/internal/response"

	"encoding/json"
	"errors"
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

func lockRosterForEliminationScoring(tx *gorm.DB, eliminationID uint) error {
	var elimination database.Elimination
	if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&elimination, eliminationID).Error; err != nil {
		return err
	}
	if elimination.BracketSeedCount == 0 {
		return nil
	}
	var playerSets []database.PlayerSet
	if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).Where("elimination_id = ?", eliminationID).Find(&playerSets).Error; err != nil {
		return err
	}
	if err := validateRosterForLock(playerSets, elimination.BracketSeedCount); err != nil {
		return err
	}
	bracketSize := nextPowerOfTwo(elimination.BracketSeedCount)
	bracket, err := loadBracket(tx, eliminationID)
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
	return lockBracketRoster(tx, &elimination)
}

func rosterEliminationForMatchResult(tx *gorm.DB, matchResultID uint) (uint, error) {
	var relation struct{ EliminationID uint }
	err := tx.Table("match_results").Select("stages.elimination_id AS elimination_id").
		Joins("JOIN matches ON matches.id = match_results.match_id").
		Joins("JOIN stages ON stages.id = matches.stage_id").
		Where("match_results.id = ?", matchResultID).Take(&relation).Error
	return relation.EliminationID, err
}

func rosterEliminationForMatchEnd(tx *gorm.DB, matchEndID uint) (uint, error) {
	var relation struct{ EliminationID uint }
	err := tx.Table("match_ends").Select("stages.elimination_id AS elimination_id").
		Joins("JOIN match_results ON match_results.id = match_ends.match_result_id").
		Joins("JOIN matches ON matches.id = match_results.match_id").
		Joins("JOIN stages ON stages.id = matches.stage_id").
		Where("match_ends.id = ?", matchEndID).Take(&relation).Error
	return relation.EliminationID, err
}

func rosterEliminationForMatchScore(tx *gorm.DB, matchScoreID uint) (uint, error) {
	var relation struct{ EliminationID uint }
	err := tx.Table("match_scores").Select("stages.elimination_id AS elimination_id").
		Joins("JOIN match_ends ON match_ends.id = match_scores.match_end_id").
		Joins("JOIN match_results ON match_results.id = match_ends.match_result_id").
		Joins("JOIN matches ON matches.id = match_results.match_id").
		Joins("JOIN stages ON stages.id = matches.stage_id").
		Where("match_scores.id = ?", matchScoreID).Take(&relation).Error
	return relation.EliminationID, err
}

// requireOccupiedMatchResult is deliberately called only after the
// elimination row has been locked. Roster synchronisation takes the same lock,
// so a seed slot cannot be cleared between this check and the score write.
func requireOccupiedMatchResult(tx *gorm.DB, matchResultID uint) error {
	var result database.MatchResult
	if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).Select("id", "player_set_id").First(&result, matchResultID).Error; err != nil {
		return err
	}
	if result.PlayerSetId == nil {
		return errBracketEmptySlot
	}
	return nil
}

func matchResultForMatchEnd(tx *gorm.DB, matchEndID uint) (uint, error) {
	var end database.MatchEnd
	if err := tx.Select("match_result_id").First(&end, matchEndID).Error; err != nil {
		return 0, err
	}
	return end.MatchResultId, nil
}

func matchResultForMatchScore(tx *gorm.DB, matchScoreID uint) (uint, error) {
	var relation struct{ MatchResultID uint }
	err := tx.Table("match_scores").Select("match_ends.match_result_id AS match_result_id").
		Joins("JOIN match_ends ON match_ends.id = match_scores.match_end_id").
		Where("match_scores.id = ?", matchScoreID).Take(&relation).Error
	return relation.MatchResultID, err
}

func IsGetMatchResult(context *gin.Context, id uint) (bool, database.MatchResult) {
	if response.ErrorIdTest(context, id, database.GetMatchResultIsExist(id), "MatchResult") {
		return false, database.MatchResult{}
	}
	data, err := database.GetMatchResultById(id)
	if response.ErrorInternalErrorTest(context, id, "Get MatchResult", err) {
		return false, data
	}
	response.AcceptPrint(id, fmt.Sprint(data), "MatchResult")
	return true, data
}

func IsGetMatchResultWScoresById(context *gin.Context, id uint) (bool, database.MatchResult) {
	if response.ErrorIdTest(context, id, database.GetMatchResultIsExist(id), "MatchResult") {
		return false, database.MatchResult{}
	}
	data, err := database.GetMatchResultWScoresById(id)
	if response.ErrorInternalErrorTest(context, id, "Get MatchResult with scores", err) {
		return false, data
	}
	response.AcceptPrint(id, fmt.Sprint(data), "MatchResult with scores")
	return true, data
}

// Get MatchResult By ID godoc
//
//	@Summary		Show one MatchResult with player set
//	@Description	Get one MatchResult with player set by id
//	@Tags			MatchResult
//	@Produce		json
//	@Param			id	path		int																									true	"MatchResult ID"
//	@Success		200	{object}	database.MatchResult{player_set=database.PlayerSet{players=response.Nill},match_ends=response.Nill}	"success, return MatchResult with player set"
//	@Failure		400	{object}	response.ErrorIdResponse																			"invalid match result ID, maybe not exist"
//	@Failure		500	{object}	response.ErrorInternalErrorResponse																	"internal db failed for getting match result"
//	@Router			/matchresult/{id} [get]
func GetMatchResultById(context *gin.Context) {
	uid := Convert2uint(context, "id")
	isExist, data := IsGetMatchResult(context, uid)
	if !isExist {
		return
	}
	context.IndentedJSON(200, data)
}

// Get MatchResult with scores By ID godoc
//
//	@Summary		Show one MatchResult with match_ends, match_scores, player set
//	@Description	Get one MatchResult with match_ends, match_scores, player set by id
//	@Tags			MatchResult
//	@Produce		json
//	@Param			id	path		int																			true	"MatchResult ID"
//	@Success		200	{object}	database.MatchResult{player_set=database.PlayerSet{players=response.Nill}}	"success, return MatchResult with scores"
//	@Failure		400	{object}	response.ErrorIdResponse													"invalid match result ID, maybe not exist"
//	@Failure		500	{object}	response.ErrorInternalErrorResponse											"internal db failed for getting match result with scores"
//	@Router			/matchresult/scores/{id} [get]
func GetMatchResultWScoresById(context *gin.Context) {
	uid := Convert2uint(context, "id")
	isExist, data := IsGetMatchResultWScoresById(context, uid)
	if !isExist {
		return
	}
	context.IndentedJSON(200, data)
}

func PostMatchEndByMatchResultId(context *gin.Context, matchResultId uint, teamsize int) bool {
	var data database.MatchEnd
	if response.ErrorIdTest(context, matchResultId, database.GetMatchResultIsExist(matchResultId), "MatchResult when creating matchEnd") {
		return false
	}
	data.MatchResultId = matchResultId
	data.TotalScore = 0
	data.IsConfirmed = false
	newData, err := database.CreateMatchEnd(data)
	if response.ErrorInternalErrorTest(context, matchResultId, "Post MatchEnd", err) {
		return false
	}
	/*create arrows*/
	var arrowNum int
	switch teamsize {
	case 1:
		arrowNum = 3
	case 2:
		arrowNum = 4
	case 3:
		arrowNum = 6
	default:
		arrowNum = 0
		return false
	}
	for i := 0; i < arrowNum; i++ {
		PostMatchScore(context, newData.ID)
	}
	response.AcceptPrint(matchResultId, fmt.Sprint(data), "MatchEnd")
	return true
}

// Post MatchEnd godoc
//
//	@Summary		Create one MatchEnd
//	@Description	Post one new MatchEnd data,
//	@Description	Auto write totalScores IsConfirmed, and auto create matchScores by teamSize
//	@Description	teamSize: 1, 2, 3
//	@Tags			MatchEnd
//	@Accept			json
//	@Produce		json
//	@Param			matchEndData	body		endpoint.PostMatchEnd.matchEndData	true	"matchEndData"
//	@Success		200				{object}	response.Response					"success, return nil"
//	@Failure		400				{object}	response.ErrorReceiveDataResponse	"invalid match result ID, maybe not exist"
//	@Failure		500				{object}	response.ErrorInternalErrorResponse	"internal db failed for creating matchEnd, creating matchScores"
//	@Failure		403	{object}	response.ErrorResponse	"competition admin required"
//	@Failure		409	{object}	response.ErrorResponse	"complete bracket is locked"
//	@Router			/matchresult/matchend [post]
func PostMatchEnd(context *gin.Context) {
	type matchEndData struct {
		MatchResultId uint `json:"match_result_id"`
		TeamSize      int  `json:"team_size"`
	}
	var data matchEndData
	err := context.BindJSON(&data)
	if response.ErrorReceiveDataTest(context, data.MatchResultId, "MatchEndData when creating matchEnd", err) {
		return
	} else if response.ErrorIdTest(context, data.MatchResultId, database.GetMatchResultIsExist(data.MatchResultId), "MatchResult when creating matchEnd") {
		return
	}
	var relation struct {
		EliminationID uint
	}
	err = database.DB.Table("match_results").
		Select("stages.elimination_id AS elimination_id").
		Joins("JOIN matches ON matches.id = match_results.match_id").
		Joins("JOIN stages ON stages.id = matches.stage_id").
		Where("match_results.id = ?", data.MatchResultId).
		Take(&relation).Error
	if response.ErrorInternalErrorTest(context, data.MatchResultId, "Get elimination when creating MatchEnd", err) {
		return
	}
	elimination, err := database.GetOnlyEliminationById(relation.EliminationID)
	if response.ErrorInternalErrorTest(context, relation.EliminationID, "Get elimination when creating MatchEnd", err) {
		return
	}
	if !requireEliminationCompetitionAdmin(context, elimination) {
		return
	}
	err = withManualBracketMutation(relation.EliminationID, func(tx *gorm.DB, lockedElimination database.Elimination) error {
		if data.TeamSize != lockedElimination.TeamSize {
			return fmt.Errorf("unsupported elimination team_size %d", data.TeamSize)
		}
		var resultCount int64
		if err := tx.Table("match_results").
			Joins("JOIN matches ON matches.id = match_results.match_id").
			Joins("JOIN stages ON stages.id = matches.stage_id").
			Where("match_results.id = ? AND stages.elimination_id = ?", data.MatchResultId, relation.EliminationID).
			Count(&resultCount).Error; err != nil {
			return err
		}
		if resultCount != 1 {
			return gorm.ErrRecordNotFound
		}
		matchEnd := database.MatchEnd{MatchResultId: data.MatchResultId, TotalScore: 0, IsConfirmed: false}
		if err := tx.Create(&matchEnd).Error; err != nil {
			return err
		}
		_, arrowsPerEnd, err := matchEndsAndArrows(data.TeamSize)
		if err != nil {
			return err
		}
		for index := 0; index < arrowsPerEnd; index++ {
			if err := tx.Create(&database.MatchScore{MatchEndId: matchEnd.ID, Score: -1}).Error; err != nil {
				return err
			}
		}
		return nil
	})
	if err != nil {
		writeBracketError(context, err)
		return
	}
	context.IndentedJSON(200, nil)
}
func PostMatchScore(context *gin.Context, matchEndId uint) bool {
	var data database.MatchScore
	if response.ErrorIdTest(context, matchEndId, database.GetMatchEndIsExist(matchEndId), "MatchEnd when creating matchScore") {
		return false
	}
	data.MatchEndId = matchEndId
	data.Score = -1
	newData, err := database.CreateMatchScore(data)
	if response.ErrorInternalErrorTest(context, newData.ID, "Post MatchScore", err) {
		return false
	}
	response.AcceptPrint(newData.ID, fmt.Sprint(newData), "MatchScore")
	return true
}

// Put MatchResult totalpoints godoc
//
//	@Summary		Update one MatchResult totalPoints
//	@Description	Update one MatchResult totalPoints by id
//	@Tags			MatchResult
//	@Accept			json
//	@Param			id			path		int																	true	"MatchResult ID"
//	@Param			MatchResult	body		endpoint.PutMatchResultTotalPointsById.matchResultTotalPointsData	true	"MatchResult"
//	@Success		200			{object}	response.Nill														"success, return nil"
//	@Failure		400			{object}	response.ErrorIdResponse											"invalid match result ID, maybe not exist"
//	@Failure		500			{object}	response.ErrorInternalErrorResponse									"internal db failed for updating totalPoints"
//	@Failure		409	{object}	response.ErrorResponse	"empty bracket slot or roster conflict"
//	@Router			/matchresult/totalpoints/{id} [patch]
func PutMatchResultTotalPointsById(context *gin.Context) {
	type matchResultTotalPointsData struct {
		TotalPoints int `json:"total_points"`
	}
	_ = matchResultTotalPointsData{}
	id := Convert2uint(context, "id")
	var data database.MatchResult
	err := context.BindJSON(&data)
	if response.ErrorIdTest(context, id, database.GetMatchResultIsExist(id), "MatchResult when updating totalPoints") {
		return
	} else if response.ErrorReceiveDataTest(context, id, "MatchResult when updating totalPoints", err) {
		return
	}
	err = database.DB.Transaction(func(tx *gorm.DB) error {
		eliminationID, err := rosterEliminationForMatchResult(tx, id)
		if err != nil {
			return err
		}
		if err := lockRosterForEliminationScoring(tx, eliminationID); err != nil {
			return err
		}
		if err := requireOccupiedMatchResult(tx, id); err != nil {
			return err
		}
		return tx.Model(&database.MatchResult{}).Where("id = ?", id).Update("total_points", data.TotalPoints).Error
	})
	if err != nil {
		writeBracketError(context, err)
		return
	}
	response.AcceptPrint(id, fmt.Sprint(data), "MatchResult totalPoints")
	context.IndentedJSON(200, nil)
}

// Put MatchResult shootOffScore godoc
//
//	@Summary		Update one MatchResult shootOffScore
//	@Description	Update one MatchResult shootOffScore by id
//	@Tags			MatchResult
//	@Accept			json
//	@Param			id			path		int																		true	"MatchResult ID"
//	@Param			MatchResult	body		endpoint.PutMatchResultShootOffScoreById.matchResultShootOffScoreData	true	"MatchResult"
//	@Success		200			{object}	response.Nill															"success, return nil"
//	@Failure		400			{object}	response.ErrorIdResponse												"invalid match result ID, maybe not exist"
//	@Failure		500			{object}	response.ErrorInternalErrorResponse										"internal db failed for updating shootOffScore"
//	@Failure		409	{object}	response.ErrorResponse	"empty bracket slot or roster conflict"
//	@Router			/matchresult/shootoffscore/{id} [patch]
func PutMatchResultShootOffScoreById(context *gin.Context) {
	type matchResultShootOffScoreData struct {
		ShootOffScore int `json:"shoot_off_score"`
	}
	_ = matchResultShootOffScoreData{}
	id := Convert2uint(context, "id")
	var data database.MatchResult
	err := context.BindJSON(&data)
	if response.ErrorIdTest(context, id, database.GetMatchResultIsExist(id), "MatchResult when updating shootOffScore") {
		return
	} else if response.ErrorReceiveDataTest(context, id, "MatchResult when updating shootOffScore", err) {
		return
	}
	err = database.DB.Transaction(func(tx *gorm.DB) error {
		eliminationID, err := rosterEliminationForMatchResult(tx, id)
		if err != nil {
			return err
		}
		if err := lockRosterForEliminationScoring(tx, eliminationID); err != nil {
			return err
		}
		if err := requireOccupiedMatchResult(tx, id); err != nil {
			return err
		}
		return tx.Model(&database.MatchResult{}).Where("id = ?", id).Update("shoot_off_score", data.ShootOffScore).Error
	})
	if err != nil {
		writeBracketError(context, err)
		return
	}
	response.AcceptPrint(id, fmt.Sprint(data), "MatchResult shootOffScore")
	context.IndentedJSON(200, nil)
}

// MatchWinnerRequest selects one occupied result in a match as its winner. A
// null winner_match_result_id clears the decision for both results.
type MatchWinnerRequest struct {
	WinnerMatchResultID *uint `json:"winner_match_result_id" binding:"required" extensions:"x-nullable"`
}

// UnmarshalJSON distinguishes an explicit null (clear winner) from an omitted
// key. An empty object must never silently clear a previously selected winner.
type matchWinnerRequestPayload struct {
	WinnerMatchResultID *uint `json:"winner_match_result_id"`
}

func (request *matchWinnerRequestPayload) UnmarshalJSON(data []byte) error {
	var raw map[string]json.RawMessage
	if err := json.Unmarshal(data, &raw); err != nil {
		return err
	}
	value, ok := raw["winner_match_result_id"]
	if !ok {
		return errors.New("winner_match_result_id is required")
	}
	var winnerMatchResultID *uint
	if err := json.Unmarshal(value, &winnerMatchResultID); err != nil {
		return err
	}
	request.WinnerMatchResultID = winnerMatchResultID
	return nil
}

// MatchWinnerResponse reports whether a winner flag changed. The response is
// match-scoped so callers cannot accidentally infer a stale single-result
// update as a complete match decision.
type MatchWinnerResponse struct {
	EliminationID uint `json:"elimination_id"`
	MatchID       uint `json:"match_id"`
	Changed       bool `json:"changed"`
}

func eliminationForMatch(matchID uint) (database.Elimination, error) {
	var relation struct{ EliminationID uint }
	err := database.DB.Table("matches").
		Select("stages.elimination_id AS elimination_id").
		Joins("JOIN stages ON stages.id = matches.stage_id").
		Where("matches.id = ?", matchID).
		Take(&relation).Error
	if err != nil {
		return database.Elimination{}, err
	}
	return database.GetOnlyEliminationById(relation.EliminationID)
}

// setMatchWinner serializes a complete match decision. For new generated
// brackets it also synchronizes an open first round before validating and
// locking the roster, so a legitimate rank update cannot leave a stale slot
// blocking the first winner selection.
func lockMatchWinnerRows(tx *gorm.DB, eliminationID, matchID uint) (database.Elimination, []database.MatchResult, error) {
	var elimination database.Elimination
	if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&elimination, eliminationID).Error; err != nil {
		return database.Elimination{}, nil, err
	}
	var match database.Match
	if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&match, matchID).Error; err != nil {
		return database.Elimination{}, nil, err
	}
	var stage database.Stage
	if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).Select("id", "elimination_id").First(&stage, match.StageId).Error; err != nil {
		return database.Elimination{}, nil, err
	}
	if stage.EliminationId != elimination.ID {
		return database.Elimination{}, nil, errBracketConflict
	}
	var results []database.MatchResult
	if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).Where("match_id = ?", matchID).Order("id asc").Find(&results).Error; err != nil {
		return database.Elimination{}, nil, err
	}
	if len(results) != 2 {
		return database.Elimination{}, nil, errBracketConflict
	}
	return elimination, results, nil
}

func setMatchWinner(tx *gorm.DB, eliminationID, matchID uint, winnerMatchResultID *uint) (bool, error) {
	elimination, results, err := lockMatchWinnerRows(tx, eliminationID, matchID)
	if err != nil {
		return false, err
	}
	if winnerMatchResultID == nil {
		hasWinner := false
		for _, result := range results {
			hasWinner = hasWinner || result.IsWinner
		}
		// A dialog saving its default/no-winner state is a true no-op: it must
		// neither change slots nor freeze the still-editable roster.
		if !hasWinner {
			return false, nil
		}
	}

	if elimination.BracketSeedCount > 0 {
		if !elimination.BracketRosterLocked {
			if _, err := syncFirstRoundRoster(tx, elimination); err != nil {
				return false, err
			}
		}
	}

	// syncFirstRoundRoster may have filled one of this match's nil slots, so
	// load the two locked rows only after it completes.
	results, err = loadPlacementMatchResults(tx, matchID)
	if err != nil {
		return false, err
	}

	changed := false
	for _, result := range results {
		wantWinner := winnerMatchResultID != nil && result.ID == *winnerMatchResultID
		changed = changed || result.IsWinner != wantWinner
	}

	if changed {
		bracket, err := loadBracket(tx, elimination.ID)
		if err != nil {
			return false, err
		}
		locked, err := bracketWinnerMutationIsLocked(tx, bracket, elimination.ID, results[0].ID)
		if err != nil {
			return false, err
		}
		if locked {
			return false, errBracketLocked
		}
	}

	if winnerMatchResultID != nil {
		found := false
		for _, result := range results {
			if result.ID != *winnerMatchResultID {
				continue
			}
			found = true
			if result.PlayerSetId == nil {
				return false, errBracketEmptySlot
			}
		}
		if !found {
			return false, errBracketConflict
		}
	}

	if !changed {
		return false, nil
	}
	if winnerMatchResultID == nil {
		if err := tx.Model(&database.MatchResult{}).Where("match_id = ?", matchID).Update("is_winner", false).Error; err != nil {
			return false, err
		}
		return true, nil
	}
	if err := tx.Model(&database.MatchResult{}).Where("match_id = ?", matchID).
		Update("is_winner", gorm.Expr("CASE WHEN id = ? THEN ? ELSE ? END", *winnerMatchResultID, true, false)).Error; err != nil {
		return false, err
	}
	if elimination.BracketSeedCount > 0 {
		var playerSets []database.PlayerSet
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).Where("elimination_id = ?", elimination.ID).Find(&playerSets).Error; err != nil {
			return false, err
		}
		if err := validateRosterForLock(playerSets, elimination.BracketSeedCount); err != nil {
			return false, err
		}
		bracket, err := loadBracket(tx, elimination.ID)
		if err != nil {
			return false, err
		}
		bracketSize := nextPowerOfTwo(elimination.BracketSeedCount)
		if !bracketStageMatchShapeIsComplete(bracket, bracketSize) {
			return false, errBracketConflict
		}
		compatible, err := bracketShapeIsCompatible(tx, bracket, playerSets, elimination.BracketSeedCount, bracketSize, elimination.TeamSize)
		if err != nil {
			return false, err
		}
		if !compatible {
			return false, errBracketConflict
		}
		if err := lockBracketRoster(tx, &elimination); err != nil {
			return false, err
		}
	}
	return true, nil
}

// PutEliminationMatchWinner atomically selects or clears a winner for one
// match. It rejects an empty slot, a result belonging to another match, and a
// source match whose downstream bracket slot has already been populated.
//
//	@Summary		Select an elimination match winner
//	@Description	Locks the elimination, match, and both match results. winner_match_result_id is required and must identify an occupied result of this match, or be null to clear both winner flags. Requires a competition Admin. Generated brackets validate and lock their roster, and cannot change a source after it has advanced.
//	@Tags			Elimination
//	@Accept			json
//	@Produce		json
//	@Param			matchid	path	int	true	"Match ID"
//	@Param			request	body	endpoint.MatchWinnerRequest	true	"Winner selection"
//	@Success		200	{object}	endpoint.MatchWinnerResponse
//	@Failure		400	{object}	response.ErrorResponse
//	@Failure		403	{object}	response.ErrorResponse
//	@Failure		409	{object}	response.ErrorResponse
//	@Failure		500	{object}	response.ErrorResponse
//	@Router			/elimination/match/winner/{matchid} [put]
func PutEliminationMatchWinner(context *gin.Context) {
	matchID := Convert2uint(context, "matchid")
	elimination, err := eliminationForMatch(matchID)
	if err != nil || elimination.ID == 0 {
		context.JSON(http.StatusBadRequest, gin.H{"error": "invalid match ID"})
		return
	}
	if !requireEliminationCompetitionAdmin(context, elimination) {
		return
	}
	var request matchWinnerRequestPayload
	if err := context.ShouldBindJSON(&request); err != nil {
		context.JSON(http.StatusBadRequest, gin.H{"error": "invalid winner request"})
		return
	}
	changed := false
	err = database.DB.Transaction(func(tx *gorm.DB) error {
		var err error
		changed, err = setMatchWinner(tx, elimination.ID, matchID, request.WinnerMatchResultID)
		return err
	})
	if err != nil {
		writeBracketError(context, err)
		return
	}
	context.JSON(http.StatusOK, MatchWinnerResponse{EliminationID: elimination.ID, MatchID: matchID, Changed: changed})
}

// MatchSettingsRequest applies physical placement, optional legacy player-set
// assignment, and winner selection in one transaction. A null winner clears an
// existing decision or is a no-op; the winner key itself is required.
type MatchSettingsRequest struct {
	Placements          []MatchResultPlacement `json:"placements" binding:"required,min=2,max=2"`
	WinnerMatchResultID *uint                  `json:"winner_match_result_id" binding:"required" extensions:"x-nullable"`
	PlayerSetIDs        []uint                 `json:"player_set_ids,omitempty"`
}

type matchSettingsRequestPayload struct {
	Placements          []MatchResultPlacement `json:"placements" binding:"required,min=2,max=2"`
	WinnerMatchResultID *uint                  `json:"winner_match_result_id"`
	PlayerSetIDs        []uint                 `json:"player_set_ids,omitempty"`
}

func (request *matchSettingsRequestPayload) UnmarshalJSON(data []byte) error {
	var raw map[string]json.RawMessage
	if err := json.Unmarshal(data, &raw); err != nil {
		return err
	}
	value, ok := raw["winner_match_result_id"]
	if !ok {
		return errors.New("winner_match_result_id is required")
	}
	type requestPayload struct {
		Placements   []MatchResultPlacement `json:"placements"`
		PlayerSetIDs []uint                 `json:"player_set_ids"`
	}
	var payload requestPayload
	if err := json.Unmarshal(data, &payload); err != nil {
		return err
	}
	var winnerMatchResultID *uint
	if err := json.Unmarshal(value, &winnerMatchResultID); err != nil {
		return err
	}
	request.Placements = payload.Placements
	request.PlayerSetIDs = payload.PlayerSetIDs
	request.WinnerMatchResultID = winnerMatchResultID
	return nil
}

type MatchSettingsResponse struct {
	EliminationID uint `json:"elimination_id"`
	MatchID       uint `json:"match_id"`
	Changed       bool `json:"changed"`
}

// bracketHasAdvanced reports whether a decided source has already populated a
// downstream bracket slot (or a final has awarded a medal). It deliberately
// does not treat pre-created empty stages as advancement.
func bracketHasAdvanced(tx *gorm.DB, bracket []bracketStage, eliminationID uint) (bool, error) {
	if len(bracket) == 0 {
		return false, nil
	}
	lastStage := len(bracket) - 1
	for stageIndex := 0; stageIndex < lastStage; stageIndex++ {
		for matchIndex, match := range bracket[stageIndex].Matches {
			winner, _ := decidedWinnerAndLoser(match.Results)
			if winner == nil {
				continue
			}
			if stageIndex == lastStage-1 {
				if len(bracket[lastStage].Matches) != 2 ||
					matchIndex >= len(bracket[lastStage].Matches[0].Results) ||
					matchIndex >= len(bracket[lastStage].Matches[1].Results) {
					return false, errBracketConflict
				}
				if bracket[lastStage].Matches[0].Results[matchIndex].PlayerSetId != nil ||
					bracket[lastStage].Matches[1].Results[matchIndex].PlayerSetId != nil {
					return true, nil
				}
				continue
			}
			targetMatch := matchIndex / 2
			targetSlot := matchIndex % 2
			if stageIndex+1 >= len(bracket) || targetMatch >= len(bracket[stageIndex+1].Matches) || targetSlot >= len(bracket[stageIndex+1].Matches[targetMatch].Results) {
				return false, errBracketConflict
			}
			if bracket[stageIndex+1].Matches[targetMatch].Results[targetSlot].PlayerSetId != nil {
				return true, nil
			}
		}
	}

	var awardedMedals int64
	if err := tx.Model(&database.Medal{}).Where("elimination_id = ? AND player_set_id <> 0", eliminationID).Count(&awardedMedals).Error; err != nil {
		return false, err
	}
	return awardedMedals != 0, nil
}

// applyManualMatchPlayerSets is the administrator recovery path.  It changes
// only MatchResult.PlayerSetId, retaining the slot's score, confirmations,
// winner flag, and placement.  A selected winner is then projected through
// its descendants, so a correction made after advancement remains coherent.
// The caller must hold the elimination lock.
func applyManualMatchPlayerSets(tx *gorm.DB, elimination database.Elimination, matchID uint, playerSetIDs []uint, cascade bool) (bool, map[int]bool, error) {
	if len(playerSetIDs) != 2 {
		return false, nil, errBracketConflict
	}
	if playerSetIDs[0] == 0 || playerSetIDs[1] == 0 || playerSetIDs[0] == playerSetIDs[1] {
		return false, nil, errBracketConflict
	}
	bracket, err := loadBracket(tx, elimination.ID)
	if err != nil {
		return false, nil, err
	}
	stageIndex, matchIndex := -1, -1
	for candidateStageIndex, stage := range bracket {
		for candidateMatchIndex, match := range stage.Matches {
			if match.Match.ID == matchID {
				stageIndex, matchIndex = candidateStageIndex, candidateMatchIndex
				break
			}
		}
		if stageIndex >= 0 {
			break
		}
	}
	if stageIndex < 0 || len(bracket[stageIndex].Matches[matchIndex].Results) != 2 {
		return false, nil, errBracketConflict
	}

	var playerSets []database.PlayerSet
	if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).Where("elimination_id = ?", elimination.ID).Order("id asc").Find(&playerSets).Error; err != nil {
		return false, nil, err
	}
	playerSetByID := make(map[uint]database.PlayerSet, len(playerSets))
	for _, playerSet := range playerSets {
		if playerSet.EliminationId != elimination.ID {
			return false, nil, errBracketConflict
		}
		playerSetByID[playerSet.ID] = playerSet
	}
	for _, playerSetID := range playerSetIDs {
		if _, ok := playerSetByID[playerSetID]; !ok {
			return false, nil, gorm.ErrRecordNotFound
		}
	}

	// Build the stage's current unique assignment map. If a requested team is
	// already in another match, swap it with a PlayerSet displaced from this
	// match. This keeps every team present exactly once in the stage and retains
	// score/winner state on every MatchResult slot.
	type stageResultRef struct{ matchIndex, resultIndex int }
	assigned := make(map[uint][]stageResultRef)
	for candidateMatchIndex, match := range bracket[stageIndex].Matches {
		for candidateResultIndex, result := range match.Results {
			if result.PlayerSetId == nil {
				continue
			}
			assigned[*result.PlayerSetId] = append(assigned[*result.PlayerSetId], stageResultRef{candidateMatchIndex, candidateResultIndex})
		}
	}
	results := &bracket[stageIndex].Matches[matchIndex].Results
	desired := map[uint]bool{playerSetIDs[0]: true, playerSetIDs[1]: true}
	displaced := make([]*uint, 0, 2)
	for _, result := range *results {
		if result.PlayerSetId == nil || !desired[*result.PlayerSetId] {
			displaced = append(displaced, result.PlayerSetId)
		}
	}
	externalSources := make([]stageResultRef, 0, 2)
	for _, playerSetID := range playerSetIDs {
		for _, location := range assigned[playerSetID] {
			if location.matchIndex != matchIndex {
				externalSources = append(externalSources, location)
			}
		}
	}
	if len(externalSources) > len(displaced) {
		return false, nil, errBracketConflict
	}

	type playerSetRewrite struct {
		result      *database.MatchResult
		playerSetID *uint
		matchIndex  int
	}
	rewrites := make([]playerSetRewrite, 0, 4)
	for resultIndex, playerSetID := range playerSetIDs {
		id := playerSetID
		rewrites = append(rewrites, playerSetRewrite{result: &(*results)[resultIndex], playerSetID: &id, matchIndex: matchIndex})
	}
	for index, source := range externalSources {
		rewrites = append(rewrites, playerSetRewrite{result: &bracket[stageIndex].Matches[source.matchIndex].Results[source.resultIndex], playerSetID: displaced[index], matchIndex: source.matchIndex})
	}
	projections := make([]bracketSlotProjection, 0, len(rewrites))
	affectedMatches := map[int]bool{matchIndex: true}
	for _, rewrite := range rewrites {
		projections = append(projections, bracketSlotProjection{result: rewrite.result, playerSetID: rewrite.playerSetID})
		affectedMatches[rewrite.matchIndex] = true
	}
	changed, err := overwriteBracketSlots(tx, &bracket[stageIndex], projections)
	if err != nil {
		return false, nil, err
	}
	if elimination.BracketSeedCount > 0 && !elimination.BracketRosterLocked {
		// A forced correction becomes authoritative over the auto-seeding view.
		// Keep the lock's original purpose: rank synchronization may no longer
		// overwrite a manually corrected bracket.
		if err := lockBracketRoster(tx, &elimination); err != nil {
			return false, nil, err
		}
	}
	if !cascade {
		return changed, affectedMatches, nil
	}
	propagated, err := cascadeManualMatchCorrection(tx, elimination.ID, matchID, affectedMatches)
	return changed || propagated, affectedMatches, err
}

func cascadeManualMatchCorrection(tx *gorm.DB, eliminationID, matchID uint, affected map[int]bool) (bool, error) {
	bracket, err := loadBracket(tx, eliminationID)
	if err != nil {
		return false, err
	}
	stageIndex := -1
	for index, stage := range bracket {
		for _, match := range stage.Matches {
			if match.Match.ID == matchID {
				stageIndex = index
				break
			}
		}
		if stageIndex >= 0 {
			break
		}
	}
	if stageIndex < 0 {
		return false, errBracketConflict
	}
	changed, err := projectDecidedStages(tx, bracket, stageIndex, affected, false, true)
	if err != nil {
		return false, err
	}
	if len(bracket) == 0 || (len(bracket[len(bracket)-1].Matches) != 1 && len(bracket[len(bracket)-1].Matches) != 2) {
		return changed, nil
	}
	medalsChanged, err := reprojectBracketMedals(tx, eliminationID, bracket[len(bracket)-1])
	return changed || medalsChanged, err
}

// PutEliminationMatchSettings atomically updates one match's placement and winner.
//
//	@Summary		Update elimination match placement and winner atomically
//	@Description	Requires a competition Admin. winner_match_result_id is required and may be null. Validates exactly two placements, may force-correct player_set_ids for any match while retaining slot state and reprojecting selected winners, and selects an occupied winner result. Any conflict rolls back every field.
//	@Tags			Elimination
//	@Accept			json
//	@Produce		json
//	@Param			matchid	path	int	true	"Match ID"
//	@Param			request	body	endpoint.MatchSettingsRequest	true	"Match settings"
//	@Success		200	{object}	endpoint.MatchSettingsResponse
//	@Failure		400	{object}	response.ErrorResponse
//	@Failure		403	{object}	response.ErrorResponse
//	@Failure		409	{object}	response.ErrorResponse
//	@Router			/elimination/match/settings/{matchid} [put]
func PutEliminationMatchSettings(context *gin.Context) {
	matchID := Convert2uint(context, "matchid")
	elimination, err := eliminationForMatch(matchID)
	if err != nil || elimination.ID == 0 {
		context.JSON(http.StatusBadRequest, gin.H{"error": "invalid match ID"})
		return
	}
	if !requireEliminationCompetitionAdmin(context, elimination) {
		return
	}
	var request matchSettingsRequestPayload
	if err := context.ShouldBindJSON(&request); err != nil {
		context.JSON(http.StatusBadRequest, gin.H{"error": "invalid match settings"})
		return
	}
	changed := false
	err = database.DB.Transaction(func(tx *gorm.DB) error {
		playerSetChanged := false
		var affectedMatches map[int]bool
		if request.PlayerSetIDs != nil {
			// Read the elimination under the transaction lock before applying the
			// recovery rewrite; the pre-authorization copy may be stale if bracket
			// initialization raced this request.
			lockedElimination, _, err := lockMatchWinnerRows(tx, elimination.ID, matchID)
			if err != nil {
				return err
			}
			playerSetChanged, affectedMatches, err = applyManualMatchPlayerSets(tx, lockedElimination, matchID, request.PlayerSetIDs, false)
			if err != nil {
				return err
			}
		}
		winnerChanged, err := setMatchWinner(tx, elimination.ID, matchID, request.WinnerMatchResultID)
		if err != nil {
			return err
		}
		if affectedMatches != nil {
			propagated, err := cascadeManualMatchCorrection(tx, elimination.ID, matchID, affectedMatches)
			if err != nil {
				return err
			}
			playerSetChanged = playerSetChanged || propagated
		}
		// setMatchWinner establishes elimination -> match -> result locks first.
		// applyMatchPlacement then reuses the same transaction; either error
		// rolls both logical settings back.
		placementChanged, err := applyMatchPlacement(tx, matchID, request.Placements)
		if err != nil {
			return err
		}
		changed = placementChanged || winnerChanged || playerSetChanged
		return nil
	})
	if err != nil {
		writeBracketError(context, err)
		return
	}
	context.JSON(http.StatusOK, MatchSettingsResponse{EliminationID: elimination.ID, MatchID: matchID, Changed: changed})
}

// Put MatchResult isWinner godoc
//
//	@Summary		Set or clear one match winner (legacy result endpoint)
//	@Description	When is_winner is true, atomically selects this occupied result and clears the other result in its match. When false, clears both winner flags. Prefer PUT /elimination/match/winner/{matchid}. Requires a competition Admin.
//	@Tags			MatchResult
//	@Accept			json
//	@Param			id			path		int															true	"MatchResult ID"
//	@Param			MatchResult	body		endpoint.PutMatchResultIsWinnerById.matchResultIsWinnerData	true	"MatchResult"
//	@Success		200			{object}	response.Nill												"success, return nil"
//	@Failure		400			{object}	response.ErrorIdResponse									"invalid match result ID, maybe not exist"
//	@Failure		500			{object}	response.ErrorInternalErrorResponse							"internal db failed for updating isWinner"
//	@Failure		403	{object}	response.ErrorResponse	"competition admin required"
//	@Failure		409	{object}	response.ErrorResponse	"empty bracket slot, roster conflict, or winner locked after advancement"
//	@Deprecated
//	@Router			/matchresult/iswinner/{id} [patch]
func PutMatchResultIsWinnerById(context *gin.Context) {
	type matchResultIsWinnerData struct {
		IsWinner bool `json:"is_winner"`
	}
	_ = matchResultIsWinnerData{}
	id := Convert2uint(context, "id")
	var data database.MatchResult
	err := context.BindJSON(&data)
	if response.ErrorIdTest(context, id, database.GetMatchResultIsExist(id), "MatchResult when updating isWinner") {
		return
	} else if response.ErrorReceiveDataTest(context, id, "MatchResult when updating isWinner", err) {
		return
	}
	var relation struct {
		EliminationID uint
	}
	err = database.DB.Table("match_results").
		Select("stages.elimination_id AS elimination_id").
		Joins("JOIN matches ON matches.id = match_results.match_id").
		Joins("JOIN stages ON stages.id = matches.stage_id").
		Where("match_results.id = ?", id).
		Scan(&relation).Error
	if response.ErrorInternalErrorTest(context, id, "Get elimination when updating isWinner", err) {
		return
	}
	elimination, err := database.GetOnlyEliminationById(relation.EliminationID)
	if response.ErrorInternalErrorTest(context, relation.EliminationID, "Get elimination when updating isWinner", err) {
		return
	}
	if !requireEliminationCompetitionAdmin(context, elimination) {
		return
	}
	var result database.MatchResult
	err = database.DB.Select("id", "match_id").First(&result, id).Error
	if err != nil {
		writeBracketError(context, err)
		return
	}
	var winnerMatchResultID *uint
	if data.IsWinner {
		winnerMatchResultID = &id
	}
	err = database.DB.Transaction(func(tx *gorm.DB) error {
		_, err := setMatchWinner(tx, relation.EliminationID, result.MatchId, winnerMatchResultID)
		return err
	})
	if err != nil {
		writeBracketError(context, err)
		return
	}
	response.AcceptPrint(id, fmt.Sprint(data), "MatchResult isWinner")
	context.IndentedJSON(200, nil)
}

// Put MatchResult laneNumber godoc
//
//	@Summary		Deprecated: update one MatchResult laneNumber
//	@Description	Deprecated: use PUT /elimination/match/placement/{matchid}. Requires a competition Admin and preserves the complete-match placement invariant.
//	@Tags			MatchResult
//	@Accept			json
//	@Param			id			path		int																true	"MatchResult ID"
//	@Param			MatchResult	body		endpoint.PutMatchResultLaneNumberById.matchResultLaneNumberData	true	"MatchResult"
//	@Success		200			{object}	response.Nill													"success, return nil"
//	@Failure		400			{object}	response.ErrorIdResponse										"invalid match result ID, maybe not exist"
//	@Failure		500			{object}	response.ErrorInternalErrorResponse								"internal db failed for updating laneNumber"
//	@Deprecated
//	@Router			/matchresult/lanenumber/{id} [patch]
func PutMatchResultLaneNumberById(context *gin.Context) {
	type matchResultLaneNumberData struct {
		LaneNumber int `json:"lane_number"`
	}
	_ = matchResultLaneNumberData{}
	id := Convert2uint(context, "id")
	var data database.MatchResult
	err := context.BindJSON(&data)
	if response.ErrorIdTest(context, id, database.GetMatchResultIsExist(id), "MatchResult when updating laneNumber") {
		return
	} else if response.ErrorReceiveDataTest(context, id, "MatchResult when updating laneNumber", err) {
		return
	}
	if data.LaneNumber < 0 {
		context.JSON(400, gin.H{"error": errInvalidPlacement.Error()})
		return
	}
	elimination, matchID, err := placementEliminationForMatchResult(id)
	if err != nil || elimination.ID == 0 {
		context.JSON(400, gin.H{"error": "invalid match result ID"})
		return
	}
	if !requireEliminationCompetitionAdmin(context, elimination) {
		return
	}
	err = database.DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&elimination, elimination.ID).Error; err != nil {
			return err
		}
		results, err := loadPlacementMatchResults(tx, matchID)
		if err != nil {
			return err
		}
		placements := []MatchResultPlacement{
			{MatchResultID: results[0].ID, LaneNumber: results[0].LaneNumber, Target: results[0].Target},
			{MatchResultID: results[1].ID, LaneNumber: results[1].LaneNumber, Target: results[1].Target},
		}
		for index := range placements {
			if placements[index].MatchResultID == id {
				placements[index].LaneNumber = data.LaneNumber
			}
		}
		_, err = applyMatchPlacement(tx, matchID, placements)
		return err
	})
	if err != nil {
		writeBracketError(context, err)
		return
	}
	response.AcceptPrint(id, fmt.Sprint(data), "MatchResult laneNumber")
	context.IndentedJSON(200, nil)
}

// Put MatchEnd totalScores godoc
//
//	@Summary		Update one MatchEnd totalScores
//	@Description	Update one MatchEnd totalScores by id
//	@Tags			MatchEnd
//	@Accept			json
//	@Param			id			path		int																true	"MatchEnd ID"
//	@Param			MatchEnd	body		endpoint.PutMatchEndsTotalScoresById.matchEndTotalScoresData	true	"MatchEnd"
//	@Success		200			{object}	response.Nill													"success, return nil"
//	@Failure		400			{object}	response.ErrorIdResponse										"invalid match end ID, maybe not exist"
//	@Failure		500			{object}	response.ErrorInternalErrorResponse								"internal db failed for updating totalScores"
//	@Failure		409	{object}	response.ErrorResponse	"empty bracket slot or roster conflict"
//	@Router			/matchresult/matchend/totalscore/{id} [patch]
func PutMatchEndsTotalScoresById(context *gin.Context) {
	type matchEndTotalScoresData struct {
		TotalScore int `json:"total_scores"`
	}
	_ = matchEndTotalScoresData{}
	id := Convert2uint(context, "id")
	var data database.MatchEnd
	err := context.BindJSON(&data)
	if response.ErrorIdTest(context, id, database.GetMatchEndIsExist(id), "MatchEnd when updating totalScores") {
		return
	} else if response.ErrorReceiveDataTest(context, id, "MatchEnd when updating totalScores", err) {
		return
	}
	err = database.DB.Transaction(func(tx *gorm.DB) error {
		eliminationID, err := rosterEliminationForMatchEnd(tx, id)
		if err != nil {
			return err
		}
		if err := lockRosterForEliminationScoring(tx, eliminationID); err != nil {
			return err
		}
		matchResultID, err := matchResultForMatchEnd(tx, id)
		if err != nil {
			return err
		}
		if err := requireOccupiedMatchResult(tx, matchResultID); err != nil {
			return err
		}
		return tx.Model(&database.MatchEnd{}).Where("id = ?", id).Update("total_score", data.TotalScore).Error
	})
	if err != nil {
		writeBracketError(context, err)
		return
	}
	response.AcceptPrint(id, fmt.Sprint(data), "MatchEnd totalScores")
	context.IndentedJSON(200, nil)
}

// Put MatchEnds scores godoc
//
//	@Summary		Update one MatchEnd scores
//	@Description	Update one MatchEnd totalScores by id and all related MatchScores by MatchScore ids
//	@Description	MatchScore ids and scores must be the same length
//	@Tags			MatchEnd
//	@Accept			json
//	@Param			id					path		int													true	"MatchEnd ID"
//	@Param			matchEndScoresData	body		endpoint.PutMatchEndsScoresById.matchEndScoresData	true	"matchEndScoresData"
//	@Success		200					{object}	response.Nill										"success, return nil"
//	@Failure		400					{object}	response.ErrorIdResponse							"invalid match end ID, maybe not exist, or matchScore ids not exist, or matchScore ids and scores length not match"
//	@Failure		500					{object}	response.ErrorInternalErrorResponse					"internal db failed for updating scores"
//	@Failure		409	{object}	response.ErrorResponse	"empty bracket slot or roster conflict"
//	@Router			/matchresult/matchend/scores/{id} [patch]
func PutMatchEndsScoresById(context *gin.Context) {
	type matchEndScoresData struct {
		TotalScore    int    `json:"total_scores"`
		MatchScoreIds []uint `json:"match_score_ids"`
		Scores        []int  `json:"scores"`
	}
	matchEndId := Convert2uint(context, "id")
	var data matchEndScoresData
	err := context.BindJSON(&data)
	/*check data*/
	if response.ErrorIdTest(context, matchEndId, database.GetMatchEndIsExist(matchEndId), "MatchEnd when updating scores") {
		return
	} else if response.ErrorReceiveDataTest(context, matchEndId, "MatchEnd when updating scores", err) {
		return
	} else if len(data.MatchScoreIds) != len(data.Scores) {
		response.ErrorReceiveDataFormat(context, "matchScoreIds and scores length not match when updating scores")
		return
	}
	for i := 0; i < len(data.MatchScoreIds); i++ {
		if response.ErrorIdTest(context, data.MatchScoreIds[i], database.GetMatchScoreWMEndIdIsExist(data.MatchScoreIds[i], matchEndId), "MatchScore when updating scores") {
			return
		}
	}
	/*已確認局禁止改分，避免竄改已定案的比賽結果；僅拒改，不進行任何重算*/
	matchEnd, err := database.GetMatchEndById(matchEndId)
	if response.ErrorInternalErrorTest(context, matchEndId, "Get MatchEnd when updating scores", err) {
		return
	}
	if matchEnd.IsConfirmed {
		response.ErrorReceiveDataFormat(context, "MatchEnd already confirmed, cannot update scores")
		return
	}
	/* update the end and all arrows atomically with the roster lock */
	err = database.DB.Transaction(func(tx *gorm.DB) error {
		eliminationID, err := rosterEliminationForMatchEnd(tx, matchEndId)
		if err != nil {
			return err
		}
		if err := lockRosterForEliminationScoring(tx, eliminationID); err != nil {
			return err
		}
		matchResultID, err := matchResultForMatchEnd(tx, matchEndId)
		if err != nil {
			return err
		}
		if err := requireOccupiedMatchResult(tx, matchResultID); err != nil {
			return err
		}
		var lockedEnd database.MatchEnd
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&lockedEnd, matchEndId).Error; err != nil {
			return err
		}
		if lockedEnd.IsConfirmed {
			return errors.New("MatchEnd already confirmed, cannot update scores")
		}
		if err := tx.Model(&database.MatchEnd{}).Where("id = ?", matchEndId).Update("total_score", data.TotalScore).Error; err != nil {
			return err
		}
		for index := range data.MatchScoreIds {
			result := tx.Model(&database.MatchScore{}).Where("id = ? AND match_end_id = ?", data.MatchScoreIds[index], matchEndId).Update("score", data.Scores[index])
			if result.Error != nil {
				return result.Error
			}
			if result.RowsAffected != 1 {
				return gorm.ErrRecordNotFound
			}
		}
		return nil
	})
	if err != nil {
		if err.Error() == "MatchEnd already confirmed, cannot update scores" {
			response.ErrorReceiveDataFormat(context, err.Error())
			return
		}
		writeBracketError(context, err)
		return
	}
	context.IndentedJSON(200, nil)
}

// Put MatchEnd isConfirmed godoc
//
//	@Summary		Update one MatchEnd isConfirmed
//	@Description	Update one MatchEnd isConfirmed by id
//	@Tags			MatchEnd
//	@Accept			json
//	@Param			id			path		int																true	"MatchEnd ID"
//	@Param			MatchEnd	body		endpoint.PutMatchEndsIsConfirmedById.matchEndIsConfirmedData	true	"MatchEnd"
//	@Success		200			{object}	response.Nill													"success, return nil"
//	@Failure		400			{object}	response.ErrorIdResponse										"invalid match end ID, maybe not exist"
//	@Failure		500			{object}	response.ErrorInternalErrorResponse								"internal db failed for updating isConfirmed"
//	@Failure		409	{object}	response.ErrorResponse	"empty bracket slot or roster conflict"
//	@Router			/matchresult/matchend/isconfirmed/{id} [patch]
func PutMatchEndsIsConfirmedById(context *gin.Context) {
	type matchEndIsConfirmedData struct {
		IsConfirmed bool `json:"is_confirmed"`
	}
	_ = matchEndIsConfirmedData{}
	id := Convert2uint(context, "id")
	var data database.MatchEnd
	err := context.BindJSON(&data)
	if response.ErrorIdTest(context, id, database.GetMatchEndIsExist(id), "MatchEnd when updating isConfirmed") {
		return
	} else if response.ErrorReceiveDataTest(context, id, "MatchEnd when updating isConfirmed", err) {
		return
	}
	err = database.DB.Transaction(func(tx *gorm.DB) error {
		eliminationID, err := rosterEliminationForMatchEnd(tx, id)
		if err != nil {
			return err
		}
		if err := lockRosterForEliminationScoring(tx, eliminationID); err != nil {
			return err
		}
		matchResultID, err := matchResultForMatchEnd(tx, id)
		if err != nil {
			return err
		}
		if err := requireOccupiedMatchResult(tx, matchResultID); err != nil {
			return err
		}
		return tx.Model(&database.MatchEnd{}).Where("id = ?", id).Update("is_confirmed", data.IsConfirmed).Error
	})
	if err != nil {
		writeBracketError(context, err)
		return
	}
	response.AcceptPrint(id, fmt.Sprint(data), "MatchEnd isConfirmed")
	context.IndentedJSON(200, nil)
}

// Put MatchScore score godoc
//
//	@Summary		Update one MatchScore score
//	@Description	Update one MatchScore score by id
//	@Description	Also update related MatchEnd totalScores
//	@Tags			MatchScore
//	@Accept			json
//	@Param			id			path		int												true	"MatchScore ID"
//	@Param			MatchScore	body		endpoint.PutMatchScoreScoreById.matchScoreData	true	"MatchScore"
//	@Success		200			{object}	response.Nill									"success, return nil"
//	@Failure		400			{object}	response.ErrorIdResponse						"invalid match score ID, maybe not exist"
//	@Failure		500			{object}	response.ErrorInternalErrorResponse				"internal db failed for updating score, get matchEnd by id, get matchScore, update matchEnd totalScores"
//	@Failure		409	{object}	response.ErrorResponse	"empty bracket slot or roster conflict"
//	@Router			/matchresult/matchscore/score/{id} [patch]
func PutMatchScoreScoreById(context *gin.Context) {
	type matchScoreData struct {
		Score int `json:"score"`
	}
	_ = matchScoreData{}
	id := Convert2uint(context, "id")
	var data database.MatchScore
	err := context.BindJSON(&data)
	newScore := data.Score
	if response.ErrorIdTest(context, id, database.GetMatchScoreIsExist(id), "MatchScore when updating score") {
		return
	} else if response.ErrorReceiveDataTest(context, id, "MatchScore when updating score", err) {
		return
	}
	err = database.DB.Transaction(func(tx *gorm.DB) error {
		eliminationID, err := rosterEliminationForMatchScore(tx, id)
		if err != nil {
			return err
		}
		if err := lockRosterForEliminationScoring(tx, eliminationID); err != nil {
			return err
		}
		matchResultID, err := matchResultForMatchScore(tx, id)
		if err != nil {
			return err
		}
		if err := requireOccupiedMatchResult(tx, matchResultID); err != nil {
			return err
		}
		var oldScore database.MatchScore
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&oldScore, id).Error; err != nil {
			return err
		}
		var matchEnd database.MatchEnd
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&matchEnd, oldScore.MatchEndId).Error; err != nil {
			return err
		}
		if matchEnd.IsConfirmed {
			return errors.New("MatchEnd already confirmed, cannot update scores")
		}
		if err := tx.Model(&database.MatchScore{}).Where("id = ?", id).Update("score", newScore).Error; err != nil {
			return err
		}
		return tx.Model(&database.MatchEnd{}).Where("id = ?", matchEnd.ID).Update("total_score", matchEnd.TotalScore-Scorefmt(oldScore.Score)+Scorefmt(newScore)).Error
	})
	if err != nil {
		if err.Error() == "MatchEnd already confirmed, cannot update scores" {
			response.ErrorReceiveDataFormat(context, err.Error())
			return
		}
		writeBracketError(context, err)
		return
	}
	response.AcceptPrint(id, fmt.Sprint(data), "MatchScore score")
	context.IndentedJSON(200, nil)
}

// Delete MatchResult By ID godoc
//
//	@Summary		Delete one MatchResult
//	@Description	Delete one MatchResult with matchEnds and matchScores by id
//	@Tags			MatchResult
//	@Param			id	path		int									true	"MatchResult ID"
//	@Success		200	{object}	response.Nill						"success, return nil"
//	@Failure		400	{object}	response.ErrorIdResponse			"invalid match result ID, maybe not exist"
//	@Failure		500	{object}	response.ErrorInternalErrorResponse	"internal db failed for deleting match result"
//	@Failure		403	{object}	response.ErrorResponse	"competition admin required"
//	@Failure		409	{object}	response.ErrorResponse	"complete bracket is locked"
//	@Router			/matchresult/{id} [delete]
func DeleteMatchResultById(context *gin.Context) {
	id := Convert2uint(context, "id")
	if response.ErrorIdTest(context, id, database.GetMatchResultIsExist(id), "MatchResult") {
		return
	}
	var relation struct {
		EliminationID uint
	}
	err := database.DB.Table("match_results").
		Select("stages.elimination_id AS elimination_id").
		Joins("JOIN matches ON matches.id = match_results.match_id").
		Joins("JOIN stages ON stages.id = matches.stage_id").
		Where("match_results.id = ?", id).
		Take(&relation).Error
	if response.ErrorInternalErrorTest(context, id, "Get elimination when deleting MatchResult", err) {
		return
	}
	elimination, err := database.GetOnlyEliminationById(relation.EliminationID)
	if response.ErrorInternalErrorTest(context, relation.EliminationID, "Get elimination when deleting MatchResult", err) {
		return
	}
	if !requireEliminationCompetitionAdmin(context, elimination) {
		return
	}
	err = withManualBracketMutation(relation.EliminationID, func(tx *gorm.DB, _ database.Elimination) error {
		var resultCount int64
		if err := tx.Table("match_results").
			Joins("JOIN matches ON matches.id = match_results.match_id").
			Joins("JOIN stages ON stages.id = matches.stage_id").
			Where("match_results.id = ? AND stages.elimination_id = ?", id, relation.EliminationID).
			Count(&resultCount).Error; err != nil {
			return err
		}
		if resultCount != 1 {
			return gorm.ErrRecordNotFound
		}
		var endIDs []uint
		if err := tx.Model(&database.MatchEnd{}).Where("match_result_id = ?", id).Pluck("id", &endIDs).Error; err != nil {
			return err
		}
		if len(endIDs) > 0 {
			if err := tx.Where("match_end_id IN ?", endIDs).Delete(&database.MatchScore{}).Error; err != nil {
				return err
			}
		}
		if err := tx.Where("match_result_id = ?", id).Delete(&database.MatchEnd{}).Error; err != nil {
			return err
		}
		return tx.Delete(&database.MatchResult{}, id).Error
	})
	if err != nil {
		writeBracketError(context, err)
		return
	}
	response.AcceptPrint(id, fmt.Sprint(id), "MatchResult")
	context.IndentedJSON(200, nil)
}
