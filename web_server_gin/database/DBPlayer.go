package database

// terms reference : https://hackmd.io/@cT-ZX_mHQ4utYON6GCLQEA/BJPfmNPza
type Player struct {
	ID            uint     `json:"id"           gorm:"primary_key"`
	GroupId       uint     `json:"group_id"`
	LaneId        uint     `json:"lane_id"`
	ParticipantId uint     `json:"participant_id"`
	Name          string   `json:"name"`
	TotalScore    int      `json:"total_score"`
	ShootOffScore int      `json:"shoot_off_score"`
	Rank          int      `json:"rank"`
	Order         int      `json:"order"`
	Rounds        []*Round `json:"rounds" gorm:"constraint:OnDelete:CASCADE;"`
}

type Round struct {
	ID         uint        `json:"id"           gorm:"primary_key"`
	PlayerId   uint        `json:"player_id"`
	TotalScore int         `json:"total_score"`
	RoundEnds  []*RoundEnd `json:"round_ends" gorm:"constraint:OnDelete:CASCADE;"`
}

type RoundEnd struct {
	ID          uint          `json:"id"           gorm:"primary_key"`
	RoundId     uint          `json:"round_id"`
	IsComfirmed bool          `json:"is_comfirmed"`
	RoundScores []*RoundScore `json:"round_scores" gorm:"constraint:OnDelete:CASCADE;"`
}

type RoundScore struct {
	ID         uint `json:"id"           gorm:"primary_key"`
	RoundEndId uint `json:"round_end_id"`
	Score      int  `json:"score"`
}

func InitPlayer() {
	DB.AutoMigrate(&Player{})
	DB.AutoMigrate(&Round{})
	DB.AutoMigrate(&RoundEnd{})
	DB.AutoMigrate(&RoundScore{})
}

func GetPlayerIsExist(id uint) bool {
	var data Player
	DB.Table("players").Where("id = ?", id).First(&data)
	return data.ID != 0
}

func GetRoundIsExist(id uint) bool {
	var data Round
	DB.Table("rounds").Where("id = ?", id).First(&data)
	return data.ID != 0
}

func GetRoundEndIsExist(id uint) bool {
	var data RoundEnd
	DB.Table("round_ends").Where("id = ?", id).First(&data)
	return data.ID != 0
}

func GetOnlyPlayer(id uint) (Player, error) {
	var data Player
	result := DB.Table("players").Where("id = ?", id).First(&data)
	return data, result.Error
}

func GetPlayerWScores(id uint) (Player, error) {
	var data Player
	result := DB.
		Preload("Rounds.RoundEnds.RoundScores").
		Model(&Player{}).
		Where("id = ?", id).
		First(&data)
	return data, result.Error
}

func CreatePlayer(data Player) (Player, error) {
	result := DB.Table("players").Create(&data)
	return data, result.Error
}
func CreateRound(data Round) (Round, error) {
	result := DB.Table("rounds").Create(&data)
	return data, result.Error
}
func CreateRoundEnd(data RoundEnd) (RoundEnd, error) {
	result := DB.Table("round_ends").Create(&data)
	return data, result.Error
}
func CreateRoundScore(data RoundScore) (RoundScore, error) {
	result := DB.Table("round_scores").Create(&data)
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
