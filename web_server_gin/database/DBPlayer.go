package database

type Player struct {
	ID            uint   `json:"id"           gorm:"primary_key"`
	GroupId       uint   `json:"group_id"`
	LaneId        uint   `json:"lane_id"`
	ParticipantId uint   `json:"participant_id"`
	Name          string `json:"name"`
	TotalScore    int    `json:"total_score"`
	ShootOffScore int    `json:"shoot_off_score"`
	Rank          int    `json:"rank"`
	Order         int    `json:"order"`
}

// terms reference : https://hackmd.io/@cT-ZX_mHQ4utYON6GCLQEA/BJPfmNPza

func InitPlayer() {
	DB.AutoMigrate(&Player{})
}

func GetPlayerIsExist(id uint) bool {
	var data Player
	DB.Table("players").Where("id = ?", id).First(&data)
	return data.ID != 0
}

func GetOnlyPlayer(id uint) (Player, error) {
	var data Player
	result := DB.Table("players").Where("id = ?", id).First(&data)
	return data, result.Error
}

/*yet to be completed*/
func GetPlayerWScores(id uint) (Player, error) {
	var data Player
	result := DB.Table("players").Where("id = ?", id).First(&data)
	return data, result.Error
}

func CreatePlayer(data Player) (Player, error) {
	result := DB.Table("players").Create(&data)
	return data, result.Error
}

func UpdatePlayer(id uint, data Player) (Player, error) {
	result := DB.Table("players").Where("id = ?", id).Updates(data)
	return data, result.Error
}

func DeletePlayer(id uint) error {
	result := DB.Table("players").Where("id = ?", id).Delete(&Player{})
	return result.Error
}
