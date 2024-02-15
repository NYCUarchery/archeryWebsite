package endpoint

import (
	"backend/internal/database"
	response "backend/internal/response"
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

var zeroTime, _ = time.Parse(time.RFC3339, "0001-01-01T00:00:00+00:01")

// for GetCompetitionWGroupsQuaEliByID
type EliminationData struct {
	EliminationId uint `json:"elimination_id"`
	TeamSize      int  `json:"team_size"`
}

// for GetCompetitionWGroupsQuaEliByID
type GroupData struct {
	GroupId         uint              `json:"group_id"`
	GroupName       string            `json:"group_name"`
	GroupRange      string            `json:"group_range"`
	BowType         string            `json:"bow_type"`
	EliminationData []EliminationData `json:"elimination_data" swagger:"interface{}"`
}

// for GetCompetitionWGroupsQuaEliByID
type CompetitionWGroupsQuaEliData struct {
	CompetitionId uint        `json:"competition_id"`
	GroupData     []GroupData `json:"group_data" swagger:"interface{}"`
}

// for PostCompetition
type CompetitionPostData struct {
	Title     string    `json:"title"`
	SubTitle  string    `json:"sub_title"`
	HostId    uint      `json:"host_id"`
	StartTime time.Time `json:"start_time"`
	EndTime   time.Time `json:"end_time"`
	RoundNum  int       `json:"round_num"`
	LaneNum   int       `json:"lane_num"`
	Script    string    `json:"script"`
}

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
//	@Summary		Show one Competition without groups and participants
//	@Description	Get one Competition by id without groups and participants
//	@Description	zeroTime 0001-01-01T00:00:00+00:01
//	@Tags			Competition
//	@Produce		json
//	@Param			id	path		int																		true	"Competition ID"
//	@Success		200	{object}	database.Competition{groups=response.Nill,participants=response.Nill}	"success, but groups and participants are empty"
//	@Failure		400	{object}	response.ErrorIdResponse												"invalid competition id parameter"
//	@Failure		500	{object}	response.ErrorInternalErrorResponse										"internal db error"
//	@Router			/competition/{id} [get]
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
//	@Param			id	path		int																				true	"Competition ID"
//	@Success		200	{object}	database.Competition{groups=response.Nill,participants=database.Participant}	"success, but groups is empty"
//	@Failure		400	{object}	response.ErrorIdResponse														"invalid comepetition id parameter"
//	@Failure		500	{object}	response.ErrorInternalErrorResponse												"internal db error"
//	@Router			/competition/participants/{id} [get]
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
//	@Param			id	path		int																		true	"Competition ID"
//	@Success		200	{object}	database.Competition{groups=database.Group,participants=response.Nill}	"success, but participants is empty"
//	@Failure		400	{object}	response.ErrorIdResponse												"invalid competition id parameter"
//	@Failure		500	{object}	response.ErrorInternalErrorResponse										"internal db error"
//	@Router			/competition/groups/{id} [get]
func GetCompetitionWGroupsByID(context *gin.Context) {
	id := convert2uint(context, "id")
	isExist, data := IsGetCompetitionWGroup(context, id)
	if !isExist {
		return
	}
	context.IndentedJSON(http.StatusOK, data)
}

// Get Competition with Groups Qualification Elimination By ID godoc
//
//	@Summary		Show Qualifications and Eliminations of one Competition
//	@Description	Get one Competition by id with related Groups which have related one Qualification id and many Elimination ids
//	@Tags			Competition
//	@Produce		json
//	@Param			id	path		int										true	"Competition ID"
//	@Success		200	{object}	endpoint.CompetitionWGroupsQuaEliData	"success"
//	@Failure		400	{object}	response.ErrorIdResponse				"invalid comepetition id parameter"
//	@Failure		500	{object}	response.ErrorInternalErrorResponse		"internal db error / Get Competition Group Ids when get Competition with Groups Qualification Elimination / Get Elimination By Group Id when get Competition with Groups Qualification Elimination"
//	@Router			/competition/groups/qualieli/{id} [get]
func GetCompetitionWGroupsQuaEliByID(context *gin.Context) {
	var data CompetitionWGroupsQuaEliData
	id := convert2uint(context, "id")
	isExist, _ := IsGetOnlyCompetition(context, id)
	if !isExist {
		return
	}
	data.CompetitionId = id
	/*get all group ids except Unassigned group*/
	unassignedGroupId := database.GetCompetitionUnassignedGroupId(id)
	groupIds, err := database.GetCompetitionGroupIds(id, unassignedGroupId)
	if response.ErrorInternalErrorTest(context, id, "Get Competition Group Ids when get Competition with Groups Qualification Elimination", err) {
		return
	}
	for index, groupId := range groupIds {
		isExist, groupData := IsGetGroupInfo(context, groupId)
		if !isExist {
			return
		}
		var groupdata GroupData
		groupdata.GroupId = groupData.ID
		groupdata.GroupName = groupData.GroupName
		groupdata.GroupRange = groupData.GroupRange
		groupdata.BowType = groupData.BowType
		data.GroupData = append(data.GroupData, groupdata)
		eliminationDatas, err := database.GetEliminationByGroupId(groupId)
		if response.ErrorInternalErrorTest(context, id, "Get Elimination By Group Id when get Competition with Groups Qualification Elimination", err) {
			return
		}
		for _, eliminationData := range eliminationDatas {
			var eliminationdata EliminationData
			eliminationdata.EliminationId = eliminationData.ID
			eliminationdata.TeamSize = eliminationData.TeamSize
			data.GroupData[index].EliminationData = append(data.GroupData[index].EliminationData, eliminationdata)
		}
	}
	context.IndentedJSON(http.StatusOK, data)
}

// Get One Competition By ID with Groups and Players godoc
//
//	@Summary		Show one Competition with GroupInfos and Players
//	@Description	Get one Competition by id with GroupInfos and Players
//	@Tags			Competition
//	@Produce		json
//	@Param			id	path		int																																				true	"Competition ID"
//	@Success		200	{object}	database.Competition{groups=database.Group{players=database.Player{rounds=response.Nill,player_sets=response.Nill}},participants=response.Nill}	"success, but groups is empty"
//	@Failure		400	{object}	response.ErrorIdResponse																														"invalid comepetition id parameter"
//	@Failure		500	{object}	response.ErrorInternalErrorResponse																												"internal db error"
//	@Router			/competition/groups/players/{id} [get]
func GetCompetitionWGroupsPlayersByID(context *gin.Context) {
	id := convert2uint(context, "id")
	isExist, data := IsGetCompetitionWGroupsPlayers(context, id)
	if !isExist {
		return
	}
	context.IndentedJSON(http.StatusOK, data)
}

// Get current Competitions godoc
//
//	@Summary		Show current Competitions
//	@Description	Get current Competitions, head and tail are the range of most recent competitions
//	@Description	For example, head = 0, tail = 10, then return the most recent 10 competitions
//	@Description	head >= 0, tail >= 0, head <= tail
//	@Tags			Competition
//	@Produce		json
//	@Param			head	path		int										true	"head"
//	@Param			tail	path		int										true	"tail"
//	@Success		200		{object}	[]database.Competition					"success"
//	@Failure		400		{object}	response.ErrorReceiveDataFormatResponse	"head and tail must >= 0 / head must <= tail / invalid head parameter / invalid tail parameter"
//	@Failure		500		{object}	response.ErrorInternalErrorResponse		"internal db error / Get Current Competitions"
//	@Router			/competition/current/{head}/{tail} [get]
func GetCurrentCompetitions(context *gin.Context) {
	head := convert2int(context, "head")
	tail := convert2int(context, "tail")
	if head < 0 || tail < 0 {
		response.ErrorReceiveDataFormat(context, "head and tail must >= 0")
		return
	}
	if head > tail {
		response.ErrorReceiveDataFormat(context, "head must <= tail")
		return
	}
	competitions, err := database.GetCurrentCompetitions(head, tail)
	if response.ErrorInternalErrorTest(context, 0, "Get Current Competitions", err) {
		return
	}
	context.IndentedJSON(http.StatusOK, competitions)
}

// Get recent Competitions dealing with User godoc
//
//	@Summary		Show recent Competitions dealing with User
//	@Description	Get recent Competitions by User id, head and tail are the range of most recent competitions
//	@Description	For example, head = 0, tail = 10, then return the most recent 10 competitions
//	@Description	head >= 0, tail >= 0, head <= tail
//	@Tags			Competition
//	@Produce		json
//	@Param			userid	path		int										true	"User ID"
//	@Param			head	path		int										true	"head"
//	@Param			tail	path		int										true	"tail"
//	@Success		200		{object}	[]database.Competition					"success"
//	@Failure		400		{object}	response.ErrorReceiveDataFormatResponse	"head and tail must >= 0 / head must <= tail / invalid head parameter / invalid tail parameter / invalid userid parameter"
//	@Failure		500		{object}	response.ErrorInternalErrorResponse		"internal db error / Get User Is Exist / Get Competitions Of User"
//	@Router			/competition/recent/{userid}/{head}/{tail} [get]
func GetCompetitionsOfUser(context *gin.Context) {
	head := convert2int(context, "head")
	tail := convert2int(context, "tail")
	userId := convert2uint(context, "userid")
	if response.ErrorIdTest(context, userId, database.GetUserIsExist(userId), "User") {
		return
	}
	competitions, err := database.GetCompetitionsOfUser(userId, head, tail)
	if response.ErrorInternalErrorTest(context, userId, "Get Competitions Of User", err) {
		return
	}
	context.IndentedJSON(http.StatusOK, competitions)
}

// Post Competition godoc
//
//	@Summary		Create one Competition and related data
//	@Description	Post one new Competition data with new id
//	@Description	Create UnassignedGroup, create Lanes and UnassignedLane which link to UnassignedGroup
//	@Description	Add host as admin of competition, and return the new Competition data
//	@Description	ZeroTime 0001-01-01T00:00:00+00:01
//	@Tags			Competition
//	@Accept			json
//	@Produce		json
//	@Param			Competition	body		endpoint.CompetitionPostData			true	"Competition"
//	@Success		200			{object}	database.Competition					"success"
//	@Failure		400			{object}	response.ErrorReceiveDataFormatResponse	"roundsNum must > 0 / When creating Competition, startTime must <= endTime"
//	@Failure		500			{object}	response.ErrorInternalErrorResponse		"internal db error / Post GroupInfo / Update Competition UnassignedLaneId / Update Competition UnassignedGroupId"
//	@Router			/competition [post]
func PostCompetition(context *gin.Context) {
	var data database.Competition
	err := context.BindJSON(&data)
	/*parse data check*/
	if response.ErrorReceiveDataTest(context, 0, "Competition", err) {
		return
	} else if response.ErrorReceiveDataNilTest(context, 0, data, "Competition") {
		return
	}
	/*roundsNum must > 0*/
	if data.RoundsNum <= 0 {
		context.IndentedJSON(http.StatusBadRequest, gin.H{"error": "When creating Competition, roundsNum must > 0"})
		return
	}
	/*time*/
	fmt.Printf("StartTime: %v, EndTime: %v\n", data.StartTime, data.EndTime)
	fmt.Printf("zeroTime: %v\n", zeroTime)
	if data.StartTime.Equal(zeroTime) && data.EndTime.Equal(zeroTime) {
		data.StartTime = time.Now()
		data.EndTime = time.Now()
	} else if data.StartTime.Equal(zeroTime) {
		data.StartTime = data.EndTime
	} else if data.EndTime.Equal(zeroTime) {
		data.EndTime = data.StartTime
	} else if data.StartTime.After(data.EndTime) {
		context.IndentedJSON(http.StatusBadRequest, gin.H{"error": "When creating Competition, startTime must <= endTime"})
		return
	}
	/*auto write Groups_num, minus one for 無組別*/
	data.GroupsNum = -1
	data.CurrentPhase = 0
	data.QualificationCurrentEnd = 0
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
	if response.AcceptNotChange(context, 0, ischanged, "Update Competition UnassignedLaneId") {
		return
	}
	/*auto write UnassignedGroupId*/
	newData.UnassignedGroupId = UnassignedGroupId
	ischanged = database.UpdateCompetitionUnassignedGroupId(newId, newData.UnassignedGroupId)
	if response.AcceptNotChange(context, 0, ischanged, "Update Competition UnassignedLaneId") {
		return
	}
	/*add host as admin of participant*/
	var newParticipant database.Participant
	newParticipant.UserID = newData.HostID
	newParticipant.CompetitionID = newId
	newParticipant.Role = "admin"
	newParticipant.Status = "approved"
	database.AddParticipant(&newParticipant)
	/*return new data*/
	response.AcceptPrint(newId, fmt.Sprint(newData), "Competition")
	context.IndentedJSON(http.StatusOK, newData)
}

// Update Competition godoc
//
//	@Summary		update one Competition without GroupInfo
//	@Description	Put whole new Competition and overwrite with the id but without GroupInfo, cannot replace RoundNum, GroupNum, LaneNum, unassignedLaneId, unassignedGroupId
//	@Description	zeroTime 0001-01-01T00:00:00+00:01
//	@Tags			Competition
//	@Accept			json
//	@Produce		json
//	@Param			id			path	string	true	"Competition ID"
//	@Param			Competition	body	string	true	"Competition"
//	@Success		200			string	string
//	@Failure		400			string	string
//	@Failure		404			string	string
//	@Failure		500			string	string
//	@Router			/competition/whole/{id} [put]
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
	} else if response.ErrorIdTest(context, id, database.GetCompetitionIsExist(id), "Competition") {
		return
	}

	/*only change title, subtitle, current_phase, qualification_current_end, script*/
	oldData, err := database.GetOnlyCompetition(id)
	if response.ErrorInternalErrorTest(context, id, "Get Competition", err) {
		return
	}
	oldData.Title = data.Title
	oldData.SubTitle = data.SubTitle
	oldData.CurrentPhase = data.CurrentPhase
	oldData.QualificationCurrentEnd = data.QualificationCurrentEnd
	oldData.Script = data.Script
	/*time*/
	var currentStartTime time.Time
	var currentEndTime time.Time
	if data.StartTime.Equal(zeroTime) {
		currentStartTime = oldData.StartTime
	} else {
		currentStartTime = data.StartTime
	}
	if data.EndTime.Equal(zeroTime) {
		currentEndTime = oldData.EndTime
	} else {
		currentEndTime = data.EndTime
	}
	if currentStartTime.After(currentEndTime) {
		context.IndentedJSON(http.StatusBadRequest, gin.H{"error": "When creating Competition, startTime must <= endTime"})
		return
	}
	oldData.StartTime = currentStartTime
	oldData.EndTime = currentEndTime
	data = oldData
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
//	@Param			id	path	string	true	"Competition ID"
//	@Success		200	string	string
//	@Failure		400	string	string
//	@Failure		404	string	string
//	@Failure		500	string	string
//	@Router			/competition/groups/players/rank/{id} [put]
func UpdateCompetitionRank(context *gin.Context) {
	id := convert2uint(context, "id")
	/*check data exist*/
	isExist, _ := IsGetOnlyCompetition(context, id)
	if !isExist {
		return
	}

	/*get players of each group, then update player rank*/
	/*update all related player*/
	groudIds, error := database.GetCompetitionAllGroupIds(id)
	if response.ErrorInternalErrorTest(context, id, "Get Competition GroupIds when update ranking", error) {
		return
	}
	for _, groupId := range groudIds {
		GroupPlayer, error := database.GetGroupPlayerIdRankOrderById(groupId)
		if response.ErrorInternalErrorTest(context, id, "Get player ids when update ranking", error) {
			return
		}
		for i, temp := range GroupPlayer {
			fmt.Printf("playerId: %d, rank: %d, TenUpcnt: %d, Xcnt: %d\n", temp.ID, i+1, temp.TenUpCnt, temp.XCnt)
			error := database.UpdatePlayerRank(temp.ID, i+1)
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
//	@Router			/competition/{id} [delete]
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
//
//	@Summary		get information of all the competitions
//	@Description	get information of all the competitions
//	@Tags			Competition
//	@Produce		json
//	@Success		200	{object}	[]database.Competition	"success"
//	@Failure		500	{object}	string					"internal db error"
//	@Router			/competition [get]
func GetAllCompetition(c *gin.Context) {
	comps, err := database.GetAllCompetition()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"result": "internal db error"})
		return
	}

	c.JSON(http.StatusOK, comps)
}

