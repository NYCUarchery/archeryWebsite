package model

func AddCompetition(comp *Competition) {
	DB.Create(comp)
}

func CompetitionInfoByName(name string) (comp *Competition, err error){
	/* 
	if the competition exists, then return the competition info
	else return a competition with user.ID == 0
	*/
	err = DB.Where("name = ?", name).First(&comp).Error
	return
}