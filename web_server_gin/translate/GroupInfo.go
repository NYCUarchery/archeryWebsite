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
	if response.ErrorIdTest(context, database.GetGroupIsExist(id), "GroupInfo") {
		return false, database.Group{}
	}
	data, err := database.GetGroupInfoById(id)
	if response.ErrorInternalErrorTest(context, err, "Get GroupInfo") {
		return false, data
	}
	response.AcceptPrint(id, fmt.Sprint(data), "GroupInfo")
	return true, data
}

func GetGroupInfoByID(context *gin.Context) {
	id := convert2int(context, "id")
	isExist, data := IsGetGroupInfo(context, id)
	if !isExist {
		return
	}
	context.IndentedJSON(http.StatusOK, data)
}

func PostGroupInfo(context *gin.Context) {
	var data database.Group
	err := context.BindJSON(&data)
	/*parse data check*/
	if response.ErrorReceiveDataTest(context, err, "GroupInfo") {
		return
	} else if response.ErrorReceiveDataNilTest(context, data, "GroupInfo") {
		return
	}
	/*competition id check*/
	if response.ErrorIdTest(context, database.GetCompetitionIsExist(int(data.CompetitionId)), "Competition(in groupinfo)") {
		return
	}
	/*auto write GroupIndex*/
	data.GroupIndex = database.GetCompetitionGroupNum(int(data.CompetitionId))

	newData, err := database.CreateGroupInfo(data)
	if response.ErrorInternalErrorTest(context, err, "Post GroupInfo") {
		return
	}
	/*update competition.groupnum*/
	database.AddOneCompetitionGroupNum(int(data.CompetitionId))
	context.IndentedJSON(http.StatusOK, newData)
}

func UpdateGroupInfo(context *gin.Context) {
	var data database.Group
	id := convert2int(context, "id")
	/*write id for update success*/
	data.ID = uint(id)
	err := context.BindJSON(&data)
	/*parse data check*/
	if response.ErrorReceiveDataTest(context, err, "GroupInfo") {
		return
	} else if response.ErrorReceiveDataNilTest(context, data, "GroupInfo") {
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
	if response.ErrorInternalErrorTest(context, err, "Update GroupInfo") {
		return
	} else if response.AcceptNotChange(context, isChanged, "Update GroupInfo") {
		return
	}
	/*return new updated data*/
	isExist, newData := IsGetGroupInfo(context, id)
	if !isExist {
		return
	}
	context.IndentedJSON(http.StatusOK, newData)
}

func ReorderGroupInfo(context *gin.Context) {
	var idArray groupIdsForReorder
	err := context.BindJSON(&idArray)
	groupIds := idArray.GroupIds
	competitionId := idArray.CompetitionId
	/*parse data check*/
	if response.ErrorReceiveDataTest(context, err, "groupIdsForReorder of GroupInfo") {
		return
	} else if response.ErrorReceiveDataNilTest(context, groupIds, "GroupIds of groupIdsForReorder") {
		return
	} else if response.ErrorIdTest(context, database.GetCompetitionIsExist(competitionId), "CompetitionId of groupIdsForReorder") {
		return
	}
	/*check competition group_num*/
	gamedata, err := database.GetOnlyCompetition(competitionId)
	if response.ErrorInternalErrorTest(context, err, "Get Competition in Reorder GroupInfo") {
		return
	} else if gamedata.ID == 0 || gamedata.Groups_num != len(groupIds) {
		context.IndentedJSON(http.StatusBadRequest, gin.H{"error": "Groups_num 與 GroupIds 長度不符, Group_num = " + fmt.Sprint(gamedata.Groups_num) + ", GroupIds = " + fmt.Sprint(groupIds)})
		return
	}

	/*update group_index*/
	for index, id := range groupIds {
		if response.ErrorIdTest(context, database.GetGroupIsExist(id), "GroupInfo in Reorder") {
			return
		}
		_, err := database.UpdateGroupInfoIndex(id, index)
		if response.ErrorInternalErrorTest(context, err, "Update GroupInfo Index in Reorder") {
			return
		}
	}
	/*return new updated competition data*/
	isExist, newData := IsGetCompetition(context, competitionId)
	if !isExist {
		return
	}
	context.IndentedJSON(http.StatusOK, newData)
}

func DeleteGroupInfo(context *gin.Context) {
	id := convert2int(context, "id")
	/*check data exist*/
	isChanged, group := IsGetGroupInfo(context, id)
	if !isChanged {
		return
	}
	/*update competition group_num*/
	competitionId := int(group.CompetitionId)
	isExist, _ := IsGetCompetition(context, competitionId)
	if !isExist {
		return
	}
	database.MinusOneCompetitionGroupNum(competitionId)
	/*delete group*/
	affected, err := database.DeleteGroupInfo(id)
	if response.ErrorInternalErrorTest(context, err, "Delete GroupInfo") {
		return
	}
	response.AcceptDeleteSuccess(context, affected, "GroupInfo")
}
