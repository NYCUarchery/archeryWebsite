package database

type Qualification struct {
	ID           uint `json:"id"        gorm:"primary_key"`
	PlayerNum    int  `json:"player_num"`
	AdvancingNum int  `json:"advancing_num"`
}

func InitQualification() {
	DB.AutoMigrate(&Qualification{})
}

func GetQualificationIsExist(id int) bool {
	var data Qualification
	DB.Table("qualifications").Where("id = ?", id).First(&data)
	return data.ID != 0
}

func GetQualification(ID int) (Qualification, error) {
	var data Qualification
	result := DB.Table("qualifications").Where("id = ?", ID).First(&data)
	return data, result.Error
}

func PostQualification(data Qualification) (Qualification, error) {
	result := DB.Model(&Qualification{}).Create(&data)
	return data, result.Error
}

func UpdateQualification(id int, data Qualification) (bool, error) {
	result := DB.Model(&Qualification{}).Updates(&data)
	return true, result.Error
}

func DeleteQualification(id int) (bool, error) {
	result := DB.Delete(&Qualification{}, "id =?", id)
	return true, result.Error
}
