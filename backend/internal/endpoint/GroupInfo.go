package endpoint

import (
	"backend/internal/database"
	"backend/internal/endpoint/tools"
	response "backend/internal/response"
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
)

type groupIdsForReorder struct {
	CompetitionId uint   `json:"competition_id"`
	GroupIds      []uint `json:"group_ids"`
}

//	{
//		"competition_id" : 000,
//		"group_ids" : [1, 2, 3, 4, 5, 6, 7, 8]
//	}

func IsGetGroupInfo(context *gin.Context, id uint) (bool, database.Group) {
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
//	@Router			/api/groupinfo/{id} [get]
func GetGroupInfoByID(context *gin.Context) {
	id := tools.Convert2uint(context, "id")
	isExist, data := IsGetGroupInfo(context, id)
	if !isExist {
		return
	}
	context.IndentedJSON(http.StatusOK, data)
}

// Get GroupInfo with players By Competition ID godoc
//
//	@Summary		Show one GroupInfo with players
//	@Description	Get one GroupInfo with players by id, usually ordered by rank
//	@Tags			GroupInfo
//	@Produce		json
//	@Param			id	path	int	true	"GroupInfo ID"
//	@Success		200	string	string
//	@Failure		400	string	string
//	@Router			/api/groupinfo/players/{id} [get]
func GetGroupInfoWPlayersByID(context *gin.Context) {
	id := tools.Convert2uint(context, "id")
	isExist, _ := IsGetGroupInfo(context, id)
	if !isExist {
		return
	}

	if response.ErrorIdTest(context, id, database.GetGroupIsExist(id), "GroupInfo with players") {
		return
	}
	data, err := database.GetGroupInfoWPlayersById(id)
	if response.ErrorInternalErrorTest(context, id, "Get GroupInfo with players ", err) {
		return
	}
	response.AcceptPrint(id, fmt.Sprint(data), "GroupInfo whith players")
	context.IndentedJSON(http.StatusOK, data)
}

// Post GroupInfo godoc
//
//	@Summary		Create one GroupInfo
//	@Description	Post one new GroupInfo data with new id, create qualification with same id, auto write GroupIndex, and auto create elimination
//	@Tags			GroupInfo
//	@Accept			json
//	@Produce		json
//	@Param			GroupInfo	body	string	true	"LaneData"
//	@Success		200			string	string
//	@Failure		400			string	string
//	@Router			/api/groupinfo [post]
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
	if response.ErrorIdTest(context, data.CompetitionId, database.GetCompetitionIsExist(data.CompetitionId), "Competition(in groupinfo)") {
		return
	}
	/*auto write GroupIndex*/
	data.GroupIndex = database.GetCompetitionGroupNum(data.CompetitionId)

	newData, err := database.CreateGroupInfo(data)
	if response.ErrorInternalErrorTest(context, newData.ID, "Post GroupInfo", err) {
		return
	}
	/*auto create qualification*/
	if !PostQualificationThroughGroup(context, newData.ID) {
		return
	}
	/*auto create elimination*/
	var elimination database.Elimination
	elimination.GroupId = newData.ID
	elimination.CurrentEnd = 0
	elimination.CurrentStage = 0
	elimination.TeamSize = 1
	success, _ := PostEliminationById(context, elimination)
	if !success {
		return
	}
	/*update competition.groupnum*/
	database.AddOneCompetitionGroupNum(data.CompetitionId)
	context.IndentedJSON(http.StatusOK, newData)
}

// Post 無組別 group, when competition is created
func PostUnassignedGroupInfo(context *gin.Context, competitionId uint) (bool, uint) {
	var data database.Group
	/*auto write GroupIndex*/
	data.GroupIndex = database.GetCompetitionGroupNum(competitionId)
	/*auto write CompetitionId*/
	data.CompetitionId = uint(competitionId)
	/*auto write GroupName*/
	data.GroupName = "unassigned"

	newData, err := database.CreateGroupInfo(data)
	if response.ErrorInternalErrorTest(context, newData.ID, "Post GroupInfo", err) {
		return false, 0
	}
	/*auto create qualification*/
	if !PostQualificationThroughGroup(context, newData.ID) {
		return false, 0
	}
	/*update competition.groupnum*/
	database.AddOneCompetitionGroupNum(competitionId)
	response.AcceptPrint(newData.ID, fmt.Sprint(newData), "GroupInfo unassigned ")
	return true, newData.ID
}

