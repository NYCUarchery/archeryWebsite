package database

import "gorm.io/gorm"

type PlayerSet struct {
	ID            uint      `json:"id"        gorm:"primary_key"`
	EliminationId uint      `json:"elimination_id"`
	TotalScore    int       `json:"total_score"`
	Rank          int       `json:"rank"`
	SetName       string    `json:"set_name"`
	Players       []*Player `json:"players" gorm:"many2many:player_set_match_tables;"`
}

type PlayerSetMatchTable struct {
	ID          uint `json:"id"          gorm:"primary_key"`
	PlayerId    uint `json:"player_id"`
	PlayerSetId uint `json:"player_set_id"`
}

func InitPlayerSet() {
	DB.AutoMigrate(&PlayerSet{})
	DB.AutoMigrate(&PlayerSetMatchTable{})
}

func GetPlayerSetIsExist(id uint) bool {
	var data PlayerSet
	DB.Table("player_sets").Where("id = ?", id).First(&data)
	return data.ID != 0
}

func GetPlayerSetById(id uint) (PlayerSet, error) {
	var data PlayerSet
	result := DB.
		Preload("Players", func(*gorm.DB) *gorm.DB {
			return DB.Order("`rank` asc")
		}).
		Table("player_sets").
		Where("id = ?", id).
		First(&data)
	return data, result.Error
}

func GetPlayerIdsByPlayerSetId(id uint) ([]uint, error) {
	var data []uint
	result := DB.Table("player_set_match_tables").
		Where("player_set_id = ?", id).
		Pluck("player_id", &data)
	return data, result.Error
}
func GetPlayerWPlayerSetsByIDCompeitionID(id uint, eliminationId uint) (Player, error) {
	var data Player
	result := DB.
		Preload("PlayerSets", func(*gorm.DB) *gorm.DB {
			return DB.Order("`rank` asc").
				Where("elimination_id = ?", eliminationId)
		}).
		Model(&Player{}).
		Where("id = ?", id).
		First(&data)
	return data, result.Error
}

func GetPlayerSetsByEliminationId(id uint) ([]PlayerSet, error) {
	var data []PlayerSet
	result := DB.Table("player_sets").
		Where("elimination_id = ?", id).
		Order("`rank` asc, `total_score` desc").
		Find(&data)
	return data, result.Error
}

func CreatePlayerSet(data PlayerSet) (PlayerSet, error) {
	result := DB.Table("player_sets").Create(&data)
	return data, result.Error
}

func CreatePlayerSetMatchTable(data PlayerSetMatchTable) (PlayerSetMatchTable, error) {
	result := DB.Table("player_set_match_tables").Create(&data)
	return data, result.Error
}

func UpdatePlayerSetName(id uint, name string) error {
	result := DB.Table("player_sets").
		Where("id = ?", id).
		Update("set_name", name)
	return result.Error
}
func DeletePlayerSetById(id uint) (bool, error) {
	result := DB.Table("player_sets").Where("id = ?", id).Delete(PlayerSet{})
	isChanged := result.RowsAffected != 0
	return isChanged, result.Error
}
func DeletePlayerSetMatchTableByPlayerSetId(id uint) (bool, error) {
	result := DB.Table("player_set_match_tables").Where("player_set_id = ?", id).Delete(PlayerSetMatchTable{})
	isChanged := result.RowsAffected != 0
	return isChanged, result.Error
}
