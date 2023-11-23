package database

import "gorm.io/gorm"

type MatchResult struct {
	ID            uint        `json:"id"        gorm:"primary_key"`
	MatchId       uint        `json:"match_id"`
	PlayerSetId   uint        `json:"player_set_id"`
	TotalPoints   int         `json:"total_points"`
	ShootOffScore int         `json:"shoot_off_score"`
	IsWinner      bool        `json:"is_winner"`
	LaneNumber    int         `json:"lane_number"`
	PlayerSet     *PlayerSet  `json:"player_set" gorm:"foreignKey:PlayerSetId;"`
	MatchEnds     []*MatchEnd `json:"match_ends" gorm:"constraint:OnDelete:CASCADE;"`
}

type MatchEnd struct {
	ID            uint          `json:"id"        gorm:"primary_key"`
	MatchResultId uint          `json:"match_result_id"`
	TotalScore    int           `json:"total_scores"`
	IsConfirmed   bool          `json:"is_confirmed"`
	MatchScores   []*MatchScore `json:"match_scores" gorm:"constraint:OnDelete:CASCADE;"`
}

type MatchScore struct {
	ID         uint `json:"id"        gorm:"primary_key"`
	MatchEndId uint `json:"match_end_id"`
	Score      int  `json:"score"`
}

func InitMatchResult() {
	DB.AutoMigrate(&MatchResult{})
	DB.AutoMigrate(&MatchEnd{})
	DB.AutoMigrate(&MatchScore{})
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
	var data MatchResult
	result := DB.
		Preload("PlayerSet").
		Table("match_results").
		Where("id = ?", id).
		First(&data)
	return data, result.Error
}
func GetMatchResultWScoresById(id uint) (MatchResult, error) {
	var data MatchResult
	result := DB.
		Preload("PlayerSet").
		Preload("MatchEnds.MatchScores", func(*gorm.DB) *gorm.DB {
			return DB.Order("score DESC")
		}).
		Model(&MatchResult{}).
		Where("id = ?", id).
		First(&data)
	return data, result.Error
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

func UpdateMatchResultTotalPointsById(id uint, totalPoint int) error {
	result := DB.Table("match_results").Where("id = ?", id).Update("total_points", totalPoint)
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