// Update Competition currentPhase ++ godoc
//
//	@Summary		update one Competition currentPhase ++
//	@Description	update one Competition currentPhase ++
//	@Tags			Competition
//	@Param			id	path	string	true	"Competition ID"
//	@Success		200	string	string
//	@Failure		400	string	string
//	@Router			/competition/currentphaseplus/{id} [put]
func PutCompetitionCurrentPhasePlus(context *gin.Context) {
	id := convert2uint(context, "id")
	/*check data exist*/
	isExist, _ := IsGetOnlyCompetition(context, id)
	if !isExist {
		return
	}
	/*update and check change*/
	err := database.UpdateCompetitionCurrentPhasePlus(id)
	if response.ErrorInternalErrorTest(context, id, "Update Competition CurrentPhase Plus", err) {
		return
	}
	context.IndentedJSON(http.StatusOK, nil)
}

// Update Competition currentPhase -- godoc
//
//	@Summary		update one Competition currentPhase --
//	@Description	update one Competition currentPhase --
//	@Tags			Competition
//	@Param			id	path	string	true	"Competition ID"
//	@Success		200	string	string
//	@Failure		400	string	string
//	@Router			/competition/currentphaseminus/{id} [put]
func PutCompetitionCurrentPhaseMinus(context *gin.Context) {
	id := convert2uint(context, "id")
	/*check data exist*/
	isExist, _ := IsGetOnlyCompetition(context, id)
	if !isExist {
		return
	}
	/*update and check change*/
	err := database.UpdateCompetitionCurrentPhaseMinus(id)
	if response.ErrorInternalErrorTest(context, id, "Update Competition CurrentPhase Minus", err) {
		return
	}
	context.IndentedJSON(http.StatusOK, nil)
}

