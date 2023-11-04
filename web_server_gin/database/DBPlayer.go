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
	Order         int      `json:"order" gorm:"column:order_number"`
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
	IsConfirmed bool          `json:"is_confirmed"`
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

func GetRoundScoreIsExist(id uint) bool {
	var data RoundScore
	DB.Table("round_scores").Where("id = ?", id).First(&data)
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

func GetPlayerScoreByRoundScoreId(id uint) (int, error) {
	var data RoundScore
	result := DB.Table("round_scores").Where("id = ?", id).First(&data)
	return data.Score, result.Error
}

func GetPlayerTotalScoreByPlayerId(playerId uint) (int, error) {
	var data Player
	result := DB.Table("players").Where("id = ?", playerId).First(&data)
	return data.TotalScore, result.Error
}

func GetPlayerRoundTotalScoreByRoundId(roundId uint) (int, error) {
	var data Round
	result := DB.Table("rounds").Where("id = ?", roundId).First(&data)
	return data.TotalScore, result.Error
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

func UpdatePlayerGroupId(playerId uint, groupId uint) error {
	result := DB.Table("players").Where("id = ?", playerId).Update("group_id", groupId)
	return result.Error
}

func UpdatePlayerLaneId(playerId uint, laneId uint) error {
	result := DB.Table("players").Where("id = ?", playerId).Update("lane_id", laneId)
	return result.Error
}

func UpdatePlayerOrder(playerId uint, order int) error {
	result := DB.Table("players").Where("id = ?", playerId).Update("order_number", order)
	return result.Error
}

func UpdatePlayerIsConfirmed(roundEndId uint, isConfirmed bool) error {
	result := DB.Table("round_ends").Where("id = ?", roundEndId).Update("is_confirmed", isConfirmed)
	return result.Error
}

func UpdatePlayerScore(roundScoreId uint, score int) error {
	result := DB.Table("round_scores").Where("id = ?", roundScoreId).Update("score", score)
	return result.Error
}

func UpdatePlayerShootoffScore(playerId uint, shootoffScore int) error {
	result := DB.Table("players").Where("id = ?", playerId).Update("shoot_off_score", shootoffScore)
	return result.Error
}

func UpdatePlayerTotalScore(playerId uint, totalScore int) error {
	result := DB.Table("players").Where("id = ?", playerId).Update("total_score", totalScore)
	return result.Error
}

func UpdatePlayerRoundTotalScore(roundId uint, totalScore int) error {
	result := DB.Table("rounds").Where("id = ?", roundId).Update("total_score", totalScore)
	return result.Error
}

func DeletePlayer(id uint) (bool, error) {
	result := DB.Table("players").Where("id = ?", id).Delete(&Player{})
	isChanged := result.RowsAffected != 0
	return isChanged, result.Error
}
