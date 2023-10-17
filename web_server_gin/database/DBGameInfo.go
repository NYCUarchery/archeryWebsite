package database

import "gorm.io/gorm"

type Competition struct { // DB : game_info
	ID               uint     `json:"id"        gorm:"primary_key"`
	Title            string   `json:"title"`
	SubTitle         string   `json:"sub_title"`
	HostId           uint     `json:"host_id"`
	Groups_num       int      `json:"groups_num"`
	Lanes_num        int      `json:"lanes_num"`
	CurrentPhase     int      `json:"current_phase"`
	CurrentPhaseKind string   `json:"current_phase_kind"`
	CurrentStage     uint     `json:"current_stage"`
	Script           string   `json:"script"`
	Groups           []*Group `json:"groups" gorm:"constraint:ondelete:CASCADE;"`
}

func InitCompetition() {
	DB.Table("competitions").AutoMigrate(&Competition{})
}

// Get Only Competition By ID godoc
//
//	@Summary		Show one Competition without GroupInfo
//	@Description	Get one Competition by id without GroupInfo
//	@Tags			Competition
//	@Produce		json
//	@Param			id	path	int	true	"Competition ID"
//	@Success		200	string	string
//	@Failure		400	string	string
//	@Router			/data/competition/{id} [get]
func GetOnlyCompetition(ID int) (Competition, error) {
	var data Competition
	error := DB.Table("competitions").Where("id = ?", ID).First(&data).Error
	return data, error
}

// Get One Competition By ID with Groups godoc
//
//	@Summary		Show one Competition with GroupInfos
//	@Description	Get one Competition by id with GroupInfos
//	@Tags			Competition
//	@Produce		json
//	@Param			id	path	int	true	"Competition ID"
//	@Success		200	string	string
//	@Failure		400	string	string
//	@Router			/data/competition/{id} [get]
func GetCompetitionWGroups(ID int) Competition {
	var data Competition
	DB.Preload("Groups", func(*gorm.DB) *gorm.DB { return DB.Order("group_index asc") }).
		Table("competitions").Where("id = ?", ID).First(&data)
	return data
}

// Post Competition godoc
//
//	@Summary		Create one Competition
//	@Description	Post one new Competition data with new id, and return the new Competition data
//	@Tags			Competition
//	@Accept			json
//	@Produce		json
//	@Param			Competition	body	string	true	"Competition"
//	@Success		200			string	string
//	@Failure		400			string	string
//	@Router			/data/competition [post]
func PostCompetition(data Competition) Competition {
	DB.Table("competitions").Create(&data)
	return data
}

// Update Competition godoc
//
//	@Summary		update one Competition without GroupInfo
//	@Description	Put whole new Competition and overwrite with the id but without GroupInfo
//	@Tags			Competition
//	@Accept			json
//	@Produce		json
//	@Param			id			path	string	true	"Competition ID"
//	@Param			Competition	body	string	true	"Competition"
//	@Success		200			string	string
//	@Failure		400			string	string
//	@Failure		404			string	string
//	@Failure		500			string	string
//	@Router			/data/competition/whole/{id} [put]
func UpdateCompetition(ID int, newdata Competition) (Competition, error) {
	var data Competition
	DB.Table("competitions").Where("id = ?", ID).Updates(&newdata)
	error := DB.Table("competitions").Where("id = ?", ID).First(&data).Error
	return data, error
}

// Delete Competition by id godoc
//
//	@Summary		delete one Competition
//	@Description	delete one Competition by id
//	@Tags			Competition
//	@Accept			json
//	@Produce		json
//	@Param			id	path	string	true	"Competition ID"
//	@Success		200	string	string
//	@Failure		400	string	string
//	@Failure		404	string	string
//	@Router			/data/competition/{id} [delete]
func DeleteCompetition(ID int) bool {
	result := DB.Table("competitions").Where("id = ?", ID).Delete(&Competition{})
	return result.RowsAffected != 0
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
