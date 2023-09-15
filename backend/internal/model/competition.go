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

func ParticipantInfoBy2ID(userID uint, compID uint) (par *Participant, err error){
	err = DB.Where("user_id = ? AND competition_id = ?", userID, compID).First(&par).Error
	return
}

func AddCompCategory(cat *CompetitionCategory) (err error) {
	err = DB.Create(cat).Error
	return
}