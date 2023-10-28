package translate

import (
	"fmt"
	"net/http"
	"web_server_gin/database"
	response "web_server_gin/translate/Response"

	"github.com/gin-gonic/gin"
)

func IsGetOnlyCompetition(context *gin.Context, id uint) (bool, database.Competition) {
	if response.ErrorIdTest(context, id, database.GetCompetitionIsExist(id), "Competition") {
		return false, database.Competition{}
	}
	data, err := database.GetOnlyCompetition(id)
	if response.ErrorInternalErrorTest(context, id, "Get Competition", err) {
		return false, data
	}
	response.AcceptPrint(id, fmt.Sprint(data), "Competition")
	return true, data
}

func IsGetCompetitionWGroup(context *gin.Context, id uint) (bool, database.Competition) {
	if response.ErrorIdTest(context, id, database.GetCompetitionIsExist(id), "Competition") {
		return false, database.Competition{}
	}
	data, err := database.GetCompetitionWGroups(id)
	if response.ErrorInternalErrorTest(context, id, "Get Competition", err) {
		return false, data
	}
	response.AcceptPrint(id, fmt.Sprint(data), "Competition")
	return true, data
}

// Get Only Competition By ID godoc
//
//	@Summary		Show one Competition without GroupInfo
//	@Description	Get one Competition by id without GroupInfo
//	@Tags			Competition
//	@Produce		json
//	@Param			id	path	int	true	"Competition ID"
//	@Success		200	string	string
//	@Failure		400	string	string
//	@Router			/data/competition/{id} [get]
func GetOnlyCompetitionByID(context *gin.Context) {
	id := convert2uint(context, "id")
	isExist, data := IsGetOnlyCompetition(context, id)
	if !isExist {
		return
	}
	context.IndentedJSON(http.StatusOK, data)
}

// Get One Competition By ID with Groups godoc
//
//	@Summary		Show one Competition with GroupInfos
//	@Description	Get one Competition by id with GroupInfos
//	@Tags			Competition
//	@Produce		json
//	@Param			id	path	int	true	"Competition ID"
//	@Success		200	string	string
//	@Failure		400	string	string
//	@Router			/data/competition/groups/{id} [get]
func GetCompetitionWGroupsByID(context *gin.Context) {
	id := convert2uint(context, "id")
	isExist, data := IsGetCompetitionWGroup(context, id)
	if !isExist {
		return
	}
	context.IndentedJSON(http.StatusOK, data)
}

// Get One Competition By ID with Participants godoc
//
//	@Summary		Show one Competition with Participants
//	@Description	Get one Competition by id with Participants
//	@Tags			Competition
//	@Produce		json
//	@Param			id	path	int	true	"Competition ID"
//	@Success		200	string	string
//	@Failure		400	string	string
//	@Router			/data/competition/groups/{id} [get]
func GetCompetitionWParticipantsByID(context *gin.Context) {
	var data database.Competition
	id := convert2uint(context, "id")
	if response.ErrorIdTest(context, id, database.GetCompetitionIsExist(id), "Competition") {
		return
	}
	data, err := database.GetCompetitionWParticipants(id)
	if response.ErrorInternalErrorTest(context, id, "Get Competition with participants ", err) {
		return
	}
	response.AcceptPrint(id, fmt.Sprint(data), "Competition with participants ")
	context.IndentedJSON(http.StatusOK, data)
}

