package endpoint

import (
	"backend/internal/database"
	response "backend/internal/response"
	"fmt"

	"github.com/gin-gonic/gin"
)

func IsGetLane(context *gin.Context, id uint) (bool, database.Lane) {
	if response.ErrorIdTest(context, id, database.GetLaneIsExist(id), "Lane") {
		return false, database.Lane{}
	}
	data, err := database.GetLaneById(id)
	if response.ErrorInternalErrorTest(context, id, "Get Lane", err) {
		return false, data
	}
	response.AcceptPrint(id, fmt.Sprint(data), "Lane")
	return true, data
}

func IsGetLaneWPlayers(context *gin.Context, id uint) (bool, database.Lane) {
	if response.ErrorIdTest(context, id, database.GetLaneIsExist(id), "Lane") {
		return false, database.Lane{}
	}
	data, err := database.GetLaneWScoresById(id)
	if response.ErrorInternalErrorTest(context, id, "Get Lane with players, round, scores", err) {
		return false, data
	}
	response.AcceptPrint(id, fmt.Sprint(data), "Lane with players, round, scores")
	return true, data
}

// Get One Lane By ID godoc
//
//	@Summary		Show one Lane
//	@Description	Get one Lane by id
//	@Tags			Lane
//	@Produce		json
//	@Param			id	path	int	true	"Lane ID"
//	@Success		200	string	string
//	@Failure		400	string	string
//	@Router			/api/lane/{id} [get]
func GetLaneByID(context *gin.Context) {
	id := Convert2uint(context, "id")
	isExist, data := IsGetLane(context, id)
	if !isExist {
		return
	}
	context.IndentedJSON(200, data)
}

// Get One Lane with players, rounds, roundends, roundscores By ID godoc
//
//	@Summary		Show one Lane with players, rounds, roundends, roundscores
//	@Description	Get one Lane with players, rounds, roundends, roundscores by id
//	@Tags			Lane
//	@Produce		json
//	@Param			id	path	int	true	"Lane ID"
//	@Success		200	string	string
//	@Failure		400	string	string
//	@Router			/api/lane/scores/{id} [get]
func GetLaneWScoresByID(context *gin.Context) {
	id := Convert2uint(context, "id")
	isExist, data := IsGetLaneWPlayers(context, id)
	if !isExist {
		return
	}
	context.IndentedJSON(200, data)
}

// Get All Lane By Competition ID godoc
//
//	@Summary		Show all Lane of a competition
//	@Description	Get all Lane by competition id
//	@Tags			Lane
//	@Produce		json
//	@Param			id	path	int	true	"competition ID"
//	@Success		200	string	string
//	@Failure		400	string	string
//	@Router			/api/lane/all/{id} [get]
func GetAllLaneByCompetitionId(context *gin.Context) {
	competitionId := Convert2uint(context, "competitionid")
	var data []database.Lane
	/*get data*/
	data, err := database.GetAllLaneByCompetitionId(competitionId)
	if response.ErrorInternalErrorTest(context, competitionId, "Get All Lane By Competition ID", err) {
		return
	} else if len(data) == 0 {
		response.ErrorIdTest(context, competitionId, false, "Lane")
		return
	}
	response.AcceptPrint(competitionId, fmt.Sprint(data), "Lane")
	context.IndentedJSON(200, data)
}

// when competition is created, lane is created
// unassignedLane with LaneNumber == 0
func PostLaneThroughCompetition(context *gin.Context, competitionId uint, unassignedGroupId uint, laneNumber int) bool {
	var data database.Lane
	/*set competition ID*/
	/*set qualification ID = 無組別id*/
	/*set player num = 0*/
	/*set LaneNumber*/
	data.CompetitionId = competitionId
	data.QualificationId = unassignedGroupId
	data.LaneNumber = laneNumber
	/*insert data*/
	data, err := database.PostLane(data)
	landId := data.ID
	if response.ErrorInternalErrorTest(context, landId, "Post Lane through competition", err) {
		return false
	}
	response.AcceptPrint(landId, fmt.Sprint(data), "Lane")
	return true
}

// lane need to update qualification id
// unassignedLane cannot be updated
func UpdateLaneQualificationId(context *gin.Context, id uint, qualificationId uint) bool {
	IsExist, data := IsGetLane(context, id)
	/*check unassignedLane*/
	if !IsExist {
		response.ErrorIdTest(context, id, IsExist, "Lane")
		return false
	} else if data.LaneNumber == 0 {
		response.ErrorIdTest(context, id, false, "Lane unassignedLane cannot be updated")
		return false
	}
	/*update data*/
	err := database.UpdateLaneQualificationId(id, qualificationId)
	if response.ErrorInternalErrorTest(context, id, "Update Lane Qualification", err) {
		return false
	}
	response.AcceptPrint(id, fmt.Sprintf("id = %v, qualificationID = %v", id, qualificationId), "Lane")
	return true
}

// lane is deleted when competition is deleted
func DeleteLaneByCompetitionId(context *gin.Context, competitionId uint) bool {
	/*delete data*/
	err := database.DeleteLaneByCompetitionId(competitionId)
	if response.ErrorInternalErrorTest(context, competitionId, "Delete Lane by competition ", err) {
		return false
	}
	response.AcceptPrint(competitionId, fmt.Sprint(competitionId), "Delete Lane by competition")
	return true
}
