package database

type GroupInfo struct {
	ID            uint   `json:"-"         gorm:"primary_key"`
	CompetitionID uint   `json:"-"`
	GroupName     string `json:"group_name"`
	GroupRange    string `json:"group_range"`
	BowType       string `json:"bow_type"`
}

func InitGroupInfo() {
	DB.Table("groups").AutoMigrate(&GroupInfo{})
}

func GetGroupInfo(id int) (GroupInfo, error) {
	var group GroupInfo
	result := DB.Table("groups").Where("id = ?", id).First(&group)
	return group, result.Error
}

func GetGroupInfos(CompetitionID int) ([]GroupInfo, error) {
	var groups []GroupInfo
	result := DB.Table("groups").Find(&groups)
	return groups, result.Error
}

func CreateGroupInfo(group GroupInfo) (GroupInfo, error) {
	result := DB.Table("groups").Create(&group)
	return group, result.Error
}

func UpdateGroupInfo(id int, group GroupInfo) (GroupInfo, error) {
	result := DB.Table("groups").Where("id = ?", id).Updates(&group)
	return group, result.Error
}

func DeleteGroupInfo(id int) (bool, error) {
	result := DB.Table("groups").Where("id = ?", id).Delete(&GroupInfo{})
	return result.RowsAffected != 0, result.Error
}
