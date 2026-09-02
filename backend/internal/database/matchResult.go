package database

import (
	"database/sql"
	"fmt"
	"log"
	"strings"

	"gorm.io/gorm"
)

type MatchResult struct {
	ID      uint `json:"id"        gorm:"primary_key"`
	MatchId uint `json:"match_id"`
	// PlayerSetId is nil for an as-yet unknown bracket slot.  Zero cannot
	// represent that state because it is also a valid Go uint default and used
	// by older rows without a foreign-key constraint.
	PlayerSetId *uint `json:"player_set_id,omitempty"`
	// Target is the physical target side used for this result.  It is nil
	// until an administrator assigns a placement, otherwise it is "A" or "B".
	Target        *string     `json:"target,omitempty" enums:"A,B" extensions:"x-nullable" gorm:"type:char(1);check:match_results_target_allowed,target IN ('A','B') OR target IS NULL"`
	TotalPoints   int         `json:"total_points" gorm:"-" readonly:"true"`
	ShootOffScore int         `json:"shoot_off_score"`
	IsWinner      bool        `json:"is_winner"`
	LaneNumber    int         `json:"lane_number"`
	PlayerSet     *PlayerSet  `json:"player_set" gorm:"foreignKey:PlayerSetId;constraint:OnDelete:SET NULL;"`
	MatchEnds     []*MatchEnd `json:"match_ends" gorm:"constraint:OnDelete:CASCADE;"`
}

type MatchEnd struct {
	ID               uint          `json:"id"        gorm:"primary_key"`
	MatchResultId    uint          `json:"match_result_id"`
	TotalScore       int           `json:"total_scores"`
	IsConfirmed      bool          `json:"is_confirmed"`
	Points           *int          `json:"points" gorm:"-" extensions:"x-nullable" readonly:"true"`
	CumulativePoints int           `json:"cumulative_points" gorm:"-" readonly:"true"`
	MatchScores      []*MatchScore `json:"match_scores" gorm:"constraint:OnDelete:CASCADE;"`
}

type MatchScore struct {
	ID         uint `json:"id"        gorm:"primary_key"`
	MatchEndId uint `json:"match_end_id"`
	Score      int  `json:"score"`
}

func InitMatchResult() {
	if err := DB.AutoMigrate(&MatchResult{}); err != nil {
		log.Println("Failed to auto migrate MatchResult:", err)
		return
	}
	if DB.Migrator().HasColumn(&MatchResult{}, "total_points") {
		if err := DB.Migrator().DropColumn(&MatchResult{}, "total_points"); err != nil {
			panic(fmt.Sprintf("failed to drop legacy MatchResult total_points: %v", err))
		}
	}
	if err := ensureMatchResultPlayerSetConstraint(); err != nil {
		// Continuing without this FK would let roster deletion leave dangling
		// bracket slots. Treat this migration as a startup invariant.
		panic(fmt.Sprintf("failed to migrate MatchResult PlayerSet constraint: %v", err))
	}
	if err := DB.AutoMigrate(&MatchEnd{}); err != nil {
		log.Println("Failed to auto migrate MatchEnd:", err)
		return
	}
	if err := DB.AutoMigrate(&MatchScore{}); err != nil {
		log.Println("Failed to auto migrate MatchScore:", err)
	}
}

// ensureMatchResultPlayerSetConstraint upgrades legacy RESTRICT schemas once,
// while avoiding disruptive DROP/CREATE DDL on every application startup.
func ensureMatchResultPlayerSetConstraint() error {
	var deleteRule string
	err := DB.Raw(`
		SELECT DELETE_RULE
		FROM information_schema.REFERENTIAL_CONSTRAINTS
		WHERE CONSTRAINT_SCHEMA = DATABASE()
		  AND TABLE_NAME = 'match_results'
		  AND REFERENCED_TABLE_NAME = 'player_sets'
		LIMIT 1
	`).Row().Scan(&deleteRule)
	if err == nil && strings.EqualFold(deleteRule, "SET NULL") {
		return nil
	}
	if err != nil && err != sql.ErrNoRows {
		return err
	}
	if err == nil {
		if err := DB.Migrator().DropConstraint(&MatchResult{}, "PlayerSet"); err != nil {
			return err
		}
	}
	return DB.Migrator().CreateConstraint(&MatchResult{}, "PlayerSet")
}

func DropMatchResult() {
	if DB.Migrator().HasTable(&MatchScore{}) {
		if err := DB.Migrator().DropTable(&MatchScore{}); err != nil {
			log.Println("Failed to drop MatchScore:", err)
			return
		}
	}
	if DB.Migrator().HasTable(&MatchEnd{}) {
		if err := DB.Migrator().DropTable(&MatchEnd{}); err != nil {
			log.Println("Failed to drop MatchEnd:", err)
			return
		}
	}
	if DB.Migrator().HasTable(&MatchResult{}) {
		if err := DB.Migrator().DropTable(&MatchResult{}); err != nil {
			log.Println("Failed to drop MatchResult:", err)
			return
		}
	}
}

