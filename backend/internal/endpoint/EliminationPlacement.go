package endpoint

import (
	"backend/internal/database"
	"encoding/json"
	"errors"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

var (
	errInvalidPlacement = errors.New("placement lane_number must be non-negative and target must be A, B, or null")
	errPlacementMode    = errors.New("placement mode must be one_player_set_per_target or two_player_sets_per_target")
)

// StagePlacementRequest assigns a lane range to every match of one stage.
// one_player_set_per_target consumes two lanes per match; two_player_sets_per_target
// consumes one lane per match and writes A/B targets.
type StagePlacementRequest struct {
	StartLaneNumber int    `json:"start_lane_number" binding:"required"`
	EndLaneNumber   int    `json:"end_lane_number" binding:"required"`
	Mode            string `json:"mode" binding:"required" enums:"one_player_set_per_target,two_player_sets_per_target"`
}

type MatchResultPlacement struct {
	MatchResultID uint    `json:"match_result_id" binding:"required"`
	LaneNumber    int     `json:"lane_number" binding:"gte=0" validate:"required"`
	Target        *string `json:"target" enums:"A,B" extensions:"x-nullable"`
}

// UnmarshalJSON distinguishes an omitted or null lane_number from a valid 0.
// Internal callers retain the concrete int field and validate their generated
// placements through applyMatchPlacement.
func (placement *MatchResultPlacement) UnmarshalJSON(data []byte) error {
	var raw struct {
		MatchResultID uint    `json:"match_result_id"`
		LaneNumber    *int    `json:"lane_number"`
		Target        *string `json:"target"`
	}
	if err := json.Unmarshal(data, &raw); err != nil {
		return err
	}
	if raw.LaneNumber == nil {
		return errors.New("placement lane_number is required")
	}
	placement.MatchResultID = raw.MatchResultID
	placement.LaneNumber = *raw.LaneNumber
	placement.Target = raw.Target
	return nil
}

// MatchPlacementRequest is deliberately independent of the lanes table:
// elimination venues may use temporary targets not represented there.
type MatchPlacementRequest struct {
	Placements []MatchResultPlacement `json:"placements" binding:"required,min=1"`
}

type PlacementResponse struct {
	EliminationID       uint `json:"elimination_id"`
	StageID             uint `json:"stage_id,omitempty"`
	MatchID             uint `json:"match_id,omitempty"`
	MatchCount          int  `json:"match_count,omitempty"`
	RequiredTargetCount int  `json:"required_target_count,omitempty"`
	UsedEndLaneNumber   int  `json:"used_end_lane_number,omitempty"`
	Changed             bool `json:"changed"`
}

func normalizeTarget(target *string) (*string, error) {
	if target == nil {
		return nil, nil
	}
	value := strings.ToUpper(strings.TrimSpace(*target))
	if value != "A" && value != "B" {
		return nil, errInvalidPlacement
	}
	return &value, nil
}

func loadPlacementMatchResults(tx *gorm.DB, matchID uint) ([]database.MatchResult, error) {
	var results []database.MatchResult
	if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).Where("match_id = ?", matchID).Order("id asc").Find(&results).Error; err != nil {
		return nil, err
	}
	if len(results) != 2 {
		return nil, errBracketConflict
	}
	return results, nil
}

func validatePlacementPair(placements []MatchResultPlacement) error {
	if len(placements) != 2 {
		return errInvalidPlacement
	}
	for _, placement := range placements {
		if placement.LaneNumber < 0 {
			return errInvalidPlacement
		}
	}
	return nil
}

