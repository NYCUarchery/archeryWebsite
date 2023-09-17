package model

func AddCompetition(comp *Competition) (err error) {
	err = DB.Create(comp).Error
	return
}

func CompetitionInfoByName(name string) (comp *Competition, err error){
	/* 
	if the competition exists, then return the competition info
	else return a competition with user.ID == 0
	*/
	err = DB.Where("name = ?", name).First(&comp).Error
	return
}

func CompetitionInfoByID(id uint) (comp *Competition, err error){
	/* 
	if the competition exists, then return the competition info
	else return a competition with user.ID == 0
	*/
	err = DB.Where("id = ?", id).First(&comp).Error
	return
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

func AddCompCategory(cat *CompetitionCategory) (err error) {
	err = DB.Create(cat).Error
	return
}

func CompetitionCategories(compID uint) (cats []CompetitionCategory, err error) {
	result := DB.Where("competition_id = ?", compID).Find(&cats)
	
	if result.Error != nil {
		err = result.Error
		return
	}
	return
}