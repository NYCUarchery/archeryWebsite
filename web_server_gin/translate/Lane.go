package translate

import (
	"fmt"
	"web_server_gin/database"
	response "web_server_gin/translate/Response"

	"github.com/gin-gonic/gin"
)

func IsGetLane(context *gin.Context, id int) (bool, database.Lane) {
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

// Get One Lane By ID godoc
//
//	@Summary		Show one Lane
//	@Description	Get one Lane by id
//	@Tags			Lane
//	@Produce		json
//	@Param			id	path	int	true	"Lane ID"
//	@Success		200	string	string
//	@Failure		400	string	string
//	@Router			/data/lane/{id} [get]
func GetLaneByID(context *gin.Context) {
	id := convert2int(context, "id")
	isExist, data := IsGetLane(context, id)
	if !isExist {
		return
	}
	context.IndentedJSON(200, data)
}

// Get One Lane By ID godoc
//
//	@Summary		Show all Lane of a competition
//	@Description	Get all Lane by competition id
//	@Tags			Lane
//	@Produce		json
//	@Param			id	path	int	true	"competition ID"
//	@Success		200	string	string
//	@Failure		400	string	string
//	@Router			/data/lane/all/{id} [get]
func GetAllLaneByCompetitionId(context *gin.Context) {
	competitionId := convert2int(context, "id")
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
func PostLaneThroughCompetition(context *gin.Context, competitionId int, laneNumber int) bool {
	var data database.Lane
	/*set competition ID*/
	/*set qualification ID = 0*/
	/*set player num = 0*/
	/*set LaneNumber*/
	data.CompetitionId = uint(competitionId)
	data.QualificationId = 0
	data.PlayerNum = 0
	data.LaneNumber = laneNumber
	/*insert data*/
	data, err := database.PostLane(data)
	landId := int(data.ID)
	if response.ErrorInternalErrorTest(context, landId, "Post Lane through competition", err) {
		return false
	}
	response.AcceptPrint(landId, fmt.Sprint(data), "Lane")
	return true
}

// lane need to update qualification id
func UpdateLaneQualificationId(context *gin.Context, id int, qualificationId int) bool {
	/*update data*/
	err := database.UpdateLaneQualificationId(id, qualificationId)
	if response.ErrorInternalErrorTest(context, id, "Update Lane Qualification", err) {
		return false
	}
	response.AcceptPrint(id, fmt.Sprintf("id = %v, qualificationID = %v", id, qualificationId), "Lane")
	return true
}

// lane need to update player num
func UpdateLanePlayerNumAddOne(context *gin.Context, laneId int) bool {
	var data database.Lane
	/*set player num*/
	data.PlayerNum++
	/*update data*/
	_, err := database.UpdateLane(laneId, data)
	if response.ErrorInternalErrorTest(context, laneId, "Update Lane Player Num", err) {
		return false
	}
	response.AcceptPrint(laneId, fmt.Sprint(data), "Lane")
	return true
}

func UpdateLanePlayerNumMinusOne(context *gin.Context, laneId int) bool {
	var data database.Lane
	/*set player num*/
	data.PlayerNum--
	/*update data*/
	_, err := database.UpdateLane(laneId, data)
	if response.ErrorInternalErrorTest(context, laneId, "Update Lane Player Num", err) {
		return false
	}
	response.AcceptPrint(laneId, fmt.Sprint(data), "Lane")
	return true
}

// lane is deleted when competition is deleted
func DeleteLaneByCompetitionId(context *gin.Context, competitionId int) bool {
	/*delete data*/
	err := database.DeleteLane(competitionId)
	if response.ErrorInternalErrorTest(context, competitionId, "Delete Qualification", err) {
		return false
	}
	response.AcceptPrint(competitionId, fmt.Sprint(competitionId), "Qualification")
	return true
}
