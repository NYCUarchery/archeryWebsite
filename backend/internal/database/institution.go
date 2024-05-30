package database

type Institution struct {
	ID   uint   `gorm:"primaryKey;autoIncrement" json:"id"`
	Name string `gorm:"not null" json:"name"`
}

func InitInstitution() {
	DB.AutoMigrate(&Institution{})
}

func DropInstitution() {
	DB.Table("institutions").Migrator().DropTable(&Institution{})
}

func GetInstitutionIsExist(id uint) bool {
	var institution Institution
	DB.Table("institutions").Where("id = ?", id).First(&institution)
	return institution.ID != 0
}

func GetInstitutionIsExistByName(name string) bool {
	var institution Institution
	DB.Table("institutions").Where("name = ?", name).First(&institution)
	return institution.ID != 0
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

func DeleteInstitutionByID(id uint) (err error) {
	err = DB.Where("id = ?", id).Delete(&Institution{}).Error
	return err
}
