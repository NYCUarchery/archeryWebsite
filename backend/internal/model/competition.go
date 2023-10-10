package model

func AddCompetition(comp *Competition) (err error) {
	err = DB.Create(comp).Error
	return
}

func CompetitionInfoByName(name string) (comp Competition){
	/* 
	if the competition exists, then return the competition info
	else return a competition with user.ID == 0
	*/
	DB.Where("name = ?", name).Limit(1).First(&comp)
	return
}

func CompetitionInfoByID(id uint) (comp Competition){
	/* 
	if the competition exists, then return the competition info
	else return a competition with user.ID == 0
	*/
	DB.Where("id = ?", id).Limit(1).First(&comp)
	return
}

func AllCompetitionInfo() (comps []Competition){
	DB.Find(&comps)
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

func AddGroup(gr *Group) (err error) {
	err = DB.Create(gr).Error
	return
}

func CompetitionGroups(compID uint) (groups []Group, err error) {
	result := DB.Where("competition_id = ?", compID).Find(&groups)
	
	if result.Error != nil {
		err = result.Error
		return
	}
	return
}