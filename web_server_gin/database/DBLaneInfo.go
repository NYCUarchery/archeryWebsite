package database

import (
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type LaneData struct { // DB : lane_data
	ID        uint         `json:"-"         gorm:"primary_key"`
	LaneNum   uint         `json:"lane_num"`
	UserIds   []*LaneUser  `json:"user_ids"  gorm:"constraint:ondelete:CASCADE;"`
	UserNames Array        `json:"user_names"`
	ScoreNum  uint         `json:"score_num"`
	StageNum  uint         `json:"stage_num"`
	Stages    []*LaneStage `json:"stages"   gorm:"constraint:ondelete:CASCADE;"`
}
type LaneUser struct {
	ID         uint `json:"-"            gorm:"primary_key"`
	LaneDataID uint `json:"-"`
	UserIndex  uint `json:"-"`
	UserId     uint `json:"user_id"`
}
type LaneStage struct { // DB : land_stage
	ID            uint            `json:"-"            gorm:"primary_key"`
	LaneDataID    uint            `json:"-"`
	Status        string          `json:"status"`
	StageIndex    uint            `json:"-"`
	EndScores     []*EndScore     `json:"all_scores" gorm:"constraint:ondelete:CASCADE;"`
	Confirmations []*Confirmation `json:"is_confirmed" gorm:"constraint:ondelete:CASCADE;"`
}

type Confirmation struct { // DB : confirmations
	ID          uint `json:"-"`
	LaneStageID uint `json:"-"`
	UserIndex   uint `json:"-"`
	Confirm     bool `json:"confirm"`
}
type EndScore struct {
	ID          uint        `json:"-"`
	LaneStageID uint        `json:"-"`
	UserIndex   uint        `json:"-"`
	AllScores   []*AllScore `json:"player" gorm:"constraint:ondelete:CASCADE;"`
}
type AllScore struct { // DB: all_score
	ID         uint `json:"-"`
	EndScoreID uint `json:"-"`
	ArrowIndex uint `json:"-"`
	Score      int  `json:"score"`
}

func InitLaneInfo() {
	DB.AutoMigrate(&LaneData{})
	DB.AutoMigrate(&LaneUser{})

	DB.AutoMigrate(&LaneStage{})
	DB.AutoMigrate(&Confirmation{})

	DB.AutoMigrate(&AllScore{})
	DB.AutoMigrate(&EndScore{})
}

func preloadLane(ID int, data *LaneData) *LaneData {
	DB.Preload(clause.Associations).
		Preload("Stages."+clause.Associations).
		Preload("UserIds", func(*gorm.DB) *gorm.DB { return DB.Order("user_index asc") }).
		Preload("Stages", func(*gorm.DB) *gorm.DB {
			return DB.Order("stage_index asc").
				Preload("EndScores", func(*gorm.DB) *gorm.DB {
					return DB.Order("user_index asc").
						Preload("AllScores", func(*gorm.DB) *gorm.DB { return DB.Order("arrow_index asc") })
				}).
				Preload("Confirmations", func(*gorm.DB) *gorm.DB { return DB.Order("user_index asc") })
		}).
		Model(&LaneData{}).
		Where("id =?", ID).
		First(data)
	return data
}

// Get LaneInfo By ID godoc
// @Summary Show one LaneInfo
// @Description Get one LaneInfo by id
// @Tags LaneInfo
// @Produce json
// @Param id path int true "LaneInfo ID"
// @Success 200 string string
// @Failure 400 string string
// @Router /data/laneinfo/{id} [get]
func GetLaneInfoByID(ID int) LaneData {
	var data LaneData
	preloadLane(ID, &data)
	return data
}

// Post LaneInfo godoc
// @Summary Create one LaneInfo
// @Description Post one new LaneInfo data with new id, and return the new LaneInfo data
// @Tags LaneInfo
// @Accept json
// @Produce json
// @Param LaneData body string true "LaneData"
// @Success 200 string string
// @Failure 400 string string
// @Router /data/laneinfo [post]
func PostLaneInfo(data LaneData) LaneData {
	DB.Model(&LaneData{}).Create(&data)
	// function read the position of user_id to write user_index in data
	return data
}

// Update LaneInfo godoc
// @Summary Put one LaneInfo
// @Description Put whole new LaneInfo and overwrite with the id
// @Tags LaneInfo
// @Accept json
// @Produce json
// @Param id path string true "LaneInfo ID"
// @Param LaneData body string true "LaneData"
// @Success 200 string string
// @Failure 400 string string
// @Failure 404 string string
// @Router /data/laneinfo/whole/{id} [put]
func UpdateLaneInfo(ID int, data LaneData) LaneData {
	DB.Model(&LaneData{}).Where("id =?", ID).Updates(&data)
	return data
}

func UpdataLaneScore(ID int, stageindex int, userindex int, arrowindex int, score int) bool {
	sql := "UPDATE `Demo`.all_scores INNER JOIN `Demo`.end_scores ON `Demo`.all_scores.end_score_id = `Demo`.end_scores.id INNER JOIN `Demo`.lane_stages ON `Demo`.end_scores.lane_stage_id = `Demo`.lane_stages.id INNER JOIN `Demo`.lane_data ON `Demo`.lane_stages.lane_data_id = `Demo`.lane_data.id SET `Demo`.all_scores.score = ? WHERE `Demo`.lane_data.id = ? AND `Demo`.lane_stages.stage_index = ? AND `Demo`.end_scores.user_index = ? AND `Demo`.all_scores.arrow_index = ? ;"
	result := DB.Exec(sql, score, ID, stageindex, userindex, arrowindex)

	return result.Error == nil
}

// edit comfirmation
func UpdataLaneConfirm(ID int, stageindex int, userindex int, confirmation bool) bool {
	sql := "UPDATE `Demo`.confirmations INNER JOIN `Demo`.lane_stages ON `Demo`.confirmations.lane_stage_id = `Demo`.lane_stages.id INNER JOIN `Demo`.lane_data ON `Demo`.lane_stages.lane_data_id = `Demo`.lane_data.id SET `Demo`.confirmations.confirm = ? WHERE `Demo`.lane_data.id = ? AND `Demo`.lane_stages.stage_index = ? AND `Demo`.confirmations.user_index = ?;"
	result := DB.Exec(sql, confirmation, ID, stageindex, userindex)
	return result.Error == nil
}

func DeleteLaneInfoByID(ID int) bool {
	result := DB.Delete(&LaneData{}, "id =?", ID)
	return result.RowsAffected != 0
}
