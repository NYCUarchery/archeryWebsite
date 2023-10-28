package database

type Group struct {
	ID            uint   `json:"id" gorm:"primary_key"`
	CompetitionId uint   `json:"competition_id" `
	GroupName     string `json:"group_name"`
	GroupRange    string `json:"group_range"`
	BowType       string `json:"bow_type"`
	GroupIndex    int    `json:"group_index"`
	PlayerNum     int    `json:"player_num"`
}

func InitGroupInfo() {
	DB.Table("groups").AutoMigrate(&Group{})
}

func GetGroupIsExist(id uint) bool {
	var group Group
	DB.Table("groups").Where("id = ?", id).First(&group)
	return group.ID != 0
}

func GetGroupInfoById(id uint) (Group, error) {
	var group Group
	result := DB.Table("groups").Where("id = ?", id).First(&group)
	return group, result.Error
}

func CreateGroupInfo(group Group) (Group, error) {
	result := DB.Table("groups").Create(&group)
	return group, result.Error
}

func UpdateGroupInfo(id uint, group Group) (bool, error) {
	result := DB.Table("groups").Where("id = ?", id).Updates(&group)
	isChanged := result.RowsAffected != 0
	return isChanged, result.Error
}

func UpdateGroupInfoIndex(id uint, index int) (bool, error) {
	result := DB.Table("groups").Where("id = ?", id).Update("group_index", index)
	isChanged := result.RowsAffected != 0
	return isChanged, result.Error
}

func DeleteGroupInfo(id uint) (bool, error) {
	result := DB.Table("groups").Where("id = ?", id).Delete(&Group{})
	isChanged := result.RowsAffected != 0
	return isChanged, result.Error
}