// Update Competition Qualification currentEnd ++ godoc
//
//	@Summary		update one Competition Qualification currentEnd ++
//	@Description	update one Competition Qualification currentEnd ++
//	@Tags			Competition
//	@Param			id	path	string	true	"Competition ID"
//	@Success		200	string	string
//	@Failure		400	string	string
//	@Router			/competition/qualificationcurrentendplus/{id} [put]
func PutCompetitionQualificationCurrentEndPlus(context *gin.Context) {
	id := convert2uint(context, "id")
	/*check data exist*/
	isExist, _ := IsGetOnlyCompetition(context, id)
	if !isExist {
		return
	}
	fmt.Println("id", id)
	/*update and check change*/
	err := database.UpdateCompetitionQualificationCurrentEndPlus(id)
	if response.ErrorInternalErrorTest(context, id, "Update Competition Qualification CurrentEnd Plus", err) {
		return
	}
	context.IndentedJSON(http.StatusOK, nil)
}

// Update Competition Qualification currentEnd -- godoc
//
//	@Summary		update one Competition Qualification currentEnd --
//	@Description	update one Competition Qualification currentEnd --
//	@Tags			Competition
//	@Param			id	path	string	true	"Competition ID"
//	@Success		200	string	string
//	@Failure		400	string	string
//	@Router			/competition/qualificationcurrentendminus/{id} [put]
func PutCompetitionQualificationCurrentEndMinus(context *gin.Context) {
	id := convert2uint(context, "id")
	/*check data exist*/
	isExist, _ := IsGetOnlyCompetition(context, id)
	if !isExist {
		return
	}
	/*update and check change*/
	err := database.UpdateCompetitionQualificationCurrentEndMinus(id)
	if response.ErrorInternalErrorTest(context, id, "Update Competition Qualification CurrentEnd Minus", err) {
		return
	}
	context.IndentedJSON(http.StatusOK, nil)
}