// Post Competition godoc
//
//	@Summary		Create one Competition and related data
//	@Description	Post one new Competition data with new id, create noTypeGroup, create Lanes which link to noTypeGroup, and return the new Competition data
//	@Tags			Competition
//	@Accept			json
//	@Produce		json
//	@Param			Competition	body	string	true	"Competition"
//	@Success		200			string	string
//	@Failure		400			string	string
//	@Router			/data/competition [post]
func PostCompetition(context *gin.Context) {
	var data database.Competition
	err := context.BindJSON(&data)
	id := data.ID
	/*parse data check*/
	if response.ErrorReceiveDataTest(context, id, "Competition", err) {
		return
	} else if response.ErrorReceiveDataNilTest(context, id, data, "Competition") {
		return
	}
	/*auto write Groups_num, minus one for 無組別*/
	data.GroupsNum = -1

	newData, err := database.PostCompetition(data)
	newId := newData.ID
	if response.ErrorInternalErrorTest(context, newId, "Post GroupInfo", err) {
		return
	}
	/*create無組別group*/
	newData.GroupsNum++
	success, noTypeGroupId := PostNoTypeGroupInfo(context, newId)
	if !success {
		return
	}
	/*create lanes, after get competitionId*/
	for i := 0; i <= data.LanesNum; i++ {
		success := PostLaneThroughCompetition(context, newId, noTypeGroupId, i)
		if !success {
			return
		}
	}
	/*auto write noTypeLaneId*/
	newData.NoTypeLaneId = database.GetNoTypeLaneId(newId)
	fmt.Printf("noTypeLaneId: %d\n", newData.NoTypeLaneId)
	ischanged := database.UpdateCompetitionNoTypeLaneId(newId, newData.NoTypeLaneId)
	if response.AcceptNotChange(context, id, ischanged, "Update Competition NoTypeLaneId") {
		return
	}
	/*auto write noTypeGroupId*/
	newData.NoTypeGroupId = noTypeGroupId
	ischanged = database.UpdateCompetitionNoTypeGroupId(newId, newData.NoTypeGroupId)
	if response.AcceptNotChange(context, id, ischanged, "Update Competition FirstLaneId") {
		return
	}

	context.IndentedJSON(http.StatusOK, newData)
}

// Update Competition godoc
//
//	@Summary		update one Competition without GroupInfo
//	@Description	Put whole new Competition and overwrite with the id but without GroupInfo, cannot replace GroupNum, LaneNum, FirstLaneId, noTyoeGroupId
//	@Tags			Competition
//	@Accept			json
//	@Produce		json
//	@Param			id			path	string	true	"Competition ID"
//	@Param			Competition	body	string	true	"Competition"
//	@Success		200			string	string
//	@Failure		400			string	string
//	@Failure		404			string	string
//	@Failure		500			string	string
//	@Router			/data/competition/whole/{id} [put]
func UpdateCompetition(context *gin.Context) {
	var data database.Competition
	id := convert2uint(context, "id")
	/*write id for update success*/
	data.ID = id
	err := context.BindJSON(&data)
	/*parse data check*/
	if response.ErrorReceiveDataTest(context, id, "Competition", err) {
		return
	} else if response.ErrorReceiveDataNilTest(context, id, data, "Competition") {
		return
	}

	/*replace GroupNum, LaneNum, FirstLaneId, noTyoeGroupId with old one*/
	data.GroupsNum = database.GetCompetitionGroupNum(id)
	data.LanesNum = database.GetCompetitionLaneNum(id)
	data.NoTypeLaneId = database.GetNoTypeLaneId(id)
	data.NoTypeGroupId = database.GetCompetitionNoTypeGroupId(id)

	/*update and check change*/
	isChanged, err := database.UpdateCompetition(id, data)
	if response.ErrorInternalErrorTest(context, id, "Update Competition", err) {
		return
	} else if response.AcceptNotChange(context, id, isChanged, "Update Competition") {
		return
	}
	/*return new update data*/
	isExist, newData := IsGetOnlyCompetition(context, id)
	if !isExist {
		return
	}
	context.IndentedJSON(http.StatusOK, newData)
}

// Delete Competition by id godoc
//
//	@Summary		delete one Competition
//	@Description	delete one Competition by id, delete all related lanes and groups
//	@Tags			Competition
//	@Accept			json
//	@Produce		json
//	@Param			id	path	string	true	"Competition ID"
//	@Success		200	string	string
//	@Failure		400	string	string
//	@Failure		404	string	string
//	@Router			/data/competition/{id} [delete]
func DeleteCompetition(context *gin.Context) {
	id := convert2uint(context, "id")
	/*check data exist*/
	isExist, data := IsGetCompetitionWGroup(context, id)
	if !isExist {
		return
	}
	/*delete all related lanes*/
	success := DeleteLaneByCompetitionId(context, id)
	if !success {
		return
	}
	/*delete all related groups*/
	for _, group := range data.Groups {
		groupId := group.ID
		success, _ := DeleteGroupInfoByIdThroughCompetition(context, groupId)
		if !success {
			return
		}
	}
	/*delete competition*/
	affected, err := database.DeleteCompetition(id)
	if response.ErrorInternalErrorTest(context, id, "Delete Competition with Groups", err) {
		return
	}
	response.AcceptDeleteSuccess(context, id, affected, "Competition with Groups")
}
