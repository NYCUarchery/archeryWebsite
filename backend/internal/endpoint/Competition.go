package endpoint

import (
	"backend/internal/database"
	response "backend/internal/response"
	"fmt"
	"net/http"

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

func IsGetCompetitionWGroupsPlayers(context *gin.Context, id uint) (bool, database.Competition) {
	if response.ErrorIdTest(context, id, database.GetCompetitionIsExist(id), "Competition") {
		return false, database.Competition{}
	}
	data, err := database.GetCompetitionWGroupsPlayers(id)
	if response.ErrorInternalErrorTest(context, id, "Get Competition", err) {
		return false, data
	}
	response.AcceptPrint(id, fmt.Sprint(data), "Competition")
	return true, data
}

func IsGetCompetitionWParticipants(context *gin.Context, id uint) (bool, database.Competition) {
	if response.ErrorIdTest(context, id, database.GetCompetitionIsExist(id), "Competition") {
		return false, database.Competition{}
	}
	data, err := database.GetCompetitionWParticipants(id)
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
//	@Router			/api/competition/{id} [get]
func GetOnlyCompetitionByID(context *gin.Context) {
	id := convert2uint(context, "id")
	isExist, data := IsGetOnlyCompetition(context, id)
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
//	@Router			/api/competition/participants/{id} [get]
func GetCompetitionWParticipantsByID(context *gin.Context) {
	var data database.Competition
	id := convert2uint(context, "id")
	isExist, data := IsGetCompetitionWParticipants(context, id)
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
//	@Router			/api/competition/groups/{id} [get]
func GetCompetitionWGroupsByID(context *gin.Context) {
	id := convert2uint(context, "id")
	isExist, data := IsGetCompetitionWGroup(context, id)
	if !isExist {
		return
	}
	context.IndentedJSON(http.StatusOK, data)
}

// Get One Competition By ID with Groups and Players godoc
//
//	@Summary		Show one Competition with GroupInfos and Players
//	@Description	Get one Competition by id with GroupInfos and Players
//	@Tags			Competition
//	@Produce		json
//	@Param			id	path	int	true	"Competition ID"
//	@Success		200	string	string
//	@Failure		400	string	string
//	@Router			/api/competition/groups/players/{id} [get]
func GetCompetitionWGroupsPlayersByID(context *gin.Context) {
	id := convert2uint(context, "id")
	isExist, data := IsGetCompetitionWGroupsPlayers(context, id)
	if !isExist {
		return
	}
	context.IndentedJSON(http.StatusOK, data)
}

// Post Competition godoc
//
//	@Summary		Create one Competition and related data
//	@Description	Post one new Competition data with new id, create UnassignedGroup, create Lanes and UnassignedLane which link to UnassignedGroup, and return the new Competition data
//	@Tags			Competition
//	@Accept			json
//	@Produce		json
//	@Param			Competition	body	string	true	"Competition"
//	@Success		200			string	string
//	@Failure		400			string	string
//	@Router			/api/competition [post]
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
	/*roundsNum must > 0*/
	if data.RoundsNum <= 0 {
		context.IndentedJSON(http.StatusBadRequest, gin.H{"error": "When creating Competition, roundsNum must > 0"})
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
	success, UnassignedGroupId := PostUnassignedGroupInfo(context, newId)
	fmt.Printf("UnassignedGroupId: %v\n", UnassignedGroupId)
	if !success {
		return
	}
	/*create lanes, after get competitionId*/
	for i := 0; i <= data.LanesNum; i++ {
		success := PostLaneThroughCompetition(context, newId, UnassignedGroupId, i)
		if !success {
			return
		}
	}
	/*auto write UnassignedLaneId*/
	newData.UnassignedLaneId = database.GetUnassignedLaneId(newId)
	fmt.Printf("UnassignedLaneId: %d\n", newData.UnassignedLaneId)
	ischanged := database.UpdateCompetitionUnassignedLaneId(newId, newData.UnassignedLaneId)
	if response.AcceptNotChange(context, id, ischanged, "Update Competition UnassignedLaneId") {
		return
	}
	/*auto write UnassignedGroupId*/
	newData.UnassignedGroupId = UnassignedGroupId
	ischanged = database.UpdateCompetitionUnassignedGroupId(newId, newData.UnassignedGroupId)
	if response.AcceptNotChange(context, id, ischanged, "Update Competition UnassignedLaneId") {
		return
	}
	response.AcceptPrint(newId, fmt.Sprint(newData), "Competition")
	context.IndentedJSON(http.StatusOK, newData)
}

// Update Competition godoc
//
//	@Summary		update one Competition without GroupInfo
//	@Description	Put whole new Competition and overwrite with the id but without GroupInfo, cannot replace RoundNum, GroupNum, LaneNum, FirstLaneId, unassignedGroupId
//	@Tags			Competition
//	@Accept			json
//	@Produce		json
//	@Param			id			path	string	true	"Competition ID"
//	@Param			Competition	body	string	true	"Competition"
//	@Success		200			string	string
//	@Failure		400			string	string
//	@Failure		404			string	string
//	@Failure		500			string	string
//	@Router			/api/competition/whole/{id} [put]
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

	/*replace roundNum, GroupNum, LaneNum, FirstLaneId, noTyoeGroupId with old one*/
	data.RoundsNum = database.GetCompetitionRoundsNum(id)
	data.GroupsNum = database.GetCompetitionGroupNum(id)
	data.LanesNum = database.GetCompetitionLaneNum(id)
	data.UnassignedLaneId = database.GetUnassignedLaneId(id)
	data.UnassignedGroupId = database.GetCompetitionUnassignedGroupId(id)

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

// Update Competition players Ranking godoc
//
//	@Summary		update one Competition Ranking
//	@Description	Update update all  player ranking of different groups in one Competition
//	@Tags			Competition
//	@Accept			json
//	@Produce		json
//	@Param			id			path	string	true	"Competition ID"
//	@Success		200			string	string
//	@Failure		400			string	string
//	@Failure		404			string	string
//	@Failure		500			string	string
//	@Router			/api/competition/groups/players/rank/{id} [put]
func UpdateCompetitionRank(context *gin.Context) {
	id := convert2uint(context, "id")
	/*check data exist*/
	isExist, _ := IsGetOnlyCompetition(context, id)
	if !isExist {
		return
	}

	/*get players of each group, then update player rank*/
	/*update all related player*/
	groudIds, error := database.GetCompetitionGroupIds(id)
	if response.ErrorInternalErrorTest(context, id, "Get Competition GroupIds when update ranking", error) {
		return
	}
	for _, groupId := range groudIds {
		playerIds, error := database.GetGroupPlayerIdRankOrderById(groupId)
		if response.ErrorInternalErrorTest(context, id, "Get player ids when update ranking", error) {
			return
		}
		for i, playerId := range playerIds {
			fmt.Printf("playerId: %d, rank: %d\n", playerId, i+1)
			error := database.UpdatePlayerRank(playerId, i+1)
			if response.ErrorInternalErrorTest(context, id, "Update player rank when update ranking by competition id", error) {
				return
			}
		}
	}
	context.IndentedJSON(http.StatusOK, nil)
}

// Delete Competition by id godoc
//
//	@Summary		delete one Competition
//	@Description	delete one Competition by id, delete all related groups, lanes, players
//	@Tags			Competition
//	@Accept			json
//	@Produce		json
//	@Param			id	path	string	true	"Competition ID"
//	@Success		200	string	string
//	@Failure		400	string	string
//	@Failure		404	string	string
//	@Router			/api/competition/{id} [delete]
func DeleteCompetition(context *gin.Context) {
	id := convert2uint(context, "id")
	/*check data exist*/
	isExist, data := IsGetCompetitionWGroupsPlayers(context, id)
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
	/*delete all related player*/
	for _, group := range data.Groups {
		for _, player := range group.Players {
			playerId := player.ID
			success := DeletePlayerThroughCompetition(context, playerId)
			if !success {
				return
			}
		}
	}
	_, data = IsGetCompetitionWParticipants(context, id)
	/*delete all related participant*/
	for _, participant := range data.Participants {
		participantId := participant.ID
		success := DeleteParticipaint(context, participantId)
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
