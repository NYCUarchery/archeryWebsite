package endpoint

import (
	"backend/internal/database"
	"backend/internal/pkg"
	"errors"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

// Control writes must derive their competition from the persisted target.  A
// session gamerole can describe another competition, and must not authorize a
// mutation here.
var (
	errControlLoginRequired    = errors.New("login required for competition control")
	errControlForbidden        = errors.New("approved competition admin required")
	errControlCrossCompetition = errors.New("player, group, and lane must belong to the same competition")
	errControlLastAdmin        = errors.New("cannot delete the last approved competition admin")
	errControlPlayerExists     = errors.New("participant already has a player")
)

func controlSessionUserID(context *gin.Context) (uint, error) {
	userID, ok := pkg.QuerySession(context, "userid").(uint)
	if !ok || userID == 0 {
		return 0, errControlLoginRequired
	}
	return userID, nil
}

func requireCompetitionAdminTx(context *gin.Context, tx *gorm.DB, competitionID uint) error {
	userID, err := controlSessionUserID(context)
	if err != nil {
		return err
	}
	var participants []database.Participant
	if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).
		Where("competition_id = ? AND user_id = ? AND status = ?", competitionID, userID, "approved").
		Find(&participants).Error; err != nil {
		return err
	}
	if !hasCompetitionAdmin(participants) {
		return errControlForbidden
	}
	return nil
}

func lockedPlayerControlTarget(tx *gorm.DB, playerID uint) (database.Player, database.Participant, error) {
	var player database.Player
	if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&player, playerID).Error; err != nil {
		return player, database.Participant{}, err
	}
	var participant database.Participant
	if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&participant, player.ParticipantId).Error; err != nil {
		return player, participant, err
	}
	return player, participant, nil
}

func authorizePlayerControl(context *gin.Context, tx *gorm.DB, playerID uint) (database.Player, database.Participant, error) {
	player, participant, err := lockedPlayerControlTarget(tx, playerID)
	if err != nil {
		return player, participant, err
	}
	if err := requireCompetitionAdminTx(context, tx, participant.CompetitionID); err != nil {
		return player, participant, err
	}
	return player, participant, nil
}

func lockedControlGroup(tx *gorm.DB, groupID, competitionID uint) (database.Group, error) {
	var group database.Group
	if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&group, groupID).Error; err != nil {
		return group, err
	}
	if group.CompetitionId != competitionID {
		return group, errControlCrossCompetition
	}
	return group, nil
}

func lockedControlLane(tx *gorm.DB, laneID, competitionID uint) (database.Lane, error) {
	var lane database.Lane
	if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&lane, laneID).Error; err != nil {
		return lane, err
	}
	if lane.CompetitionId != competitionID {
		return lane, errControlCrossCompetition
	}
	return lane, nil
}

func lockedCompetitionUnassignedLane(tx *gorm.DB, competitionID uint) (database.Lane, error) {
	var competition database.Competition
	if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&competition, competitionID).Error; err != nil {
		return database.Lane{}, err
	}
	return lockedControlLane(tx, competition.UnassignedLaneId, competitionID)
}

func writeControlAuthorizationError(context *gin.Context, err error) bool {
	switch {
	case errors.Is(err, errControlLoginRequired):
		context.JSON(403, gin.H{"error": "Require login"})
	case errors.Is(err, errControlForbidden):
		context.JSON(403, gin.H{"error": "Competition admin required"})
	case errors.Is(err, errControlCrossCompetition):
		context.JSON(400, gin.H{"error": "Player, group, and lane must belong to the same competition"})
	case errors.Is(err, errControlLastAdmin):
		context.JSON(409, gin.H{"error": "Cannot delete the last approved competition admin"})
	case errors.Is(err, errControlPlayerExists):
		context.JSON(409, gin.H{"error": "Participant already has a player"})
	default:
		return false
	}
	return true
}