func GetMatchResultIsExist(id uint) bool {
	var data MatchResult
	DB.Table("match_results").Where("id = ?", id).First(&data)
	return data.ID != 0
}
func GetMatchEndIsExist(id uint) bool {
	var data MatchEnd
	DB.Table("match_ends").Where("id = ?", id).First(&data)
	return data.ID != 0
}
func GetMatchScoreIsExist(id uint) bool {
	var data MatchScore
	DB.Table("match_scores").Where("id = ?", id).First(&data)
	return data.ID != 0
}
func GetMatchScoreWMEndIdIsExist(id uint, match_end_id uint) bool {
	var data MatchScore
	DB.Table("match_scores").Where("id = ? AND match_end_id = ?", id, match_end_id).First(&data)
	return data.ID != 0
}

func GetMatchResultById(id uint) (MatchResult, error) {
	data, err := getComputedMatchResultByID(id)
	if err != nil {
		return data, err
	}
	data.MatchEnds = nil
	return data, nil
}
func GetMatchResultWScoresById(id uint) (MatchResult, error) {
	return getComputedMatchResultByID(id)
}

// getComputedMatchResultByID loads both sides of the containing match because
// set points cannot be derived from one MatchResult in isolation.
func getComputedMatchResultByID(id uint) (MatchResult, error) {
	var relation MatchResult
	if err := DB.Select("id", "match_id").First(&relation, id).Error; err != nil {
		return relation, err
	}
	match, err := GetMatchWScoresById(relation.MatchId)
	if err != nil {
		return MatchResult{}, err
	}
	for _, result := range match.MatchResults {
		if result.ID == id {
			return *result, nil
		}
	}
	return MatchResult{}, gorm.ErrRecordNotFound
}
func GetMatchScoreById(id uint) (MatchScore, error) {
	var data MatchScore
	result := DB.Table("match_scores").Where("id = ?", id).First(&data)
	return data, result.Error
}
func GetMatchEndById(id uint) (MatchEnd, error) {
	var data MatchEnd
	result := DB.Table("match_ends").Where("id = ?", id).
		First(&data)
	return data, result.Error
}

func CreateMatchResult(data MatchResult) (MatchResult, error) {
	result := DB.Table("match_results").Create(&data)
	return data, result.Error
}
func CreateMatchEnd(data MatchEnd) (MatchEnd, error) {
	result := DB.Table("match_ends").Create(&data)
	return data, result.Error
}
func CreateMatchScore(data MatchScore) (MatchScore, error) {
	result := DB.Table("match_scores").Create(&data)
	return data, result.Error
}

func UpdateMatchResultById(id uint, data MatchResult) (MatchResult, error) {
	result := DB.Table("match_results").Where("id = ?", id).Updates(data)
	return data, result.Error
}
func UpdateMatchEndById(id uint, data MatchEnd) (MatchEnd, error) {
	result := DB.Table("match_ends").Where("id = ?", id).Updates(data)
	return data, result.Error
}

func UpdateMatchResultPlayerSetIdById(id uint, playerSetId uint) error {
	result := DB.Table("match_results").Where("id = ?", id).Update("player_set_id", playerSetId)
	return result.Error
}

func UpdateMatchShootOffScoreById(id uint, shootOffScore int) error {
	result := DB.Table("match_results").Where("id = ?", id).Update("shoot_off_score", shootOffScore)
	return result.Error
}
func UpdateMatchResultIsWinnerById(id uint, isWinner bool) error {
	result := DB.Table("match_results").Where("id = ?", id).Update("is_winner", isWinner)
	return result.Error
}
func UpdateMatchResultLaneNumberById(id uint, laneNumber int) error {
	result := DB.Table("match_results").Where("id = ?", id).Update("lane_number", laneNumber)
	return result.Error
}
func UpdateMatchEndsTotalScoresById(id uint, totalScore int) error {
	result := DB.Table("match_ends").Where("id = ?", id).Update("total_score", totalScore)
	return result.Error
}
func UpdateMatchEndsIsConfirmedById(id uint, isConfirmed bool) error {
	result := DB.Table("match_ends").Where("id = ?", id).Update("is_confirmed", isConfirmed)
	return result.Error
}
func UpdateMatchScoreScoreById(id uint, score int) error {
	result := DB.Table("match_scores").Where("id = ?", id).Update("score", score)
	return result.Error
}
func UpdateMatchScoreScoresByMatchEndId(id uint, match_end_id uint, score int) error {
	result := DB.Table("match_scores").Where("id = ? AND match_end_id = ?", id, match_end_id).Update("score", score)
	return result.Error
}

func DeleteMatchResultById(id uint) error {
	result := DB.Table("match_results").Where("id = ?", id).Delete(&MatchResult{})
	return result.Error
}
