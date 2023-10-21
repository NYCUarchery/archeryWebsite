package database

type Qualification struct {
	ID           uint `json:"id"        gorm:"primary_key"`
	GroupId      uint `json:"group_id"`
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

// Get Qualification By ID godoc
//
//	@Summary		Show one Qualification
//	@Description	Get one Qualification by id
//	@Tags			Qualification
//	@Produce		json
//	@Param			id	path	int	true	"Qualification ID"
//	@Success		200	string	string
//	@Failure		400	string	string
//	@Router			/data/qualification/{id} [get]
func GetQualification(ID int) (Qualification, error) {
	var data Qualification
	result := DB.Table("qualifications").Where("id = ?", ID).First(&data)
	return data, result.Error
}

// Post Qualification godoc
//
//	@Summary		Create one Qualification
//	@Description	Post one new Qualification data with new id, and return the new Qualification data
//	@Tags			Qualification
//	@Accept			json
//	@Produce		json
//	@Param			Qualification	body	string	true	"Qualification"
//	@Success		200			string	string
//	@Failure		400			string	string
//	@Router			/data/qualification [post]
func PostQualification(data Qualification) (Qualification, error) {
	result := DB.Model(&Qualification{}).Create(&data)
	return data, result.Error
}

// Update Qualification godoc
//
//	@Summary		Update one Qualification
//	@Description	Update one Qualification data by id, and return the new Qualification data
//	@Tags			Qualification
//	@Accept			json
//	@Produce		json
//	@Param			id	path	int	true	"Qualification ID"
//	@Param			Qualification	body	string	true	"Qualification"
//	@Success		200			string	string
//	@Failure		400			string	string
//	@Router			/data/qualification/{id} [put]
func UpdateQualification(id int, data Qualification) (bool, error) {
	result := DB.Model(&Qualification{}).Updates(&data)
	return true, result.Error
}

// Delete Qualification godoc
//
//	@Summary		Delete one Qualification
//	@Description	Delete one Qualification data by id
//	@Tags			Qualification
//	@Produce		json
//	@Param			id	path	int	true	"Qualification ID"
//	@Success		200			string	string
//	@Failure		400			string	string
//	@Router			/data/qualification/{id} [delete]
func DeleteQualification(id int) (bool, error) {
	result := DB.Delete(&Qualification{}, "id =?", id)
	return true, result.Error
}
