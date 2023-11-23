package database

type Institution struct {
	ID 		uint 	`gorm:"primaryKey;autoIncrement" json:"id"`
	Name 	string 	`gorm:"not null" json:"name"`
}

func InitInstitution() {
	DB.AutoMigrate(&Institution{})
}

func AddInstitution(ins *Institution) (err error) {
	err = DB.Create(ins).Error
	return
}

func InstitutionInfoByID(id uint) (ins Institution) {
	DB.Where("id = ?", id).First(&ins)
	return
}

func AllInstitutionInfo() (ins []Institution, err error) {
	err = DB.Find(&ins).Error
	return
}