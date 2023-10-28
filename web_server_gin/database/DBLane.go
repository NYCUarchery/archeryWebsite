package database

type Lane struct {
	ID              uint `json:"id"`
	CompetitionId   uint `json:"competition_id"`
	QualificationId uint `json:"qualification_id"`
	PlayerNum       int  `json:"player_num"`
	LaneNumber      int  `json:"lane_number"`
}

func InitLane() {
	DB.AutoMigrate(&Lane{})
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

func GetNoTypeLaneId(competitionId uint) uint {
	var data Lane
	DB.Model(&Lane{}).Where("competition_id = ?", competitionId).First(&data)
	return data.ID
}

func GetAllLaneByCompetitionId(competitionId uint) ([]Lane, error) {
	var data []Lane
	result := DB.Model(&Lane{}).Where("competition_id = ?", competitionId).Order("`lane_number` asc").Find(&data)
	return data, result.Error
}

func GetLaneQualificationId(NoTypeLaneId uint, start int, end int) []uint {
	var data []uint
	DB.Model(&Lane{}).Where("id >= ? AND id <= ?", NoTypeLaneId+uint(start), NoTypeLaneId+uint(end)).Pluck("qualification_id", &data)
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
