package database

import (
	"gorm.io/gorm"
)

type Group struct {
	ID            uint      `json:"id" gorm:"primary_key"`
	CompetitionId uint      `json:"competition_id" `
	GroupName     string    `json:"group_name"`
	GroupRange    string    `json:"group_range"`
	BowType       string    `json:"bow_type"`
	GroupIndex    int       `json:"group_index"`
	Players       []*Player `json:"players" `
}

func InitGroupInfo() {
	DB.Table("groups").AutoMigrate(&Group{})
}

func GetGroupIsExist(id uint) bool {
	var group Group
	DB.Table("groups").Where("id = ?", id).First(&group)
	return group.ID != 0
}

func GetGroupInfoById(id uint) (Group, error) {
	var group Group
	result := DB.Table("groups").Where("id = ?", id).First(&group)
	return group, result.Error
}

func GetGroupInfoWPlayersById(id uint) (Group, error) {
	var group Group
	result := DB.
		Preload("Players", func(*gorm.DB) *gorm.DB {
			return DB.Order("`rank` asc")
		}).
		Model(&Group{}).
		Where("id = ?", id).
		First(&group)
	return group, result.Error
}

func GetGroupPlayerIdRankOrderById(groupId uint) ([]uint, error) {
	var playerIds []uint
	subquery := DB.Table("players").
		Select("players.id, SUM(IF(round_scores.score = 11, 1, 0))AS cnt").
		Joins("JOIN rounds ON players.id = rounds.player_id").
		Joins("JOIN round_ends ON rounds.id = round_ends.round_id").
		Joins("JOIN round_scores ON round_ends.id = round_scores.round_end_id").
		Where("players.group_id = ?", groupId).
		Group("players.id")

	result := DB.Table("players").
		Select("players.id").
		Joins("JOIN `groups` ON `groups`.id = players.group_id").
		Joins("JOIN (?) AS subquery ON subquery.id = players.id", subquery).
		Where("`groups`.id = ?", groupId).
		Order("players.total_score DESC, subquery.cnt DESC, players.shoot_off_score DESC").
		Find(&playerIds)

	return playerIds, result.Error
}

func CreateGroupInfo(group Group) (Group, error) {
	result := DB.Table("groups").Create(&group)
	return group, result.Error
}

func UpdateGroupInfo(id uint, group Group) (bool, error) {
	result := DB.Table("groups").Where("id = ?", id).Updates(&group)
	isChanged := result.RowsAffected != 0
	return isChanged, result.Error
}

func UpdateGroupInfoIndex(id uint, index int) (bool, error) {
	result := DB.Table("groups").Where("id = ?", id).Update("group_index", index)
	isChanged := result.RowsAffected != 0
	return isChanged, result.Error
}

func DeleteGroupInfo(id uint) (bool, error) {
	result := DB.Table("groups").Where("id = ?", id).Delete(&Group{})
	isChanged := result.RowsAffected != 0
	return isChanged, result.Error
}
