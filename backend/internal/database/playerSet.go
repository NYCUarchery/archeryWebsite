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

type ResultStruct struct {
	PlayerSetId   uint
	AllTotalScore int
	AllXCnt       int
	AllTenUpCnt   int
}

func GetEliminationPlayerSetIdRankOrderById(eliminationId uint) ([]ResultStruct, error) {
	var yourResultStruct []ResultStruct
	result := DB.Table("(SELECT player_sets.id AS player_set_id, player_set_match_tables.player_id FROM player_sets JOIN player_set_match_tables ON player_sets.id = player_set_match_tables.player_set_id WHERE player_sets.elimination_id = ?) AS A", eliminationId).
		Select("A.player_set_id, SUM(C.total_score) AS all_total_score, SUM(C.x_cnt) AS all_x_cnt, SUM(C.ten_up_cnt) AS all_ten_up_cnt").
		Joins("JOIN (SELECT players.id AS player_id, players.total_score, SUM(IF(round_scores.score = 11, 1, 0)) AS x_cnt, SUM(IF(round_scores.score >= 10, 1, 0)) AS ten_up_cnt FROM players JOIN (SELECT DISTINCT player_set_match_tables.player_id FROM player_sets JOIN player_set_match_tables ON player_sets.id = player_set_match_tables.player_set_id WHERE player_sets.elimination_id = ?) AS B ON players.id = B.player_id JOIN rounds ON players.id = rounds.player_id JOIN round_ends ON rounds.id = round_ends.round_id JOIN round_scores ON round_ends.id = round_scores.round_end_id GROUP BY players.id, players.total_score) AS C ON A.player_id = C.player_id", eliminationId).
		Group("A.player_set_id").
		Order("all_total_score DESC, all_ten_up_cnt DESC, all_x_cnt DESC").
		Scan(&yourResultStruct)

	return yourResultStruct, result.Error
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
func UpdatePlayerSetRank(id uint, rank int) error {
	result := DB.Table("player_sets").
		Where("id = ?", id).
		UpdateColumn("rank", rank)
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
