package database

type Lane struct {
	ID              uint `json:"id"`
	CompetitionId   uint `json:"competition"`
	QualificationId uint `json:"qualification"`
	PlayerNum       int  `json:"player_num"`
	Index           int  `json:"index"`
}

func InitLane() {
	DB.AutoMigrate(&Lane{})
}

func GetLaneIsExist(id int) bool {
	var lane Lane
	DB.Table("lane").Where("id = ?", id).First(&lane)
	return lane.ID != 0
}

func GetLaneById(id int) (Lane, error) {
	var lane Lane
	result := DB.Table("lane").Where("id = ?", id).First(&lane)
	return lane, result.Error
}

func GetFirstLaneId(competitionId int) int {
	var data Lane
	DB.Table("lanes").Where("competition_id = ?", competitionId).First(&data)
	return int(data.ID)
}

func GetAllLaneByCompetitionId(competitionId int) ([]Lane, error) {
	var data []Lane
	result := DB.Table("lanes").Where("competition_id = ?", competitionId).Order("index asc").Find(&data)
	return data, result.Error
}

func PostLane(lane Lane) (Lane, error) {
	result := DB.Model(&Lane{}).Create(&lane)
	return lane, result.Error
}

func UpdateLane(id int, lane Lane) (bool, error) {
	result := DB.Model(&Lane{}).Where("id = ?", id).Updates(&lane)
	return true, result.Error
}

func DeleteLane(id int) (bool, error) {
	result := DB.Delete(&Lane{}, "id =?", id)
	return true, result.Error
}
