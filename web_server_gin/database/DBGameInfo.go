package database

type GameInfo struct { // DB : game_info
	ID               uint   `json:"-"        gorm:"primary_key"`
	Title            string `json:"title"`
	SubTitle         string `json:"sub_title"`
	Script           string `json:"script"`
	HostId           uint   `json:"host_id"`
	CurrentPhase     string `json:"current_phase"`
	CurrentPhaseKind string `json:"current_phase_kind"`
	CurrentStage     uint   `json:"current_stage"`
}

func InitGameInfo() {
	DB.AutoMigrate(&GameInfo{})
}

// Get GameInfo By ID godoc
//
//	@Summary		Show one GameInfo
//	@Description	Get one GameInfo by id
//	@Tags			GameInfo
//	@Produce		json
//	@Param			id	path	int	true	"GameInfo ID"
//	@Success		200	string	string
//	@Failure		400	string	string
//	@Router			/data/gameinfo/{id} [get]
func GetGameInfo(ID int) GameInfo {
	var data GameInfo
	DB.Model(&GameInfo{}).Where("id = ?", ID).First(&data)
	return data
}

// Post GameInfo godoc
//
//	@Summary		Create one GameInfo
//	@Description	Post one new GameInfo data with new id, and return the new GameInfo data
//	@Tags			GameInfo
//	@Accept			json
//	@Produce		json
//	@Param			GameInfo	body	string	true	"GaeInfo"
//	@Success		200			string	string
//	@Failure		400			string	string
//	@Router			/data/gameinfo [post]
func PostGameInfo(data GameInfo) GameInfo {
	DB.Model(&GameInfo{}).Create(&data)
	return data
}

// Update GameInfo godoc
//
//	@Summary		update one GameInfo
//	@Description	Put whole new GameInfo and overwrite with the id
//	@Tags			GameInfo
//	@Accept			json
//	@Produce		json
//	@Param			id			path	string	true	"GameInfo ID"
//	@Param			GameInfo	body	string	true	"GameInfo"
//	@Success		200			string	string
//	@Failure		400			string	string
//	@Failure		404			string	string
//	@Failure		500			string	string
//	@Router			/data/GameInfo/{id} [put]
func UpdateGameInfo(ID int, data GameInfo) GameInfo {
	DB.Model(&GameInfo{}).Where("id = ?", ID).Updates(&data)
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
//	@Router			/data/GameInfo/{id} [delete]
func DeleteGameInfo(ID int) bool {
	result := DB.Model(&GameInfo{}).Delete(ID)
	return result.RowsAffected != 0
}
