package translate

import (
	"fmt"
	"net/http"
	"web_server_gin/database"
	response "web_server_gin/translate/Response"

	"github.com/gin-gonic/gin"
)

type groupIdsForReorder struct {
	CompetitionId int   `json:"competition_id"`
	GroupIds      []int `json:"group_ids"`
}

//	{
//		"competition_id" : 000,
//		"group_ids" : [1, 2, 3, 4, 5, 6, 7, 8]
//	}

func IsGetGroupInfo(context *gin.Context, id int) (bool, database.Group) {
	if response.ErrorIdTest(context, id, database.GetGroupIsExist(id), "GroupInfo") {
		return false, database.Group{}
	}
	data, err := database.GetGroupInfoById(id)
	if response.ErrorInternalErrorTest(context, id, "Get GroupInfo", err) {
		return false, data
	}
	response.AcceptPrint(id, fmt.Sprint(data), "GroupInfo")
	return true, data
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
func GetGroupInfoByID(context *gin.Context) {
	id := convert2int(context, "id")
	isExist, data := IsGetGroupInfo(context, id)
	if !isExist {
		return
	}
	context.IndentedJSON(http.StatusOK, data)
}

// Post GroupInfo godoc
//
//	@Summary		Create one GroupInfo
//	@Description	Post one new GroupInfo data with new id, create qualification with same id, and return the new GroupInfo data
//	@Tags			GroupInfo
//	@Accept			json
//	@Produce		json
//	@Param			GroupInfo	body	string	true	"LaneData"
//	@Success		200			string	string
//	@Failure		400			string	string
//	@Router			/data/groupinfo [post]
func PostGroupInfo(context *gin.Context) {
	var data database.Group
	err := context.BindJSON(&data)
	/*parse data check*/
	if response.ErrorReceiveDataTest(context, 0, "GroupInfo", err) {
		return
	} else if response.ErrorReceiveDataNilTest(context, 0, data, "GroupInfo") {
		return
	}
	/*competition id check*/
	if response.ErrorIdTest(context, int(data.CompetitionId), database.GetCompetitionIsExist(int(data.CompetitionId)), "Competition(in groupinfo)") {
		return
	}
	/*auto write GroupIndex*/
	data.GroupIndex = database.GetCompetitionGroupNum(int(data.CompetitionId))

	newData, err := database.CreateGroupInfo(data)
	if response.ErrorInternalErrorTest(context, int(newData.ID), "Post GroupInfo", err) {
		return
	}
	/*auto create qualification*/
	if !PostQualificationThroughGroup(context, int(newData.ID)) {
		return
	}
	/*update competition.groupnum*/
	database.AddOneCompetitionGroupNum(int(data.CompetitionId))
	context.IndentedJSON(http.StatusOK, newData)
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
func UpdateGroupInfo(context *gin.Context) {
	var data database.Group
	id := convert2int(context, "id")
	/*write id for update success*/
	data.ID = uint(id)
	err := context.BindJSON(&data)
	/*parse data check*/
	if response.ErrorReceiveDataTest(context, id, "GroupInfo", err) {
		return
	} else if response.ErrorReceiveDataNilTest(context, id, data, "GroupInfo") {
		return
	}

	/*replace CompetitionId with old one*/
	isExist, oldData := IsGetGroupInfo(context, id)
	if !isExist {
		return
	}
	data.CompetitionId = oldData.CompetitionId

	/*update and check change*/
	isChanged, err := database.UpdateGroupInfo(id, data)
	if response.ErrorInternalErrorTest(context, id, "Update GroupInfo", err) {
		return
	} else if response.AcceptNotChange(context, id, isChanged, "Update GroupInfo") {
		return
	}
	/*return new updated data*/
	isExist, newData := IsGetGroupInfo(context, id)
	if !isExist {
		return
	}
	context.IndentedJSON(http.StatusOK, newData)
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
func ReorderGroupInfo(context *gin.Context) {
	var idArray groupIdsForReorder
	err := context.BindJSON(&idArray)
	groupIds := idArray.GroupIds
	competitionId := idArray.CompetitionId
	/*parse data check*/
	if response.ErrorReceiveDataTest(context, 0, "groupIdsForReorder of GroupInfo", err) {
		return
	} else if response.ErrorReceiveDataNilTest(context, 0, groupIds, "GroupIds of groupIdsForReorder") {
		return
	} else if response.ErrorIdTest(context, competitionId, database.GetCompetitionIsExist(competitionId), "CompetitionId of groupIdsForReorder") {
		return
	}
	/*check competition group_num*/
	gamedata, err := database.GetOnlyCompetition(competitionId)
	if response.ErrorInternalErrorTest(context, competitionId, "Get Competition in Reorder GroupInfo", err) {
		return
	} else if gamedata.ID == 0 || gamedata.Groups_num != len(groupIds) {
		context.IndentedJSON(http.StatusBadRequest, gin.H{"error": "Groups_num 與 GroupIds 長度不符, Group_num = " + fmt.Sprint(gamedata.Groups_num) + ", GroupIds = " + fmt.Sprint(groupIds)})
		return
	}

	/*update group_index*/
	for index, id := range groupIds {
		if response.ErrorIdTest(context, id, database.GetGroupIsExist(id), "GroupInfo in Reorder") {
			return
		}
		_, err := database.UpdateGroupInfoIndex(id, index)
		if response.ErrorInternalErrorTest(context, id, "Update GroupInfo Index in Reorder", err) {
			return
		}
	}
	/*return new updated competition data*/
	isExist, newData := IsGetCompetitionWGroup(context, competitionId)
	if !isExist {
		return
	}
	context.IndentedJSON(http.StatusOK, newData)
}

// Delete GroupInfo by id godoc
//
//	@Summary		delete one GroupInfo
//	@Description	delete one GroupInfo by id, and delete qualification with same id
//	@Tags			GroupInfo
//	@Accept			json
//	@Produce		json
//	@Param			id	path	string	true	"GroupInfo ID"
//	@Success		200	string	string
//	@Failure		400	string	string
//	@Failure		404	string	string
//	@Router			/data/groupinfo/{id} [delete]
func DeleteGroupInfo(context *gin.Context) {
	id := convert2int(context, "id")
	/*check data exist*/
	isChanged, group := IsGetGroupInfo(context, id)
	if !isChanged {
		return
	}
	/*update competition group_num*/
	competitionId := int(group.CompetitionId)
	isExist, _ := IsGetOnlyCompetition(context, competitionId)
	if !isExist {
		return
	}
	database.MinusOneCompetitionGroupNum(competitionId)
	/*delete group*/
	affected, err := database.DeleteGroupInfo(id)
	if response.ErrorInternalErrorTest(context, id, "Delete GroupInfo", err) {
		return
	}
	/*delete qualification*/
	if !DeleteQualificationThroughGroup(context, id) {
		return
	}
	response.AcceptDeleteSuccess(context, id, affected, "GroupInfo")
}