// Put Competition Qualification Active godoc
//
//	@Summary		update one Competition Qualification Active to be true
//	@Description	update one Competition Qualification Active to be true
//	@Tags			Competition
//	@Success		200	string	string
//	@Failure		400	string	string
//	@Router			/competition/qualificationisactive/{id} [put]
func PutCompetitionQualificationActive(context *gin.Context) {
	id := convert2uint(context, "id")
	/*check data exist*/
	isExist, _ := IsGetOnlyCompetition(context, id)
	if !isExist {
		return
	}
	/*update and check change*/
	isChanged, err := database.UpdateCompetitionQualificationActive(id)
	if response.ErrorInternalErrorTest(context, id, "Update Competition Qualification Active", err) {
		return
	} else if response.AcceptNotChange(context, id, isChanged, "Update Competition Qualification Active") {
		return
	}

	context.IndentedJSON(http.StatusOK, nil)
}

// Put Competition Elimination Active godoc
//
//	@Summary		update one Competition Elimination Active to be true
//	@Description	update one Competition Elimination Active to be true
//	@Tags			Competition
//	@Success		200	string	string
//	@Failure		400	string	string
//	@Router			/competition/eliminationisactive/{id} [put]
func PutCompetitionEliminationActive(context *gin.Context) {
	id := convert2uint(context, "id")
	/*check data exist*/
	isExist, _ := IsGetOnlyCompetition(context, id)
	if !isExist {
		return
	}
	/*update and check change*/
	isChanged, err := database.UpdateCompetitionEliminationActive(id)
	if response.ErrorInternalErrorTest(context, id, "Update Competition Elimination Active", err) {
		return
	} else if response.AcceptNotChange(context, id, isChanged, "Update Elimination Active") {
		return
	}

	context.IndentedJSON(http.StatusOK, nil)
}

