package model

func AddInstitution(ins *Institution) (err error) {
	err = DB.Create(ins).Error
	return
}

func AllInstitutionInfo() (ins []Institution, err error) {
	err = DB.Find(&ins).Error
	return
}