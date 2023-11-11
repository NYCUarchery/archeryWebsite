package database

type MatchResult struct {
	//PlayerSetId uint `json:"player_set_id"`
	ID            uint `json:"id"        gorm:"primary_key"`
	Match_id      uint `json:"match_id"`
	TotalPoints   uint `json:"total_points"`
	ShootOffScore uint `json:"shoot_off_score"`
	IsWinner      bool `json:"is_winner"`
}

func InitMatchResult() {
	DB.AutoMigrate(&MatchResult{})
}
