package database

import (
	"time"

	"gorm.io/gorm"
)

type Competition struct { // DB : game_info
	ID                       uint      `json:"id"        gorm:"primary_key"`
	Title                    string    `json:"title"`
	SubTitle                 string    `json:"sub_title"`
	Date                     time.Time `json:"date"`
	HostID                   uint      `json:"host_id"`
	GroupsNum                int       `json:"groups_num"`
	NoTypeGroupId            int       `json:"no_type_group_id"`
	LanesNum                 int       `json:"lanes_num"`
	FirstLaneId              uint      `json:"first_lane_id"`
	CurrentPhase             int       `json:"current_phase"`
	QualificationCurrentEnd  int       `json:"qualification_current_end"`
	QualificationIsActive    bool      `json:"qualification_is_active"`
	EliminationIsActive      bool      `json:"elimination_is_active"`
	TeamEliminationIsActive  bool      `json:"team_elimination_is_active"`
	MixedEliminationIsActive bool      `json:"mixed_elimination_is_active"`
	Script                   string    `json:"script"`
	Groups                   []*Group  `json:"groups" gorm:"constraint:OnDelete:CASCADE;"`
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

func GetAllCompetition() ([]Competition, error) {
	var comps []Competition
	err := DB.Find(&comps).Error
	return comps, err
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
	return data.GroupsNum
}
func UpdateCompetitionGroupNum(ID int, newGroupNum int) int {
	result := DB.Table("competitions").Where("id = ?", ID).UpdateColumn("groups_num", newGroupNum)
	return int(result.RowsAffected)
}

func GetCompetitionLaneNum(ID int) int {
	var data Competition
	DB.Table("competitions").Where("id = ?", ID).First(&data)
	return data.LanesNum
}
func UpdateCompetitionFirstLaneId(ID int, newFirstLaneId int) bool {
	result := DB.Model(&Competition{}).Where("id = ?", ID).UpdateColumn("first_lane_id", newFirstLaneId)
	isChanged := result.RowsAffected != 0
	return isChanged
}

func GetCompetitionNoTypeGroupId(ID int) int {
	var data Competition
	DB.Table("competitions").Where("id = ?", ID).First(&data)
	return data.NoTypeGroupId
}

func UpdateCompetitionNoTypeGroupId(ID int, newNoTypeGroupId int) bool {
	result := DB.Model(&Competition{}).Where("id = ?", ID).UpdateColumn("no_type_group_id", newNoTypeGroupId)
	isChanged := result.RowsAffected != 0
	return isChanged
}

func UpdateCompetitionCurrentPhasePlus(ID uint) error {
	result := DB.Model(&Competition{}).Where("id = ?", ID).UpdateColumn("current_phase", gorm.Expr("current_phase + ?", 1))
	return result.Error
}
func UpdateCompetitionCurrentPhaseMinus(ID uint) error {
	result := DB.Model(&Competition{}).Where("id = ?", ID).UpdateColumn("current_phase", gorm.Expr("current_phase - ?", 1))
	return result.Error
}
func UpdateCompetitionQualificationCurrentEndPlus(ID uint) error {
	result := DB.Model(&Competition{}).Where("id = ?", ID).UpdateColumn("qualification_current_end", gorm.Expr("qualification_current_end + ?", 1))
	return result.Error
}
func UpdateCompetitionQualificationCurrentEndMinus(ID uint) error {
	result := DB.Model(&Competition{}).Where("id = ?", ID).UpdateColumn("qualification_current_end", gorm.Expr("qualification_current_end - ?", 1))
	return result.Error
}

func GetCompetitionGroupIds(competitionId uint, unassignedGroupId uint) ([]uint, error) {
	var groupIds []uint
	result := DB.
		Table("groups").
		Where("competition_id = ? AND id != ?", competitionId, unassignedGroupId).
		Order("group_index asc").
		Pluck("id", &groupIds)
	return groupIds, result.Error
}

func UpdateCompetitionQualificationActive(ID uint) (bool, error) {
	result := DB.
		Model(&Competition{}).
		Where("id = ?", ID).
		UpdateColumn("qualification_is_active", true)
	isChanged := result.RowsAffected != 0
	return isChanged, result.Error
}
func UpdateCompetitionEliminationActive(ID uint) (bool, error) {
	result := DB.
		Model(&Competition{}).
		Where("id = ?", ID).
		UpdateColumn("elimination_is_active", true)
	isChanged := result.RowsAffected != 0
	return isChanged, result.Error
}
func UpdateCompetitionTeamEliminationActive(ID uint) (bool, error) {
	result := DB.
		Model(&Competition{}).
		Where("id = ?", ID).
		UpdateColumn("team_elimination_is_active", true)
	isChanged := result.RowsAffected != 0
	return isChanged, result.Error
}
func UpdateCompetitionMixedEliminationActive(ID uint) (bool, error) {
	result := DB.
		Model(&Competition{}).
		Where("id = ?", ID).
		UpdateColumn("mixed_elimination_is_active", true)
	isChanged := result.RowsAffected != 0
	return isChanged, result.Error
}