func applyMatchPlacement(tx *gorm.DB, matchID uint, placements []MatchResultPlacement) (bool, error) {
	results, err := loadPlacementMatchResults(tx, matchID)
	if err != nil {
		return false, err
	}
	if len(placements) != len(results) {
		return false, errInvalidPlacement
	}
	byID := make(map[uint]MatchResultPlacement, len(placements))
	for _, placement := range placements {
		if placement.MatchResultID == 0 || placement.LaneNumber < 0 {
			return false, errInvalidPlacement
		}
		if _, duplicate := byID[placement.MatchResultID]; duplicate {
			return false, errInvalidPlacement
		}
		target, err := normalizeTarget(placement.Target)
		if err != nil {
			return false, err
		}
		placement.Target = target
		byID[placement.MatchResultID] = placement
	}

	ordered := make([]MatchResultPlacement, 0, 2)
	for _, result := range results {
		placement, ok := byID[result.ID]
		if !ok {
			return false, errInvalidPlacement
		}
		ordered = append(ordered, placement)
	}
	if err := validatePlacementPair(ordered); err != nil {
		return false, err
	}
	changed := false
	for resultIndex, result := range results {
		placement := ordered[resultIndex]
		if result.LaneNumber != placement.LaneNumber || !sameOptionalString(result.Target, placement.Target) {
			if err := tx.Model(&database.MatchResult{}).Where("id = ?", result.ID).Updates(map[string]interface{}{
				"lane_number": placement.LaneNumber,
				"target":      placement.Target,
			}).Error; err != nil {
				return false, err
			}
			changed = true
		}
	}
	return changed, nil
}

func sameOptionalString(left, right *string) bool {
	if left == nil || right == nil {
		return left == nil && right == nil
	}
	return *left == *right
}

func placementEliminationForStage(stageID uint) (database.Elimination, error) {
	var stage database.Stage
	if err := database.DB.First(&stage, stageID).Error; err != nil {
		return database.Elimination{}, err
	}
	return database.GetOnlyEliminationById(stage.EliminationId)
}

func placementEliminationForMatch(matchID uint) (database.Elimination, error) {
	var relation struct{ EliminationID uint }
	err := database.DB.Table("matches").
		Select("stages.elimination_id AS elimination_id").
		Joins("JOIN stages ON stages.id = matches.stage_id").
		Where("matches.id = ?", matchID).Take(&relation).Error
	if err != nil {
		return database.Elimination{}, err
	}
	return database.GetOnlyEliminationById(relation.EliminationID)
}

func placementEliminationForMatchResult(matchResultID uint) (database.Elimination, uint, error) {
	var relation struct {
		EliminationID uint
		MatchID       uint
	}
	err := database.DB.Table("match_results").
		Select("stages.elimination_id AS elimination_id, matches.id AS match_id").
		Joins("JOIN matches ON matches.id = match_results.match_id").
		Joins("JOIN stages ON stages.id = matches.stage_id").
		Where("match_results.id = ?", matchResultID).Take(&relation).Error
	if err != nil {
		return database.Elimination{}, 0, err
	}
	elimination, err := database.GetOnlyEliminationById(relation.EliminationID)
	return elimination, relation.MatchID, err
}

