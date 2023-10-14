package database

type GroupInfo struct {
	ID         uint   `json:"-" gorm:"primary_key"`
	GameInfoID uint   `json:"-" gorm:"column:competition_id"`
	GroupName  string `json:"group_name"`
	GroupRange string `json:"group_range"`
	BowType    string `json:"bow_type"`
	GroupIndex int    `json:"-"`
}

func InitGroupInfo() {
	DB.Table("groups").AutoMigrate(&GroupInfo{})
}

// Get GroupInfo By ID godoc
//
//	@Summary		Show one GroupInfo
//	@Description	Get one GroupInfo by id
//	@Tags			GroupInfo
//	@Produce		json
//	@Param			id	path	int	true	"LaneInfo ID"
//	@Success		200	string	string
//	@Failure		400	string	string
//	@Router			/data/groupinfo/{id} [get]
func GetGroupInfoById(id int) (GroupInfo, error) {
	var group GroupInfo
	result := DB.Table("groups").Where("id = ?", id).First(&group)
	return group, result.Error
}

// Post GroupInfo godoc
//
//	@Summary		Create one GroupInfo
//	@Description	Post one new GroupInfo data with new id, and return the new GroupInfo data
//	@Tags			GroupInfo
//	@Accept			json
//	@Produce		json
//	@Param			GroupInfo	body	string	true	"LaneData"
//	@Success		200			string	string
//	@Failure		400			string	string
//	@Router			/data/groupinfo [post]
func CreateGroupInfo(group GroupInfo) (GroupInfo, error) {
	result := DB.Table("groups").Create(&group)
	return group, result.Error
}

// Update GroupInfo godoc
//
//	@Summary		update one GroupInfo
//	@Description	Put whole new GroupInfo and overwrite with the id
//	@Tags			GroupInfo
//	@Accept			json
//	@Produce		json
//	@Param			id			path	string	true	"GroupInfo ID"
//	@Param			GroupInfo	body	string	true	"GroupInfo"
//	@Success		200			string	string
//	@Failure		400			string	string
//	@Failure		404			string	string
//	@Failure		500			string	string
//	@Router			/data/groupinfo/whole/{id} [put]
func UpdateGroupInfo(id int, group GroupInfo) (GroupInfo, error) {
	result := DB.Table("groups").Where("id = ?", id).Updates(&group)
	return group, result.Error
}

// Delete GroupInfo by id godoc
//
//	@Summary		delete one GroupInfo
//	@Description	delete one GroupInfo by id
//	@Tags			GroupInfo
//	@Accept			json
//	@Produce		json
//	@Param			id	path	string	true	"GroupInfo ID"
//	@Success		200	string	string
//	@Failure		400	string	string
//	@Failure		404	string	string
//	@Router			/data/groupinfo/{id} [delete]
func DeleteGroupInfo(id int) (bool, error) {
	result := DB.Table("groups").Where("id = ?", id).Delete(&GroupInfo{})
	return result.RowsAffected != 0, result.Error
}
