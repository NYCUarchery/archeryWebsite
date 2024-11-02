package database

import (
	"log"

	"gorm.io/gorm"
)

type Lane struct {
	ID              uint      `json:"id"`
	CompetitionId   uint      `json:"competition_id"`
	QualificationId uint      `json:"qualification_id"`
	LaneNumber      int       `json:"lane_number"`
	Players         []*Player `json:"players"`
}

func InitLane() {
	DB.AutoMigrate(&Lane{})
}

func DropLane() {
	if DB.Migrator().HasTable(&Lane{}) {
		if err := DB.Migrator().DropTable(&Lane{}); err != nil {
			log.Println("Failed to drop Lane:", err)
			return
		}
	}
}

func GetLaneIsExist(id uint) bool {
	var lane Lane
	DB.Model(&Lane{}).Where("id = ?", id).First(&lane)
	return lane.ID != 0
}

func GetLaneById(id uint) (Lane, error) {
	var lane Lane
	result := DB.Model(&Lane{}).Where("id = ?", id).First(&lane)
	return lane, result.Error
}

func GetLaneWScoresById(id uint) (Lane, error) {
	var lane Lane
	result := DB.
		Preload("Players", func(*gorm.DB) *gorm.DB {
			return DB.Order("order_number asc").
				Preload("Rounds", func(*gorm.DB) *gorm.DB {
					return DB.Order("id asc").
						Preload("RoundEnds", func(*gorm.DB) *gorm.DB {
							return DB.Order("id asc").
								Preload("RoundScores")
						})
				})
		}).
		Model(&Lane{}).
		Where("id = ?", id).
		First(&lane)
	return lane, result.Error
}

func GetUnassignedLaneId(competitionId uint) uint {
	var data Lane
	DB.Model(&Lane{}).Where("competition_id = ?", competitionId).First(&data)
	return data.ID
}

func GetAllLanesByCompetitionId(competitionId uint) ([]Lane, error) {
	var data []Lane
	result := DB.Model(&Lane{}).Where("competition_id = ?", competitionId).Order("`lane_number` asc").Find(&data)
	return data, result.Error
}

func GetLaneQualificationId(UnassignedLaneId uint, start int, end int) []uint {
	var data []uint
	DB.Model(&Lane{}).Where("id >= ? AND id <= ?", UnassignedLaneId+uint(start), UnassignedLaneId+uint(end)).Pluck("qualification_id", &data)
	return data
}

func PostLane(lane Lane) (Lane, error) {
	result := DB.Model(&Lane{}).Create(&lane)
	return lane, result.Error
}

func UpdateLane(id uint, lane Lane) (bool, error) {
	result := DB.Model(&Lane{}).Where("id = ?", id).Updates(&lane)
	return true, result.Error
}

func UpdateLaneQualificationId(id uint, qualificationId uint) error {
	result := DB.Model(&Lane{}).Where("id = ?", id).Update("qualification_id", qualificationId)
	return result.Error
}

func DeleteLaneByCompetitionId(competitionId uint) error {
	result := DB.Delete(&Lane{}, "competition_id =?", competitionId)
	return result.Error
}

func GetLanePlayerNum(id uint) (int, error) {
	var data int
	result := DB.Model(&Lane{}).Where("id = ?", id).Pluck("player_num", &data)
	return data, result.Error
}

func UpdateLanePlayerNum(id uint, playerNum int) error {
	result := DB.Model(&Lane{}).Where("id = ?", id).Update("player_num", playerNum)
	return result.Error
}