// Update GroupInfo godoc
//
//	@Summary		update one GroupInfo
//	@Description	Put whole new GroupInfo and overwrite with the id, cannot overwrite CompetitionId
//	@Tags			GroupInfo
//	@Accept			json
//	@Produce		json
//	@Param			id			path	string	true	"GroupInfo ID"
//	@Param			GroupInfo	body	string	true	"GroupInfo"
//	@Success		200			string	string
//	@Failure		400			string	string
//	@Failure		404			string	string
//	@Failure		500			string	string
//	@Router			/api/groupinfo/whole/{id} [put]
func UpdateGroupInfo(context *gin.Context) {
	var data database.Group
	id := tools.Convert2uint(context, "id")
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
		/*cannot update 無組別*/
	} else if oldData.GroupIndex == -1 {
		context.IndentedJSON(http.StatusBadRequest, gin.H{"error": "UnassignedGroup cannot update"})
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
//	@Router			/api/groupinfo/reorder [put]
func ReorderGroupInfo(context *gin.Context) {
	var idArray groupIdsForReorder
	err := context.BindJSON(&idArray)
	groupIds := idArray.GroupIds
	competitionId := idArray.CompetitionId
	UnassignedGroupId := database.GetCompetitionUnassignedGroupId(competitionId)
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
	} else if gamedata.ID == 0 || gamedata.GroupsNum != len(groupIds) {
		context.IndentedJSON(http.StatusBadRequest, gin.H{"error": "Groups_num 與 GroupIds 長度不符, Group_num = " + fmt.Sprint(gamedata.GroupsNum) + ", GroupIds = " + fmt.Sprint(groupIds)})
		return
	}
	/*check if there're no UnassignedGroupId*/
	for _, id := range groupIds {
		if id == UnassignedGroupId {
			context.IndentedJSON(http.StatusBadRequest, gin.H{"error": "GroupIds cannot include UnassignedGroupId"})
			return
		}
	}
	/*check all group exist*/
	for _, id := range groupIds {
		if response.ErrorIdTest(context, id, database.GetGroupIsExist(id), "GroupInfo in Reorder") {
			return
		}
	}

	/*update group_index*/
	for index, id := range groupIds {
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
//	@Description	delete one GroupInfo by id, delete qualification, and change player to UnassignedGroup and UnassignedLane
//	@Tags			GroupInfo
//	@Accept			json
//	@Produce		json
//	@Param			id	path	string	true	"GroupInfo ID"
//	@Success		200	string	string
//	@Failure		400	string	string
//	@Failure		404	string	string
//	@Router			/api/groupinfo/{id} [delete]
func DeleteGroupInfo(context *gin.Context) {
	id := tools.Convert2uint(context, "id")
	/*cannot delete 無組別*/
	success, group := IsGetGroupInfo(context, id)
	if !success {
		return
	} else if group.GroupIndex == -1 {
		context.IndentedJSON(http.StatusBadRequest, gin.H{"error": "UnassignedGroup cannot delete"})
		return
	}
	success, affected := DeleteGroupInfoById(context, id)
	if !success {
		return
	}
	response.AcceptDeleteSuccess(context, id, affected, "GroupInfo")
}

func DeleteGroupInfoById(context *gin.Context, id uint) (bool, bool) {
	/*check data exist*/
	success, group := IsGetGroupInfo(context, id)
	if !success {
		return false, false
	}
	/*update competition group_num*/
	competitionId := group.CompetitionId
	isExist, _ := IsGetOnlyCompetition(context, competitionId)
	if !isExist {
		return false, false
	}
	/*change player to UnassignedGroup and UnassignedLane*/
	qualification, _ := database.GetQualificationWLanesPlayersByID(id)
	UnassignedGroupId := database.GetCompetitionUnassignedGroupId(competitionId)
	fmt.Printf("UnassignedGroupId = %d\n", UnassignedGroupId)
	UnassignedLaneId := database.GetCompetitionUnassignedLaneId(competitionId)
	fmt.Printf("UnassignedLaneId = %d\n", UnassignedLaneId)
	fmt.Printf("qualification.Lanes = %v\n", qualification.Lanes)
	/*all players under lanes of this group*/
	playerIds, err := database.GetPlayerIdsByCompetitionIdGroupId(competitionId, id)
	if response.ErrorInternalErrorTest(context, id, "Get PlayerIds in Delete GroupInfo", err) {
		return false, false
	}
	for _, playerId := range playerIds {
		err := database.UpdatePlayerGroupId(playerId, UnassignedGroupId)
		if response.ErrorInternalErrorTest(context, playerId, "Update Player in Delete GroupInfo", err) {
			return false, false
		}
		err = database.UpdatePlayerLaneId(playerId, UnassignedLaneId)
		if response.ErrorInternalErrorTest(context, playerId, "Update Player in Delete GroupInfo", err) {
			return false, false
		}
	}

	/*delete qualification*/
	if !DeleteQualificationThroughGroup(context, id) {
		return false, false
	}
	/*delete group*/
	affected, err := database.DeleteGroupInfo(id)
	if response.ErrorInternalErrorTest(context, id, "Delete GroupInfo", err) {
		return false, false
	}
	database.MinusOneCompetitionGroupNum(competitionId)
	return true, affected
}

func DeleteGroupInfoByIdThroughCompetition(context *gin.Context, id uint) (bool, bool) {
	/*check data exist*/
	success, group := IsGetGroupInfo(context, id)
	if !success {
		return false, false
	}
	/*update competition group_num*/
	competitionId := group.CompetitionId
	isExist, _ := IsGetOnlyCompetition(context, competitionId)
	if !isExist {
		return false, false
	}
	/*delete qualification*/
	if !DeleteQualificationThroughGroupThroughCompetition(context, id) {
		return false, false
	}
	/*delete group*/
	affected, err := database.DeleteGroupInfo(id)
	if response.ErrorInternalErrorTest(context, id, "Delete GroupInfo", err) {
		return false, false
	}
	database.MinusOneCompetitionGroupNum(competitionId)
	return true, affected
}
