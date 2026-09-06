package endpoint

import (
	"backend/internal/database"
	"backend/internal/pkg"
	"errors"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

// Score writes deliberately authorize from the row being changed, not from
// session gamerole.  gamerole is a navigation hint and may describe another
// competition (or be stale after an approval change).
var (
	errScoreLoginRequired = errors.New("login required to write scores")
	errScoreForbidden     = errors.New("approved competition scoring role required")
)

type scoreActor int

const (
	scoreActorAdmin scoreActor = iota
	scoreActorJudge
	scoreActorPlayer
)

type eliminationScoreTarget struct {
	CompetitionID uint
	EliminationID uint
	MatchID       uint
	StageID       uint
	CurrentStage  uint
	TeamSize      int
	IsActive      bool
}

type qualificationScoreTarget struct {
	CompetitionID           uint
	PlayerID                uint
	LaneID                  uint
	RoundID                 uint
	RoundEndID              uint
	QualificationCurrentEnd int
}

func scoreSessionUserID(context *gin.Context) (uint, error) {
	userID, ok := pkg.QuerySession(context, "userid").(uint)
	if !ok || userID == 0 {
		return 0, errScoreLoginRequired
	}
	return userID, nil
}

func approvedScoreActor(tx *gorm.DB, competitionID, userID uint) (scoreActor, error) {
	var participants []database.Participant
	if err := tx.Where("competition_id = ? AND user_id = ? AND status = ?", competitionID, userID, "approved").Find(&participants).Error; err != nil {
		return 0, err
	}
	// A malformed legacy database can contain more than one Participant. Keep
	// the least-privilege ordering deterministic while Admin remains a rescue
	// role for the competition.
	for _, participant := range participants {
		if pkg.StringToRole(participant.Role) == pkg.RAdmin {
			return scoreActorAdmin, nil
		}
	}
	for _, participant := range participants {
		if pkg.StringToRole(participant.Role) == pkg.RJudge {
			return scoreActorJudge, nil
		}
	}
	for _, participant := range participants {
		if pkg.StringToRole(participant.Role) == pkg.RPlayer {
			return scoreActorPlayer, nil
		}
	}
	return 0, errScoreForbidden
}

func eliminationScoreTargetForMatch(tx *gorm.DB, matchID uint) (eliminationScoreTarget, error) {
	var target eliminationScoreTarget
	err := tx.Table("matches").
		Select(`competition_group.competition_id AS competition_id,
			stages.elimination_id AS elimination_id, matches.id AS match_id,
			stages.id AS stage_id, eliminations.current_stage AS current_stage,
			eliminations.team_size AS team_size`).
		Joins("JOIN stages ON stages.id = matches.stage_id").
		Joins("JOIN eliminations ON eliminations.id = stages.elimination_id").
		Joins("JOIN `groups` AS competition_group ON competition_group.id = eliminations.group_id").
		Joins("JOIN competitions ON competitions.id = competition_group.competition_id").
		Where("matches.id = ?", matchID).
		Clauses(clause.Locking{Strength: "UPDATE"}).
		Take(&target).Error
	if err != nil {
		return target, err
	}

	var active struct {
		IndividualActive bool
		TeamActive       bool
		MixedActive      bool
	}
	// GORM does not map the three temporary active columns into the public
	// target. Read them once more from the locked elimination's competition.
	if err := tx.Table("competitions").
		Select("elimination_is_active AS individual_active, team_elimination_is_active AS team_active, mixed_elimination_is_active AS mixed_active").
		Joins("JOIN `groups` AS competition_group ON competition_group.competition_id = competitions.id").
		Joins("JOIN eliminations ON eliminations.group_id = competition_group.id").
		Where("eliminations.id = ?", target.EliminationID).
		Take(&active).Error; err != nil {
		return target, err
	}
	switch target.TeamSize {
	case 1:
		target.IsActive = active.IndividualActive
	case 3:
		target.IsActive = active.TeamActive
	case 2:
		target.IsActive = active.MixedActive
	default:
		return target, errScoreForbidden
	}
	return target, nil
}

func stageIndexForElimination(tx *gorm.DB, eliminationID, stageID uint) (uint, error) {
	var count int64
	if err := tx.Model(&database.Stage{}).
		Where("elimination_id = ? AND id < ?", eliminationID, stageID).
		Count(&count).Error; err != nil {
		return 0, err
	}
	return uint(count), nil
}

func playerParticipatesInMatch(tx *gorm.DB, userID, matchID uint) (bool, error) {
	var count int64
	err := tx.Table("match_results").
		Joins("JOIN player_set_match_tables ON player_set_match_tables.player_set_id = match_results.player_set_id").
		Joins("JOIN players ON players.id = player_set_match_tables.player_id").
		Joins("JOIN participants ON participants.id = players.participant_id").
		Where("match_results.match_id = ? AND participants.user_id = ?", matchID, userID).
		Count(&count).Error
	return count > 0, err
}

func requireOccupiedMatch(tx *gorm.DB, matchID uint) error {
	var results []database.MatchResult
	if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).
		Where("match_id = ?", matchID).
		Order("id ASC").
		Find(&results).Error; err != nil {
		return err
	}
	if len(results) != 2 || results[0].PlayerSetId == nil || results[1].PlayerSetId == nil {
		return errBracketEmptySlot
	}
	return nil
}

func requireMatchSidesUnconfirmed(tx *gorm.DB, matchID uint, targetEndID uint) error {
	var end database.MatchEnd
	if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&end, targetEndID).Error; err != nil {
		return err
	}
	var count int64
	if err := tx.Table("match_results").Where("id = ? AND match_id = ?", end.MatchResultId, matchID).Count(&count).Error; err != nil {
		return err
	}
	if count != 1 || end.IsConfirmed {
		return errScoreForbidden
	}
	return nil
}

