package endpoint

import (
	"backend/internal/database"
	response "backend/internal/response"
	"fmt"
	"net/http"
	"time"

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
//	@Router			/api/competition/{id} [get]
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
//	@Router			/api/competition/groups/{id} [get]
func GetCompetitionWGroupsByID(context *gin.Context) {
	id := convert2int(context, "id")
	isExist, data := IsGetCompetitionWGroup(context, id)
	if !isExist {
		return
	}
	context.IndentedJSON(http.StatusOK, data)
}

// Get Competition with Groups Qualification Elimination By ID godoc
//
//	@Summary		Show one Competition with Groups Qualification Elimination
//	@Description	Get one Competition by id with related Groups which have related one Qualification id and many Elimination ids
//	@Tags			Competition
//	@Produce		json
//	@Param			id	path	int	true	"Competition ID"
//	@Success		200	string	string
//	@Failure		400	string	string
//	@Router			/api/competition/groups/qualieli/{id} [get]
func GetCompetitionWGroupsQuaEliByID(context *gin.Context) {
	type EliminationData struct {
		EliminationId uint `json:"elimination_id"`
		TeamSize      int  `json:"team_size"`
	}
	type GroupData struct {
		GroupId          uint              `json:"group_id"`
		GroupName        string            `json:"group_name"`
		GroupRange       string            `json:"group_range"`
		BowType          string            `json:"bow_type"`
		EliminationDatas []EliminationData `json:"elimination_datas"`
	}
	type CompetitionWGroupsQuaEliData struct {
		CompetitionId uint        `json:"competition_id"`
		GroupDatas    []GroupData `json:"group_datas"`
	}
	var data CompetitionWGroupsQuaEliData
	id := convert2int(context, "id")
	isExist, _ := IsGetOnlyCompetition(context, id)
	if !isExist {
		return
	}
	data.CompetitionId = uint(id)
	/*get all group ids except Unassigned group*/
	unassignedGroupId := database.GetCompetitionNoTypeGroupId(id)
	groupIds, err := database.GetCompetitionGroupIds(uint(id), uint(unassignedGroupId))
	if response.ErrorInternalErrorTest(context, id, "Get Competition Group Ids when get Competition with Groups Qualification Elimination", err) {
		return
	}
	for index, groupId := range groupIds {
		isExist, groupData := IsGetGroupInfo(context, int(groupId))
		if !isExist {
			return
		}
		var groupdata GroupData
		groupdata.GroupId = groupData.ID
		groupdata.GroupName = groupData.GroupName
		groupdata.GroupRange = groupData.GroupRange
		groupdata.BowType = groupData.BowType
		data.GroupDatas = append(data.GroupDatas, groupdata)
		eliminationDatas, err := database.GetEliminationByGroupId(groupId)
		if response.ErrorInternalErrorTest(context, id, "Get Elimination By Group Id when get Competition with Groups Qualification Elimination", err) {
			return
		}
		for _, eliminationData := range eliminationDatas {
			var eliminationdata EliminationData
			eliminationdata.EliminationId = eliminationData.ID
			eliminationdata.TeamSize = eliminationData.TeamSize
			data.GroupDatas[index].EliminationDatas = append(data.GroupDatas[index].EliminationDatas, eliminationdata)
		}
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
//	@Router			/api/competition [post]
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
	data.Date = time.Now()
	data.CurrentPhase = 0
	data.QualificationCurrentEnd = 0
	newData, err := database.PostCompetition(data)
	newId := int(newData.ID)
	if response.ErrorInternalErrorTest(context, newId, "Post Competition", err) {
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
//	@Router			/api/competition/whole/{id} [put]
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
//	@Router			/api/competition/{id} [delete]
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
//	@Router			/api/competition/currentphaseplus/{id} [put]
func PutCompetitionCurrentPhasePlus(context *gin.Context) {
	id := convert2int(context, "id")
	/*check data exist*/
	isExist, _ := IsGetOnlyCompetition(context, id)
	if !isExist {
		return
	}
	/*update and check change*/
	err := database.UpdateCompetitionCurrentPhasePlus(uint(id))
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
//	@Router			/api/competition/currentphaseminus/{id} [put]
func PutCompetitionCurrentPhaseMinus(context *gin.Context) {
	id := convert2int(context, "id")
	/*check data exist*/
	isExist, _ := IsGetOnlyCompetition(context, id)
	if !isExist {
		return
	}
	/*update and check change*/
	err := database.UpdateCompetitionCurrentPhaseMinus(uint(id))
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
//	@Router			/api/competition/qualificationcurrentendplus/{id} [put]
func PutCompetitionQualificationCurrentEndPlus(context *gin.Context) {
	id := convert2int(context, "id")
	/*check data exist*/
	isExist, _ := IsGetOnlyCompetition(context, id)
	if !isExist {
		return
	}
	fmt.Println("id", id)
	/*update and check change*/
	err := database.UpdateCompetitionQualificationCurrentEndPlus(uint(id))
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
//	@Router			/api/competition/qualificationcurrentendminus/{id} [put]
func PutCompetitionQualificationCurrentEndMinus(context *gin.Context) {
	id := convert2int(context, "id")
	/*check data exist*/
	isExist, _ := IsGetOnlyCompetition(context, id)
	if !isExist {
		return
	}
	/*update and check change*/
	err := database.UpdateCompetitionQualificationCurrentEndMinus(uint(id))
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
//	@Router			/api/competition/qualificationisactive/{id} [put]
func PutCompetitionQualificationActive(context *gin.Context) {
	id := convert2int(context, "id") // need review after player merged
	/*check data exist*/
	isExist, _ := IsGetOnlyCompetition(context, id)
	if !isExist {
		return
	}
	/*update and check change*/
	isChanged, err := database.UpdateCompetitionQualificationActive(uint(id))
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
//	@Router			/api/competition/eliminationisactive/{id} [put]
func PutCompetitionEliminationActive(context *gin.Context) {
	id := convert2int(context, "id") // need review after player merged
	/*check data exist*/
	isExist, _ := IsGetOnlyCompetition(context, id)
	if !isExist {
		return
	}
	/*update and check change*/
	isChanged, err := database.UpdateCompetitionEliminationActive(uint(id))
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
//	@Router			/api/competition/teameliminationisactive/{id} [put]
func PutCompetitionTeamEliminationActive(context *gin.Context) {
	id := convert2int(context, "id") // need review after player merged
	/*check data exist*/
	isExist, _ := IsGetOnlyCompetition(context, id)
	if !isExist {
		return
	}
	/*update and check change*/
	isChanged, err := database.UpdateCompetitionTeamEliminationActive(uint(id))
	if response.ErrorInternalErrorTest(context, id, "Update Competition Team Elimination Active", err) {
		return
	} else if response.AcceptNotChange(context, id, isChanged, "Update Competition Team Elimination Active") {
		return
	}
	/*get all group ids except Unassigned group*/
	unassignedGroupId := database.GetCompetitionNoTypeGroupId(id)
	groupIds, err := database.GetCompetitionGroupIds(uint(id), uint(unassignedGroupId))
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
//	@Router			/api/competition/mixedeliminationisactive/{id} [put]
func PutCompetitionMixedEliminationActive(context *gin.Context) {
	id := convert2int(context, "id") // need review after player merged
	/*check data exist*/
	isExist, _ := IsGetOnlyCompetition(context, id)
	if !isExist {
		return
	}
	/*update and check change*/
	isChanged, err := database.UpdateCompetitionMixedEliminationActive(uint(id))
	if response.ErrorInternalErrorTest(context, id, "Update Competition Mixed Elimination Active", err) {
		return
	} else if response.AcceptNotChange(context, id, isChanged, "Update Competition Mixed Elimination Active") {
		return
	}
	/*get all group ids except Unassigned group*/
	unassignedGroupId := database.GetCompetitionNoTypeGroupId(id)
	groupIds, err := database.GetCompetitionGroupIds(uint(id), uint(unassignedGroupId))
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
