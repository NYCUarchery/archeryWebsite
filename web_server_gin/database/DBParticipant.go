package database

type Participant struct {
	ID            uint   `json:"id" gorm:"primary_key"`
	CompetitionID uint   `json:"competition_id"`
	UserID        uint   `json:"user_id"`
	Status        string `json:"status"`
	Role          string `json:"role"`
}

func InitParticipant() {
	DB.AutoMigrate(&Participant{})
}

func GetParticipantIsExist(id uint) bool {
	var data Participant
	DB.Model(&Participant{}).Where("id = ?", id).First(&data)
	return data.ID != 0
}

func GetParticipant(ID uint) (Participant, error) {
	var data Participant
	result := DB.Model(&Participant{}).Where("id = ?", ID).First(&data)
	return data, result.Error
}

func CreateParticipant(data Participant) (Participant, error) {
	result := DB.Create(&data)
	return data, result.Error
}

func UpdateParticipant(ID uint, newdata Participant) (bool, error) {
	result := DB.Model(&Participant{}).Where("id = ?", ID).Updates(&newdata)
	isChanged := result.RowsAffected != 0
	return isChanged, result.Error
}

func DeleteParticipant(ID uint) (bool, error) {
	result := DB.Delete(&Participant{}, "id =?", ID)
	isChanged := result.RowsAffected != 0
	return isChanged, result.Error
}
