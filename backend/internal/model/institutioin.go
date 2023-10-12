package model

func AddInstitution(ins *Institution) (err error) {
	err = DB.Create(ins).Error
	return
}

func InstitutionInfoByID(id uint) (ins Institution, err error) {
	err = DB.Where("id = ?", id).First(&ins).Error
	return
}

func AllInstitutionInfo() (ins []Institution, err error) {
	err = DB.Find(&ins).Error
	return
}