// Put Competition Team Elimination Active godoc
//
//	@Summary		update one Competition Team Elimination Active to be true and create all team elimination for groups
//	@Description	update one Competition Team Elimination Active to be true and create all team elimination for groups
//	@Tags			Competition
//	@Success		200	string	string
//	@Failure		400	string	string
//	@Failure		500	string	string
//	@Router			/competition/teameliminationisactive/{id} [put]
func PutCompetitionTeamEliminationActive(context *gin.Context) {
	id := convert2uint(context, "id")
	/*check data exist*/
	isExist, _ := IsGetOnlyCompetition(context, id)
	if !isExist {
		return
	}
	/*update and check change*/
	isChanged, err := database.UpdateCompetitionTeamEliminationActive(id)
	if response.ErrorInternalErrorTest(context, id, "Update Competition Team Elimination Active", err) {
		return
	} else if response.AcceptNotChange(context, id, isChanged, "Update Competition Team Elimination Active") {
		return
	}
	/*get all group ids except Unassigned group*/
	unassignedGroupId := database.GetCompetitionUnassignedGroupId(id)
	groupIds, err := database.GetCompetitionGroupIds(id, unassignedGroupId)
	if response.ErrorInternalErrorTest(context, id, "Get Competition Group Ids when update Competition Team Elimination is Active", err) {
		return
	}
	/*create all team elimination for groups*/
	for _, groupId := range groupIds {
		var newData database.Elimination
		newData.GroupId = groupId
		newData.CurrentEnd = 0
		newData.CurrentStage = 0
		newData.TeamSize = 3
		success, _ := PostEliminationById(context, newData)
		if !success {
			return
		}
	}
	context.IndentedJSON(http.StatusOK, nil)
}