// authorizeEliminationScore must run after lockEliminationForScoring.
// It observes current_stage and score confirmation under the same transaction
// as the eventual write.
func authorizeEliminationScore(context *gin.Context, tx *gorm.DB, eliminationID, matchID uint, matchEndID *uint) (scoreActor, error) {
	userID, err := scoreSessionUserID(context)
	if err != nil {
		return 0, err
	}
	target, err := eliminationScoreTargetForMatch(tx, matchID)
	if err != nil {
		return 0, err
	}
	if target.EliminationID != eliminationID {
		return 0, errScoreForbidden
	}
	actor, err := approvedScoreActor(tx, target.CompetitionID, userID)
	if err != nil {
		return 0, err
	}
	if actor == scoreActorAdmin {
		return actor, nil
	}
	stageIndex, err := stageIndexForElimination(tx, target.EliminationID, target.StageID)
	if err != nil {
		return 0, err
	}
	if !target.IsActive || stageIndex != target.CurrentStage {
		return 0, errScoreForbidden
	}
	if actor == scoreActorJudge {
		return actor, nil
	}
	if matchEndID == nil {
		return 0, errScoreForbidden
	}
	participates, err := playerParticipatesInMatch(tx, userID, matchID)
	if err != nil {
		return 0, err
	}
	if !participates {
		return 0, errScoreForbidden
	}
	if err := requireMatchSidesUnconfirmed(tx, matchID, *matchEndID); err != nil {
		return 0, err
	}
	return actor, nil
}

func qualificationScoreTargetForEnd(tx *gorm.DB, roundEndID uint) (qualificationScoreTarget, error) {
	var target qualificationScoreTarget
	err := tx.Table("round_ends").
		Select("participants.competition_id AS competition_id, players.id AS player_id, players.lane_id AS lane_id, rounds.id AS round_id, round_ends.id AS round_end_id, competitions.qualification_current_end AS qualification_current_end").
		Joins("JOIN rounds ON rounds.id = round_ends.round_id").
		Joins("JOIN players ON players.id = rounds.player_id").
		Joins("JOIN participants ON participants.id = players.participant_id").
		Joins("JOIN competitions ON competitions.id = participants.competition_id").
		Where("round_ends.id = ?", roundEndID).
		Clauses(clause.Locking{Strength: "UPDATE"}).
		Take(&target).Error
	return target, err
}

func qualificationCompetitionForPlayer(tx *gorm.DB, playerID uint) (uint, error) {
	var relation struct{ CompetitionID uint }
	err := tx.Table("players").
		Select("participants.competition_id AS competition_id").
		Joins("JOIN participants ON participants.id = players.participant_id").
		Where("players.id = ?", playerID).
		Clauses(clause.Locking{Strength: "UPDATE"}).
		Take(&relation).Error
	return relation.CompetitionID, err
}

// Legacy aggregate and shoot-off endpoints have no end to which the normal
// player-current-lane rule can be attached. They are rescue operations only:
// an approved Judge or Admin for the target competition may use them.
func authorizeQualificationRescue(context *gin.Context, tx *gorm.DB, playerID uint) (scoreActor, error) {
	userID, err := scoreSessionUserID(context)
	if err != nil {
		return 0, err
	}
	competitionID, err := qualificationCompetitionForPlayer(tx, playerID)
	if err != nil {
		return 0, err
	}
	actor, err := approvedScoreActor(tx, competitionID, userID)
	if err != nil {
		return 0, err
	}
	if actor == scoreActorPlayer {
		return 0, errScoreForbidden
	}
	return actor, nil
}

func qualificationEndIndex(tx *gorm.DB, playerID, roundID, roundEndID uint) (int, error) {
	var count int64
	err := tx.Table("round_ends").
		Joins("JOIN rounds ON rounds.id = round_ends.round_id").
		Where("rounds.player_id = ? AND (rounds.id < ? OR (rounds.id = ? AND round_ends.id < ?))", playerID, roundID, roundID, roundEndID).
		Count(&count).Error
	return int(count), err
}

func authorizeQualificationScore(context *gin.Context, tx *gorm.DB, roundEndID uint) (scoreActor, qualificationScoreTarget, error) {
	userID, err := scoreSessionUserID(context)
	if err != nil {
		return 0, qualificationScoreTarget{}, err
	}
	target, err := qualificationScoreTargetForEnd(tx, roundEndID)
	if err != nil {
		return 0, target, err
	}
	actor, err := approvedScoreActor(tx, target.CompetitionID, userID)
	if err != nil || actor == scoreActorAdmin || actor == scoreActorJudge {
		return actor, target, err
	}
	var ownsLane int64
	if err := tx.Table("players").
		Joins("JOIN participants ON participants.id = players.participant_id").
		Where("players.lane_id = ? AND participants.competition_id = ? AND participants.user_id = ?", target.LaneID, target.CompetitionID, userID).
		Count(&ownsLane).Error; err != nil {
		return 0, target, err
	}
	if ownsLane == 0 {
		return 0, target, errScoreForbidden
	}
	endIndex, err := qualificationEndIndex(tx, target.PlayerID, target.RoundID, target.RoundEndID)
	if err != nil {
		return 0, target, err
	}
	if endIndex != target.QualificationCurrentEnd {
		return 0, target, errScoreForbidden
	}
	return actor, target, nil
}

func writeScoreAuthorizationError(context *gin.Context, err error) bool {
	if errors.Is(err, errScoreLoginRequired) {
		context.JSON(403, gin.H{"error": "Require login"})
		return true
	}
	if errors.Is(err, errScoreForbidden) {
		context.JSON(403, gin.H{"error": "Approved competition scoring role required"})
		return true
	}
	return false
}
