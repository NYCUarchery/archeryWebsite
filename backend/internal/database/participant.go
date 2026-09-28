package database

import (
	. "backend/internal/pkg"
	"log"
)

type Participant struct {
	ID            uint   `gorm:"primaryKey;autoIncrement" json:"id"`
	UserID        uint   `gorm:"not null" json:"userID"`
	CompetitionID uint   `gorm:"not null" json:"competitionID"`
	Role          string `gorm:"not null" json:"role"`
	Status        string `gorm:"not null" json:"status"`
}

func DropParticipant() {
	if DB.Migrator().HasTable(&Participant{}) {
		if err := DB.Migrator().DropTable(&Participant{}); err != nil {
			log.Println("Failed to drop Participant:", err)
			return
		}
	}
}

/*JSON*/
func AddParticipant(par *Participant) {
	DB.Create(par)
}

func CheckParticipantExist(userID uint, compID uint) bool {
	var par Participant
	err := DB.Table("participants").
		Select("participants.*").
		Joins("JOIN competitions ON competitions.id = participants.competition_id").
		Where("participants.user_id = ? AND participants.competition_id = ? AND competitions.deleted_at IS NULL", userID, compID).
		First(&par).Error
	return err == nil
}

func CompetitionParticipants(compID uint) (pars []Participant, err error) {
	result := DB.Table("participants").
		Select("participants.*").
		Joins("JOIN competitions ON competitions.id = participants.competition_id").
		Where("participants.competition_id = ? AND competitions.deleted_at IS NULL", compID).
		Find(&pars)

	if result.Error != nil {
		err = result.Error
		return
	}
	return
}

/*mushroom*/
func GetParticipantIsExist(id uint) bool {
	var data Participant
	DB.Table("participants").
		Select("participants.*").
		Joins("JOIN competitions ON competitions.id = participants.competition_id").
		Where("participants.id = ? AND competitions.deleted_at IS NULL", id).
		First(&data)
	return data.ID != 0
}

func GetParticipant(ID uint) (Participant, error) {
	var data Participant
	result := DB.Table("participants").
		Select("participants.*").
		Joins("JOIN competitions ON competitions.id = participants.competition_id").
		Where("participants.id = ? AND competitions.deleted_at IS NULL", ID).
		First(&data)
	return data, result.Error
}

func GetParticipantByUserId(userID uint) (pars []Participant, err error) {
	result := DB.Table("participants").
		Select("participants.*").
		Joins("JOIN competitions ON competitions.id = participants.competition_id").
		Where("participants.user_id = ? AND competitions.deleted_at IS NULL", userID).
		Find(&pars)
	return pars, result.Error
}

func GetParticipantByCompetitionId(compID uint) (pars []Participant, err error) {
	result := DB.Table("participants").
		Select("participants.*").
		Joins("JOIN competitions ON competitions.id = participants.competition_id").
		Where("participants.competition_id = ? AND competitions.deleted_at IS NULL", compID).
		Find(&pars)
	return pars, result.Error
}

func GetParticipantByCompetitionIdUserId(compID uint, userID uint) (pars []Participant, err error) {
	result := DB.Table("participants").
		Select("participants.*").
		Joins("JOIN competitions ON competitions.id = participants.competition_id").
		Where("participants.competition_id = ? AND participants.user_id = ? AND competitions.deleted_at IS NULL", compID, userID).
		Find(&pars)
	return pars, result.Error
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

func UpdateParticipantRole(ID uint, role Role) error {
	result := DB.Model(&Participant{}).Where("id = ?", ID).Update("role", role)
	return result.Error
}

func DeleteParticipant(ID uint) (bool, error) {
	result := DB.Delete(&Participant{}, "id =?", ID)
	isChanged := result.RowsAffected != 0
	return isChanged, result.Error
}
