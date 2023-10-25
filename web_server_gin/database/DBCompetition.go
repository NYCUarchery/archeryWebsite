package database

import (
	"gorm.io/gorm"
)

type Competition struct { // DB : game_info
	ID                       uint     `json:"id"        gorm:"primary_key"`
	Title                    string   `json:"title"`
	SubTitle                 string   `json:"sub_title"`
	HostId                   uint     `json:"host_id"`
	Groups_num               int      `json:"groups_num"`
	Lanes_num                int      `json:"lanes_num"`
	CurrentPhase             int      `json:"current_phase"`
	CurrentPhaseKind         string   `json:"current_phase_kind"`
	CurrentStage             uint     `json:"current_stage"`
	QualificationIsActive    bool     `json:"qualification_is_active"`
	EliminationIsActive      bool     `json:"elimination_is_active"`
	TeamEliminationIsActive  bool     `json:"team_elimination_is_active"`
	MixedEliminationIsActive bool     `json:"mixed_elimination_is_active"`
	Script                   string   `json:"script"`
	Groups                   []*Group `json:"groups" gorm:"constraint:OnDelete:CASCADE;"`
}

func InitCompetition() {
	DB.AutoMigrate(&Competition{})
}

func GetCompetitionIsExist(id int) bool {
	var data Competition
	DB.Table("competitions").Where("id = ?", id).First(&data)
	return data.ID != 0
}

func GetOnlyCompetition(ID int) (Competition, error) {
	var data Competition
	result := DB.Table("competitions").Where("id = ?", ID).First(&data)
	return data, result.Error
}

func GetCompetitionWGroups(ID int) (Competition, error) {
	var data Competition
	result := DB.Preload("Groups", func(*gorm.DB) *gorm.DB { return DB.Order("group_index asc") }).
		Model(&Competition{}).Where("id = ?", ID).First(&data)
	return data, result.Error
}

func PostCompetition(data Competition) (Competition, error) {
	result := DB.Model(&Competition{}).Create(&data)
	return data, result.Error
}

func UpdateCompetition(ID int, newdata Competition) (bool, error) {
	result := DB.Model(&Competition{}).Where("id = ?", ID).Updates(&newdata)
	isChanged := result.RowsAffected != 0
	return isChanged, result.Error
}

func DeleteCompetition(ID int) (bool, error) {
	result := DB.Delete(&Competition{}, "id =?", ID)
	isChanged := result.RowsAffected != 0
	return isChanged, result.Error
}

func AddOneCompetitionGroupNum(CompetitionID int) {
	groupNum := GetCompetitionGroupNum(int(CompetitionID))
	UpdateCompetitionGroupNum(int(CompetitionID), groupNum+1)
}
func MinusOneCompetitionGroupNum(CompetitionID int) {
	groupNum := GetCompetitionGroupNum(int(CompetitionID))
	UpdateCompetitionGroupNum(int(CompetitionID), groupNum-1)
}
func GetCompetitionGroupNum(ID int) int {
	var data Competition
	DB.Table("competitions").Where("id = ?", ID).First(&data)
	return data.Groups_num
}
func UpdateCompetitionGroupNum(ID int, newGroupNum int) int {
	result := DB.Table("competitions").Where("id = ?", ID).UpdateColumn("groups_num", newGroupNum)
	return int(result.RowsAffected)
}