// PutEliminationStagePlacement assigns every match in a stage to a lane range.
// It does not inspect the lanes table. Placement does not change team identities.
//
// @Summary      Place every match in an elimination stage
// @Description  Requires a competition Admin. mode is one_player_set_per_target or two_player_sets_per_target; no lane records are required.
// @Tags         Elimination
// @Accept       json
// @Produce      json
// @Param        stageid path int true "Stage ID"
// @Param        Placement body endpoint.StagePlacementRequest true "Stage placement"
// @Success      200 {object} endpoint.PlacementResponse
// @Failure      400 {object} response.ErrorResponse
// @Failure      403 {object} response.ErrorResponse
// @Failure      409 {object} response.ErrorResponse
// @Router       /elimination/stage/placement/{stageid} [put]
func PutEliminationStagePlacement(context *gin.Context) {
	stageID := Convert2uint(context, "stageid")
	elimination, err := placementEliminationForStage(stageID)
	if err != nil || elimination.ID == 0 {
		context.JSON(http.StatusBadRequest, gin.H{"error": "invalid stage ID"})
		return
	}
	if !requireEliminationCompetitionAdmin(context, elimination) {
		return
	}
	var request StagePlacementRequest
	if err := context.ShouldBindJSON(&request); err != nil {
		context.JSON(http.StatusBadRequest, gin.H{"error": "invalid stage placement"})
		return
	}
	request.Mode = strings.ToLower(strings.TrimSpace(request.Mode))
	if request.StartLaneNumber <= 0 || request.EndLaneNumber <= 0 || request.StartLaneNumber > request.EndLaneNumber {
		context.JSON(http.StatusBadRequest, gin.H{"error": errInvalidPlacement.Error()})
		return
	}
	if request.Mode != "one_player_set_per_target" && request.Mode != "two_player_sets_per_target" {
		context.JSON(http.StatusBadRequest, gin.H{"error": errPlacementMode.Error()})
		return
	}

	var response PlacementResponse
	changed := false
	err = database.DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&elimination, elimination.ID).Error; err != nil {
			return err
		}
		var matches []database.Match
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).Where("stage_id = ?", stageID).Order("id asc").Find(&matches).Error; err != nil {
			return err
		}
		if len(matches) == 0 {
			return errBracketConflict
		}
		requiredTargetCount := len(matches)
		if request.Mode == "one_player_set_per_target" {
			requiredTargetCount *= 2
		}
		if request.EndLaneNumber-request.StartLaneNumber+1 < requiredTargetCount {
			return errInvalidPlacement
		}
		for index, match := range matches {
			results, err := loadPlacementMatchResults(tx, match.ID)
			if err != nil {
				return err
			}
			placements := []MatchResultPlacement{{MatchResultID: results[0].ID}, {MatchResultID: results[1].ID}}
			if request.Mode == "one_player_set_per_target" {
				placements[0].LaneNumber = request.StartLaneNumber + index*2
				placements[1].LaneNumber = request.StartLaneNumber + index*2 + 1
			} else {
				lane := request.StartLaneNumber + index
				targetA, targetB := "A", "B"
				placements[0].LaneNumber, placements[0].Target = lane, &targetA
				placements[1].LaneNumber, placements[1].Target = lane, &targetB
			}
			matchChanged, err := applyMatchPlacement(tx, match.ID, placements)
			if err != nil {
				return err
			}
			changed = changed || matchChanged
		}
		response = PlacementResponse{
			EliminationID:       elimination.ID,
			StageID:             stageID,
			MatchCount:          len(matches),
			RequiredTargetCount: requiredTargetCount,
			UsedEndLaneNumber:   request.StartLaneNumber + requiredTargetCount - 1,
			Changed:             changed,
		}
		return nil
	})
	if err != nil {
		writeBracketError(context, err)
		return
	}
	context.JSON(http.StatusOK, response)
}

// PutEliminationMatchPlacement updates the physical placement of both sides
// of one match. It is safe to call before or after scores are recorded.
//
// @Summary      Place the two sides of an elimination match
// @Description  Requires a competition Admin. The request must name exactly both MatchResults. Each side may independently use any non-negative lane_number and target A, B, or null. No lanes-table lookup is made.
// @Tags         Elimination
// @Accept       json
// @Produce      json
// @Param        matchid path int true "Match ID"
// @Param        Placement body endpoint.MatchPlacementRequest true "Match placement"
// @Success      200 {object} endpoint.PlacementResponse
// @Failure      400 {object} response.ErrorResponse
// @Failure      403 {object} response.ErrorResponse
// @Failure      409 {object} response.ErrorResponse
// @Router       /elimination/match/placement/{matchid} [put]
func PutEliminationMatchPlacement(context *gin.Context) {
	matchID := Convert2uint(context, "matchid")
	elimination, err := placementEliminationForMatch(matchID)
	if err != nil || elimination.ID == 0 {
		context.JSON(http.StatusBadRequest, gin.H{"error": "invalid match ID"})
		return
	}
	if !requireEliminationCompetitionAdmin(context, elimination) {
		return
	}
	var request MatchPlacementRequest
	if err := context.ShouldBindJSON(&request); err != nil {
		context.JSON(http.StatusBadRequest, gin.H{"error": "invalid match placement"})
		return
	}
	changed := false
	err = database.DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&elimination, elimination.ID).Error; err != nil {
			return err
		}
		var matchCount int64
		if err := tx.Model(&database.Match{}).Where("id = ?", matchID).Count(&matchCount).Error; err != nil {
			return err
		}
		if matchCount != 1 {
			return gorm.ErrRecordNotFound
		}
		var applyErr error
		changed, applyErr = applyMatchPlacement(tx, matchID, request.Placements)
		return applyErr
	})
	if err != nil {
		writeBracketError(context, err)
		return
	}
	context.JSON(http.StatusOK, PlacementResponse{EliminationID: elimination.ID, MatchID: matchID, MatchCount: 1, Changed: changed})
}
