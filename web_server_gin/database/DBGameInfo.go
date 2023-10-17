package database

import "gorm.io/gorm"

type GameInfo struct { // DB : game_info
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

func InitGameInfo() {
	DB.Table("competitions").AutoMigrate(&GameInfo{})
}

// Get Only GameInfo By ID godoc
//
//	@Summary		Show one GameInfo without GroupInfo
//	@Description	Get one GameInfo by id without GroupInfo
//	@Tags			GameInfo
//	@Produce		json
//	@Param			id	path	int	true	"GameInfo ID"
//	@Success		200	string	string
//	@Failure		400	string	string
//	@Router			/data/gameinfo/{id} [get]
func GetOnlyGameInfo(ID int) (GameInfo, error) {
	var data GameInfo
	error := DB.Table("competitions").Where("id = ?", ID).First(&data).Error
	return data, error
}

// Get One GameInfo By ID with Groups godoc
//
//	@Summary		Show one GameInfo with GroupInfos
//	@Description	Get one GameInfo by id with GroupInfos
//	@Tags			GameInfo
//	@Produce		json
//	@Param			id	path	int	true	"GameInfo ID"
//	@Success		200	string	string
//	@Failure		400	string	string
//	@Router			/data/gameinfo/{id} [get]
func GetGameInfoWGroups(ID int) GameInfo {
	var data GameInfo
	DB.Preload("Groups", func(*gorm.DB) *gorm.DB { return DB.Order("group_index asc") }).
		Table("competitions").Where("id = ?", ID).First(&data)
	return data
}

// Post GameInfo godoc
//
//	@Summary		Create one GameInfo
//	@Description	Post one new GameInfo data with new id, and return the new GameInfo data
//	@Tags			GameInfo
//	@Accept			json
//	@Produce		json
//	@Param			GameInfo	body	string	true	"GameInfo"
//	@Success		200			string	string
//	@Failure		400			string	string
//	@Router			/data/gameinfo [post]
func PostGameInfo(data GameInfo) GameInfo {
	DB.Table("competitions").Create(&data)
	return data
}

// Update GameInfo godoc
//
//	@Summary		update one GameInfo without GroupInfo
//	@Description	Put whole new GameInfo and overwrite with the id but without GroupInfo
//	@Tags			GameInfo
//	@Accept			json
//	@Produce		json
//	@Param			id			path	string	true	"GameInfo ID"
//	@Param			GameInfo	body	string	true	"GameInfo"
//	@Success		200			string	string
//	@Failure		400			string	string
//	@Failure		404			string	string
//	@Failure		500			string	string
//	@Router			/data/gameinfo/whole/{id} [put]
func UpdateGameInfo(ID int, data GameInfo) GameInfo {
	DB.Table("competitions").Where("id = ?", ID).Updates(&data)
	return data
}

// Delete GameInfo by id godoc
//
//	@Summary		delete one GameInfo
//	@Description	delete one GameInfo by id
//	@Tags			GameInfo
//	@Accept			json
//	@Produce		json
//	@Param			id	path	string	true	"GameInfo ID"
//	@Success		200	string	string
//	@Failure		400	string	string
//	@Failure		404	string	string
//	@Router			/data/gameinfo/{id} [delete]
func DeleteGameInfo(ID int) bool {
	result := DB.Table("competitions").Where("id = ?", ID).Delete(&GameInfo{})
	return result.RowsAffected != 0
}

func AddOneGameInfoGroupNum(GameInfoID int) {
	groupNum := GetGameInfoGroupNum(int(GameInfoID))
	UpdateGameInfoGroupNum(int(GameInfoID), groupNum+1)
}
func MinusOneGameInfoGroupNum(GameInfoID int) {
	groupNum := GetGameInfoGroupNum(int(GameInfoID))
	UpdateGameInfoGroupNum(int(GameInfoID), groupNum-1)
}
func GetGameInfoGroupNum(ID int) int {
	var data GameInfo
	DB.Table("competitions").Where("id = ?", ID).First(&data)
	return data.Groups_num
}
func UpdateGameInfoGroupNum(ID int, newGroupNum int) int {
	result := DB.Table("competitions").Where("id = ?", ID).UpdateColumn("groups_num", newGroupNum)
	return int(result.RowsAffected)
}
