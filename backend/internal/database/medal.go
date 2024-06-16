package database

import "log"

type Medal struct {
	ID            uint `gorm:"primaryKey;autoIncrement" json:"id"`
	EliminationId uint `gorm:"not null" json:"elimination_id"`
	Type          int  `gorm:"not null" json:"type"`
	PlayerSetId   uint `gorm:"not null" json:"player_set_id"`
}

func InitMedal() {
	DB.AutoMigrate(&Medal{})
}

func DropMedal() {
	if DB.Migrator().HasTable(&Medal{}) {
		if err := DB.Migrator().DropTable(&Medal{}); err != nil {
			log.Println("Failed to drop Medal:", err)
			return
		}
	}
}

func GetMedalIsExist(id uint) bool {
	var data Medal
	DB.Table("medals").Where("id = ?", id).First(&data)
	return data.ID != 0
}

func GetMedalById(id uint) (Medal, error) {
	var data Medal
	result := DB.Table("medals").Where("id = ?", id).First(&data)
	return data, result.Error
}

/*should be showed with player set information */
func GetMedalInfoByEliminationId(id uint) ([]Medal, error) {
	var data []Medal
	result := DB.
		Model(&Medal{}).
		Where("elimination_id = ?", id).
		Order("type asc").
		Find(&data)
	return data, result.Error
}

func CreateMedal(data Medal) (Medal, error) {
	result := DB.Table("medals").Create(&data)
	return data, result.Error
}

func UpdateMedalPlayerSetId(id uint, playerSetId uint) error {
	result := DB.Table("medals").Where("id = ?", id).Update("player_set_id", playerSetId)
	return result.Error
}