// Put Competition Mixed Elimination Active godoc
//
//	@Summary		update one Competition Mixed Elimination Active to be true and create all mixed elimination for groups
//	@Description	update one Competition Mixed Elimination Active to be true and create all mixed elimination for groups
//	@Tags			Competition
//	@Success		200	string	string
//	@Failure		400	string	string
//	@Failure		500	string	string
//	@Router			/competition/mixedeliminationisactive/{id} [put]
func PutCompetitionMixedEliminationActive(context *gin.Context) {
	id := convert2uint(context, "id")
	/*check data exist*/
	isExist, _ := IsGetOnlyCompetition(context, id)
	if !isExist {
		return
	}
	/*update and check change*/
	isChanged, err := database.UpdateCompetitionMixedEliminationActive(id)
	if response.ErrorInternalErrorTest(context, id, "Update Competition Mixed Elimination Active", err) {
		return
	} else if response.AcceptNotChange(context, id, isChanged, "Update Competition Mixed Elimination Active") {
		return
	}
	/*get all group ids except Unassigned group*/
	unassignedGroupId := database.GetCompetitionUnassignedGroupId(id)
	groupIds, err := database.GetCompetitionGroupIds(id, unassignedGroupId)
	if response.ErrorInternalErrorTest(context, id, "Get Competition Group Ids when update Competition Mixed Elimination is Active", err) {
		return
	}
	/*create all mixed elimination for groups*/
	for _, groupId := range groupIds {
		var newData database.Elimination
		newData.GroupId = groupId
		newData.CurrentEnd = 0
		newData.CurrentStage = 0
		newData.TeamSize = 2
		success, _ := PostEliminationById(context, newData)
		if !success {
			return
		}
	}
	context.IndentedJSON(http.StatusOK, nil)
}

