package translate

import (
	"backend/internal/database"
	response "backend/internal/translate/Response"
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
)

func IsGetOnlyCompetition(context *gin.Context, id int) (bool, database.Competition) {
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

func IsGetCompetitionWGroup(context *gin.Context, id int) (bool, database.Competition) {
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
	id := convert2int(context, "id")
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
	id := convert2int(context, "id")
	isExist, data := IsGetCompetitionWGroup(context, id)
	if !isExist {
		return
	}
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
	id := int(data.ID)
	/*parse data check*/
	if response.ErrorReceiveDataTest(context, id, "Competition", err) {
		return
	} else if response.ErrorReceiveDataNilTest(context, id, data, "Competition") {
		return
	}
	/*auto write Groups_num, minus one for 無組別*/
	data.GroupsNum = -1

	newData, err := database.PostCompetition(data)
	newId := int(newData.ID)
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
	for i := 0; i < data.LanesNum; i++ {
		success := PostLaneThroughCompetition(context, newId, int(noTypeGroupId), i+1)
		if !success {
			return
		}
	}
	/*auto write firstLaneId and noTypeGroupId*/
	newData.FirstLaneId = uint(database.GetFirstLaneId(uint(newId)))
	ischanged := database.UpdateCompetitionFirstLaneId(newId, int(newData.FirstLaneId))
	if response.AcceptNotChange(context, id, ischanged, "Update Competition FirstLaneId") {
		return
	}
	newData.NoTypeGroupId = int(noTypeGroupId)
	ischanged = database.UpdateCompetitionNoTypeGroupId(newId, int(newData.NoTypeGroupId))
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
	id := convert2int(context, "id")
	/*write id for update success*/
	data.ID = uint(id)
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
	data.FirstLaneId = uint(database.GetFirstLaneId(uint(id)))
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
	id := convert2int(context, "id")
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
		groupId := int(group.ID)
		success, _ := DeleteGroupInfoById(context, groupId)
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

// AllCompetitionInfo godoc
// @Summary			get information of all the competitions
// @Description		get information of all the competitions
// @Tags			Competition
// @Produce			json
// @Success			200	{object}	[]database.Competition "success"
// @Failure			500	{object}	string "internal db error"
// @Router			/competition [get]
func GetAllCompetition(c *gin.Context) {
	comps, err := database.GetAllCompetition()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"result": "internal db error"})
		return
	}

	c.JSON(http.StatusOK, comps)
}
