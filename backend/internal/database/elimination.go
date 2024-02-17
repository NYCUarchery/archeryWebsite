package database

import "gorm.io/gorm"

type Elimination struct {
	ID           uint         `json:"id"        gorm:"primary_key"`
	GroupId      uint         `json:"group_id" gorm:"constraint:oneToMany;"`
	CurrentStage uint         `json:"current_stage"`
	CurrentEnd   uint         `json:"current_end"`
	TeamSize     int          `json:"team_size"`
	PlayerSets   []*PlayerSet `json:"player_sets" gorm:"constraint:OnDelete:CASCADE;"`
	Stages       []*Stage     `json:"stages" gorm:"constraint:OnDelete:CASCADE;"`
	Medals       []*Medal     `json:"medals" gorm:"constraint:OnDelete:CASCADE;"`
}
type Stage struct {
	ID            uint     `json:"id"        gorm:"primary_key"`
	EliminationId uint     `json:"elimination_id"`
	Matchs        []*Match `json:"matchs" gorm:"constraint:OnDelete:CASCADE;"`
}

type Match struct {
	ID           uint           `json:"id"        gorm:"primary_key"`
	StageId      uint           `json:"stage_id"`
	MatchResults []*MatchResult `json:"match_results" gorm:"constraint:OnDelete:CASCADE;"`
}

func InitElimination() {
	DB.AutoMigrate(&Elimination{})
	DB.AutoMigrate(&Stage{})
	DB.AutoMigrate(&Match{})
}

func GetEliminationIsExist(id uint) bool {
	var data Elimination
	DB.Table("eliminations").Where("id = ?", id).First(&data)
	return data.ID != 0
}

func GetStageIsExist(id uint) bool {
	var data Stage
	DB.Table("stages").Where("id = ?", id).First(&data)
	return data.ID != 0
}

func GetMatchIsExist(id uint) bool {
	var data Match
	DB.Table("matches").Where("id = ?", id).First(&data)
	return data.ID != 0
}

func GetOnlyEliminationById(id uint) (Elimination, error) {
	var data Elimination
	result := DB.Table("eliminations").Where("id = ?", id).First(&data)
	return data, result.Error
}

func GetEliminationByGroupId(groupId uint) ([]Elimination, error) {
	var eliminations []Elimination
	result := DB.Where("group_id = ?", groupId).
		Select("id, team_size").
		Order("team_size ASC").
		Find(&eliminations)
	return eliminations, result.Error
}

func GetEliminationWPlayerSetsById(id uint) (Elimination, error) {
	var data Elimination
	result := DB.
		Preload("PlayerSets", func(*gorm.DB) *gorm.DB {
			return DB.Order("`rank` asc")
		}).
		Model(&Elimination{}).
		Where("id = ?", id).
		First(&data)
	return data, result.Error
}

func GetEliminationWStagesMatchesById(id uint) (Elimination, error) {
	var data Elimination
	result := DB.
		Preload("Stages.Matchs", func(*gorm.DB) *gorm.DB {
			return DB.Order("id asc")
		}).
		Model(&Elimination{}).
		Where("id = ?", id).
		First(&data)
	return data, result.Error
}

func GetEliminationWScoresById(id uint) (Elimination, error) {
	var data Elimination
	result := DB.
		Preload("Stages.Matchs.MatchResults.MatchEnds.MatchScores", func(*gorm.DB) *gorm.DB {
			return DB.Order("id asc")
		}).
		Model(&Elimination{}).
		Where("id = ?", id).
		First(&data)
	return data, result.Error
}

func GetEliminationTeamSizeByMatchResultId(matchResultId uint) (int, error) {
	var teamSize int
	subQueryA := DB.
		Table("match_results").
		Select("match_results.match_id").
		Where("match_results.id = ?", matchResultId)
	subQueryB := DB.
		Table("matches").
		Select("matches.stage_id").
		Joins("JOIN (?) AS A ON A.match_id = matches.id", subQueryA)
	subQueryC := DB.
		Table("stages").
		Select("stages.elimination_id").
		Joins("JOIN (?) AS B ON B.stage_id = stages.id", subQueryB)
	result := DB.Table("eliminations").
		Select("eliminations.team_size").
		Joins("JOIN (?) AS C ON C.elimination_id = eliminations.id", subQueryC).
		Scan(&teamSize)

	return teamSize, result.Error
}

func GetEliminationById(id uint) (Elimination, error) {
	var data Elimination
	result := DB.
		Preload("PlayerSets", func(*gorm.DB) *gorm.DB {
			return DB.Order("`rank` asc").
				Preload("Players")
		}).
		Preload("Medals").
		Preload("Stages.Matchs.MatchResults", func(*gorm.DB) *gorm.DB {
			return DB.Order("id asc").
				Preload("MatchEnds.MatchScores", func(*gorm.DB) *gorm.DB {
					return DB.Order("score DESC")
				})
		}).
		Model(&Elimination{}).
		Where("id = ?", id).
		First(&data)
	return data, result.Error
}

func GetStageById(id uint) (Stage, error) {
	var data Stage
	result := DB.
		Model(&Stage{}).
		Where("id = ?", id).
		First(&data)
	return data, result.Error
}

func GetMatchWScoresById(id uint) (Match, error) {
	var data Match
	result := DB.
		Preload("MatchResults", func(*gorm.DB) *gorm.DB {
			return DB.Order("id asc").
				Preload("PlayerSet").
				Preload("MatchEnds.MatchScores", func(*gorm.DB) *gorm.DB {
					return DB.Order("score DESC")
				})
		}).
		Model(&Match{}).
		Where("id = ?", id).
		First(&data)
	return data, result.Error
}

func CreateElimination(data Elimination) (Elimination, error) {
	result := DB.Model(&Elimination{}).Create(&data)
	return data, result.Error
}

func CreateStage(data Stage) (Stage, error) {
	result := DB.Model(&Stage{}).Create(&data)
	return data, result.Error
}

func CreateMatch(data Match) (Match, error) {
	result := DB.Model(&Match{}).Create(&data)
	return data, result.Error
}

func UpdateEliminationCurrentStagePlus(id uint) error {
	result := DB.
		Model(&Elimination{}).
		Where("id = ?", id).
		Update("CurrentStage", gorm.Expr("current_stage + ?", 1))
	return result.Error
}
func UpdateEliminationCurrentStageMinus(id uint) error {
	result := DB.
		Model(&Elimination{}).
		Where("id = ?", id).
		Update("CurrentStage", gorm.Expr("current_stage - ?", 1))
	return result.Error
}
func UpdateEliminationCurrentEndPlus(id uint) error {
	result := DB.
		Model(&Elimination{}).
		Where("id = ?", id).
		Update("CurrentEnd", gorm.Expr("current_end + ?", 1))
	return result.Error
}
func UpdateEliminationCurrentEndMinus(id uint) error {
	result := DB.
		Model(&Elimination{}).
		Where("id = ?", id).
		Update("CurrentEnd", gorm.Expr("current_end - ?", 1))
	return result.Error
}

func DeleteElimination(id uint) (bool, error) {
	result := DB.Delete(&Elimination{}, "id =?", id)
	isChanged := result.RowsAffected != 0
	return isChanged, result.Error
}
