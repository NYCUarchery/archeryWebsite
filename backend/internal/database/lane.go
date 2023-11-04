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

func GetLaneIsExist(id int) bool {
	var lane Lane
	DB.Model(&Lane{}).Where("id = ?", id).First(&lane)
	return lane.ID != 0
}

func GetLaneById(id int) (Lane, error) {
	var lane Lane
	result := DB.Model(&Lane{}).Where("id = ?", id).First(&lane)
	return lane, result.Error
}

func GetFirstLaneId(competitionId uint) int {
	var data Lane
	DB.Model(&Lane{}).Where("competition_id = ?", competitionId).First(&data)
	return int(data.ID)
}

func GetAllLaneByCompetitionId(competitionId int) ([]Lane, error) {
	var data []Lane
	result := DB.Model(&Lane{}).Where("competition_id = ?", competitionId).Order("`lane_number` asc").Find(&data)
	return data, result.Error
}

func GetLaneQualificationId(firstLaneId int, start int, end int) []int {
	var data []int
	DB.Model(&Lane{}).Where("id >= ? AND id <= ?", firstLaneId+start-1, firstLaneId+end-1).Pluck("qualification_id", &data)
	return data
}

func PostLane(lane Lane) (Lane, error) {
	result := DB.Model(&Lane{}).Create(&lane)
	return lane, result.Error
}

func UpdateLane(id int, lane Lane) (bool, error) {
	result := DB.Model(&Lane{}).Where("id = ?", id).Updates(&lane)
	return true, result.Error
}

func UpdateLaneQualificationId(id int, qualificationId int) error {
	result := DB.Model(&Lane{}).Where("id = ?", id).Update("qualification_id", qualificationId)
	return result.Error
}

func DeleteLane(competitionId int) error {
	result := DB.Delete(&Lane{}, "competition_id =?", competitionId)
	return result.Error
}
