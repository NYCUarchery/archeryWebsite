package database

type Group struct {
	ID            uint   `json:"id" gorm:"primary_key"`
	CompetitionId uint   `json:"competition_id" `
	GroupName     string `json:"group_name"`
	GroupRange    string `json:"group_range"`
	BowType       string `json:"bow_type"`
	GroupIndex    int    `json:"group_index"`
}

func InitGroupInfo() {
	DB.Table("groups").AutoMigrate(&Group{})
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
func GetGroupInfoById(id int) (Group, error) {
	var group Group
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
func CreateGroupInfo(group Group) error {
	result := DB.Table("groups").Create(&group)
	return result.Error
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
func UpdateGroupInfo(id int, group Group) (bool, error) {
	result := DB.Table("groups").Where("id = ?", id).Updates(&group)
	isChanged := result.RowsAffected != 0
	return isChanged, result.Error
}

// Update GroupInfos Index godoc
//
//	@Summary		update GroupInfos Indexes under the same Competition
//	@Description	Put competition_id and group_ids to update GroupInfos Indexes under the same Competition
//	@Tags			GroupInfo
//	@Accept			json
//	@Produce		json
//	@Param			groupIdsForReorder	body	string	true	"GroupInfo IDs for reorder"
//	@Success		200					string	string
//	@Failure		400					string	string
//	@Failure		404					string	string
//	@Failure		500					string	string
//	@Router			/data/groupinfo/reorder [put]
func UpdateGroupInfoIndex(id int, index int) (bool, error) {
	result := DB.Table("groups").Where("id = ?", id).Update("group_index", index)
	isChanged := result.RowsAffected != 0
	return isChanged, result.Error
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
	result := DB.Table("groups").Where("id = ?", id).Delete(&Group{})
	isChanged := result.RowsAffected != 0
	return isChanged, result.Error
}