// update competition recount player total score godoc
//
//	@Summary		update competition recount player total score
//	@Description	update competition recount player total score
//	@Tags			Competition
//	@Produce		json
//	@Param			id	path	string	true	"Competition ID"
//	@Success		200	string	string
//	@Failure		400	string	string
//	@Failure		500	string	string
//	@Router			/competition//groups/players/playertotal/{id} [put]
func UpdateCompetitionRecountPlayerTotalScore(context *gin.Context) {
	id := convert2uint(context, "id")
	/*check data exist*/
	if response.ErrorIdTest(context, id, database.GetCompetitionIsExist(id), "Competition") {
		return
	}
	competition, err := database.GetCompetitionWGroupsPlayersScores(id)
	if response.ErrorInternalErrorTest(context, id, "Get Competition with Groups Players Scores", err) {
		return
	}

	/*update and check change*/
	for _, group := range competition.Groups {
		for _, player := range group.Players {
			var newPlayerTotalScore int
			for _, round := range player.Rounds {
				var newRoundTotalScore int
				for _, end := range round.RoundEnds {
					for _, arrow := range end.RoundScores {
						fmtScore := scorefmt(arrow.Score)
						newRoundTotalScore += fmtScore
					}
				}
				newPlayerTotalScore += newRoundTotalScore
				/*update round total score*/
				err := database.UpdatePlayerRoundTotalScore(round.ID, newRoundTotalScore)
				if response.ErrorInternalErrorTest(context, id, "Update Round Total Score", err) {
					return
				}
			}
			/*update player total score*/
			err := database.UpdatePlayerTotalScore(player.ID, newPlayerTotalScore)
			if response.ErrorInternalErrorTest(context, id, "Update Player Total Score", err) {
				return
			}
		}
	}
	context.IndentedJSON(http.StatusOK, nil)
}
