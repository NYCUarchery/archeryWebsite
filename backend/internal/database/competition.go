package database

import (
	"gorm.io/gorm"
	"time"
)

type Competition struct { // DB : game_info
	ID                       uint           `json:"id"        gorm:"primary_key"`
	Title                    string         `json:"title"`
	SubTitle                 string         `json:"sub_title"`
	Date                     time.Time      `json:"date"`
	HostId                   uint           `json:"host_id"`
	RoundsNum                int            `json:"rounds_num"`
	GroupsNum                int            `json:"groups_num"`
	UnassignedGroupId        uint           `json:"unassigned_group_id"`
	LanesNum                 int            `json:"lanes_num"`
	UnassignedLaneId         uint           `json:"unassigned_lane_id"`
	CurrentPhase             int            `json:"current_phase"`
	QualificationIsActive    bool           `json:"qualification_is_active"`
	EliminationIsActive      bool           `json:"elimination_is_active"`
	TeamEliminationIsActive  bool           `json:"team_elimination_is_active"`
	MixedEliminationIsActive bool           `json:"mixed_elimination_is_active"`
	Script                   string         `json:"script"`
	Groups                   []*Group       `json:"groups" gorm:"constraint:OnDelete:CASCADE;"`
	Participants             []*Participant `json:"participants"`
}

func InitCompetition() {
	DB.AutoMigrate(&Competition{})
}

func GetCompetitionIsExist(id uint) bool {
	var data Competition
	DB.Table("competitions").Where("id = ?", id).First(&data)
	return data.ID != 0
}

func GetOnlyCompetition(ID uint) (Competition, error) {
	var data Competition
	result := DB.Table("competitions").Where("id = ?", ID).First(&data)
	return data, result.Error
}

func GetCompetitionWParticipants(ID uint) (Competition, error) {
	var data Competition
	result := DB.
		Preload("Participants").
		Model(&Competition{}).
		Where("id = ?", ID).
		Find(&data)
	return data, result.Error
}

func GetCompetitionGroupIds(ID uint) ([]uint, error) {
	var data []uint
	result := DB.Table("groups").Where("competition_id = ?", ID).Pluck("id", &data)
	return data, result.Error
}

func GetCompetitionWGroups(ID uint) (Competition, error) {
	var data Competition
	result := DB.
		Preload("Groups", func(*gorm.DB) *gorm.DB {
			return DB.Order("group_index asc")
		}).
		Model(&Competition{}).
		Where("id = ?", ID).
		First(&data)
	return data, result.Error
}

func GetCompetitionWGroupsPlayers(ID uint) (Competition, error) {
	var data Competition
	result := DB.
		Preload("Groups", func(*gorm.DB) *gorm.DB {
			return DB.Order("group_index asc").
				Preload("Players")
		}).
		Model(&Competition{}).
		Where("id = ?", ID).
		First(&data)
	return data, result.Error
}

func PostCompetition(data Competition) (Competition, error) {
	result := DB.Model(&Competition{}).Create(&data)
	return data, result.Error
}

func UpdateCompetition(ID uint, newdata Competition) (bool, error) {
	result := DB.Model(&Competition{}).Where("id = ?", ID).Updates(&newdata)
	isChanged := result.RowsAffected != 0
	return isChanged, result.Error
}

func DeleteCompetition(ID uint) (bool, error) {
	result := DB.Delete(&Competition{}, "id =?", ID)
	isChanged := result.RowsAffected != 0
	return isChanged, result.Error
}

func AddOneCompetitionGroupNum(CompetitionID uint) {
	groupNum := GetCompetitionGroupNum(CompetitionID)
	UpdateCompetitionGroupNum(CompetitionID, groupNum+1)
}
func MinusOneCompetitionGroupNum(CompetitionID uint) {
	groupNum := GetCompetitionGroupNum(CompetitionID)
	UpdateCompetitionGroupNum(CompetitionID, groupNum-1)
}
func GetCompetitionGroupNum(ID uint) int {
	var data Competition
	DB.Table("competitions").Where("id = ?", ID).First(&data)
	return data.GroupsNum
}
func UpdateCompetitionGroupNum(ID uint, newGroupNum int) bool {
	result := DB.Table("competitions").Where("id = ?", ID).UpdateColumn("groups_num", newGroupNum)
	isChanged := result.RowsAffected != 0
	return isChanged
}

func GetCompetitionLaneNum(ID uint) int {
	var data Competition
	DB.Table("competitions").Where("id = ?", ID).First(&data)
	return data.LanesNum
}
func GetCompetitionUnassignedLaneId(ID uint) uint {
	var data Competition
	DB.Table("competitions").Where("id = ?", ID).First(&data)
	return data.UnassignedLaneId
}
func UpdateCompetitionUnassignedLaneId(ID uint, newUnassignedLaneId uint) bool {
	result := DB.Model(&Competition{}).Where("id = ?", ID).UpdateColumn("unassigned_lane_id", newUnassignedLaneId)
	isChanged := result.RowsAffected != 0
	return isChanged
}

func GetCompetitionUnassignedGroupId(ID uint) uint {
	var data Competition
	DB.Table("competitions").Where("id = ?", ID).First(&data)
	return data.UnassignedGroupId
}
func UpdateCompetitionUnassignedGroupId(ID uint, newUnassignedGroupId uint) bool {
	result := DB.Model(&Competition{}).Where("id = ?", ID).UpdateColumn("unassigned_group_id", newUnassignedGroupId)
	isChanged := result.RowsAffected != 0
	return isChanged
}

func GetCompetitionRoundsNum(ID uint) int {
	var data Competition
	DB.Table("competitions").Where("id = ?", ID).First(&data)
	return data.RoundsNum
}
