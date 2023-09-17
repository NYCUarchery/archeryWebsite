package database

import (
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type LaneData struct { // DB : lane_data
	ID        int          `json:"-"         gorm:"primary_key"`
	LaneNum   uint         `json:"lane_num"`
	UserIds   []*LaneUser  `json:"user_ids" `
	UserNames Array        `json:"user_names"`
	ScoreNum  uint         `json:"score_num"`
	StageNum  uint         `json:"stage_num"`
	Stages    []*LaneStage `json:"stages"`
}
type LaneUser struct {
	ID         int    `json:"-"            gorm:"primary_key"`
	LaneDataID int    `json:"-"`
	UserIndex  int    `json:"-"`
	UserId     int    `json:"user_id"`
}
type LaneStage struct { // DB : land_stage
	ID            int             `json:"-"            gorm:"primary_key"`
	LaneDataID    int             `json:"-"`
	Status        string          `json:"status"`
	StageIndex    int             `json:"-"`
	EndScores     []*EndScore     `json:"all_scores"`
	Totals        []*TotalScore   `json:"totals"`
	Confirmations []*Confirmation `json:"is_confirmed"`
}
type TotalScore struct { // DB : total_score
	ID          int `json:"-"`
	LaneStageID int `json:"-"`
	UserIndex   int `json:"-"`
	Score       int `json:"score"`
}
type Confirmation struct { // DB : confirmations
	ID          int  `json:"-"`
	LaneStageID int  `json:"-"`
	UserIndex   int  `json:"-"`
	Confirm     bool `json:"confirm"`
}
type EndScore struct {
	ID 		int `json:"-"`
	LaneStageID  int `json:"-"`
	UserIndex int `json:"-"`
	AllScores []*AllScore `json:"player"`
}
type AllScore struct { // DB: all_score
	ID          int `json:"-"`
	EndScoreID int `json:"-"`
	ArrowIndex  int `json:"-"`
	Score       int `json:"score"`
}

func InitLaneInfo() {
	DB.AutoMigrate(&LaneData{})
	DB.AutoMigrate(&LaneUser{})

	DB.AutoMigrate(&LaneStage{})
	DB.AutoMigrate(&TotalScore{})
	DB.AutoMigrate(&Confirmation{})

	DB.AutoMigrate(&AllScore{})
	DB.AutoMigrate(&EndScore{})
}

func GetLaneInfoByID(ID int) LaneData {
	var data LaneData
	DB.Preload(clause.Associations).
		Preload("Stages."+clause.Associations).
		Preload("UserIds", func(*gorm.DB) *gorm.DB { return DB.Order("user_index asc") }).
		Preload("Stages", func(*gorm.DB) *gorm.DB {
			return DB.Order("stage_index asc").
			Preload("EndScores", func(*gorm.DB) *gorm.DB { 
				return DB.Order("user_index asc").
				Preload("AllScores", func(*gorm.DB) *gorm.DB { return DB.Order("arrow_index asc") })
			}).
			Preload("Totals", func(*gorm.DB) *gorm.DB { return DB.Order("user_index asc") }).
			Preload("Confirmations", func(*gorm.DB) *gorm.DB { return DB.Order("user_index asc") })
		}).
		Model(&LaneData{}).
		Where("id =?", ID).
		First(&data)
	return data
}

// create complete data
func PostLaneInfo(data LaneData) LaneData {
	DB.Model(&LaneData{}).Create(&data)
	// function read the position of user_id to write user_index in data
	return data
}

// edit whole data
func UpdateLaneInfo(ID int, data LaneData) LaneData {
	DB.Model(&LaneData{}).Where("id =?", ID).Updates(&data)
	return data
}

// edit score
func UpdataLaneScore(ID int, stageindex int, userindex int, arrowindex int, score int, allscore int) LaneData {
	DB.Model(&AllScore{}).Where("lane_data_id=? AND stage_index=? AND user_index=? AND arrow_index=?", ID, stageindex, userindex, arrowindex).Update("score", score)

	var retrievedLaneData LaneData
	DB.Preload("Stages."+clause.Associations).Preload(clause.Associations).Model(&LaneData{}).Where("id =?", ID).First(&retrievedLaneData)
	return retrievedLaneData
}

/*
// edit comfirmation

	func UpdataLaneConfirm(ID int, who int, confirmation bool) LaneData {
		var retrievedLaneData LaneData
		DB.Model(&LaneData{}).Where("id =?", ID).First(&retrievedLaneData)
		retrievedLaneData.Stages[0].Confirmations[who] = confirmation
		DB.Model(&LaneData{}).Where("id =?", ID).Save(&retrievedLaneData)
		return retrievedLaneData
	}

func DeleteLaneInfoByID(ID int) bool {
	result := DB.Delete(&LaneData{}, "id =?", ID)
	return result.RowsAffected != 0
}
*/
