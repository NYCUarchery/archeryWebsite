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
func CreateGroupInfo(group Group) (Group, error) {
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
func UpdateGroupInfo(id int, newgroup Group) (bool, Group, error) {
	var group Group
	result := DB.Table("groups").Where("id = ?", id).Updates(&newgroup)
	DB.Table("groups").Where("id = ?", id).First(&group)
	return result.RowsAffected != 0, group, result.Error
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
func UpdateGroupInfoIndex(id int, index int) (bool, Group, error) {
	var group Group
	result := DB.Table("groups").Where("id = ?", id).Update("group_index", index)
	DB.Table("groups").Where("id = ?", id).First(&group)
	return result.RowsAffected != 0, group, result.Error
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
func DeleteGroupInfo(id int) (bool, int, error) {
	var data Group
	DB.Table("groups").Where("id = ?", id).First(&data)
	competitionId := int(data.CompetitionId)
	result := DB.Table("groups").Where("id = ?", id).Delete(&Group{})
	return result.RowsAffected != 0, competitionId, result.Error
}
