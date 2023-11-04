package database

type Participant struct {
	ID 				uint   `gorm:"primaryKey;autoIncrement" json:"id"`
	UserID 			uint   `gorm:"not null" json:"userID"`
	CompetitionID 	uint   `gorm:"not null" json:"competitionID"`
	Role 			string `gorm:"not null" json:"role"`
	Status 			string `gorm:"not null" json:"status"`
}

func AddParticipant(par *Participant) {
	DB.Create(par)
}

func CheckParticipantExist(userID uint, compID uint) bool {
	var par Participant
	err := DB.Where("user_id = ? AND competition_id = ?", userID, compID).First(&par).Error
	return err == nil
}

func CompetitionParticipants(compID uint) (pars []Participant, err error) {
	result := DB.Where("competition_id = ?", compID).Find(&pars)
	
	if result.Error != nil {
		err = result.Error
		return
	}
	return
}