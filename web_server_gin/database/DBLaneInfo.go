package database

import "gorm.io/gorm/clause"

type LaneData struct { // DB : lane_data
	ID        int          `json:"-"         gorm:"primary_key"`
	LaneNum   uint         `json:"lane_num"`
	UserIds   []*LaneUser  `json:"user_ids"`
	UserNames Array        `json:"user_names"`
	ScoreNum  uint         `json:"score_num"`
	StageNum  uint         `json:"stage_num"`
	Stages    []*LaneStage `json:"stages"`
}
type LaneUser struct {
	ID         int    `json:"-"            gorm:"primary_key"`
	LaneDataID int    `json:"-"`
	UserIndex  int    `json:"user_index"`
	UserId     string `json:"user_id"`
}
type LaneStage struct { // DB : land_stage
	ID            int             `json:"-"            gorm:"primary_key"`
	LaneDataID    int             `json:"-"`
	Status        string          `json:"status"`
	AllScores     []*AllScore     `json:"all_scores"`
	Totals        []*TotalScore   `json:"totals"`
	Confirmations []*Confirmation `json:"confirmations"`
}
type AllScore struct { // DB: all_score
	ID          int `json:"-"`
	LaneStageID int `json:"-"`
	UserIndex   int `json:"user_index"`
	ArrowIndex  int `json:"arrow_index"`
	Score       int `json:"score"`
}
type TotalScore struct { // DB : total_score
	ID          int `json:"-"`
	LaneStageID int `json:"-"`
	UserIndex   int `json:"user_index"`
	Score       int `json:"score"`
}
type Confirmation struct { // DB : confirmations
	ID          int  `json:"-"`
	LaneStageID int  `json:"-"`
	UserIndex   int  `json:"user_index"`
	Confirm     bool `json:"confirm"`
}

func InitLaneInfo() {
	DB.AutoMigrate(&LaneData{})
	DB.AutoMigrate(&LaneUser{})

	DB.AutoMigrate(&LaneStage{})
	DB.AutoMigrate(&AllScore{})
	DB.AutoMigrate(&TotalScore{})
	DB.AutoMigrate(&Confirmation{})
}

func GetLaneInfoByID(ID int) LaneData {
	var data LaneData
	DB.Preload("Stages."+clause.Associations).Preload(clause.Associations).Model(&LaneData{}).Where("id =?", ID).First(&data)
	return data
}

// create complete data
func PostLaneInfo(data LaneData) LaneData {
	DB.Model(&LaneData{}).Create(&data)
	return data
}

// edit whole data
func UpdateLaneInfo(ID int, data LaneData) LaneData {
	DB.Model(&LaneData{}).Where("id =?", ID).Save(&data)
	return data
}

/*
// edit score
func UpdataLaneScore(ID int, who int, index int, score int) LaneData {
	var retrievedLaneData LaneData
	DB.Model(&LaneData{}).Where("id =?", ID).First(&retrievedLaneData)
	retrievedLaneData.Stages[0].AllScores[who*6+index] = score
	DB.Model(&LaneData{}).Where("id =?", ID).Save(&retrievedLaneData)
	return retrievedLaneData
}

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
