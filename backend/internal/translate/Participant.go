package translate

import (
	"backend/internal/database"
	response "backend/internal/translate/Response"
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
)

func IsGetParticipant(context *gin.Context, id uint) (bool, database.Participant) {
	if response.ErrorIdTest(context, id, database.GetParticipantIsExist(id), "Participant") {
		return false, database.Participant{}
	}
	data, err := database.GetParticipant(id)
	if response.ErrorInternalErrorTest(context, id, "Get Participant", err) {
		return false, data
	}
	response.AcceptPrint(id, fmt.Sprint(data), "Participant")
	return true, data
}

// Get One Participant By ID godoc
//
//	@Summary		Show One Participant By ID
//	@Description	Get One Participant By ID
//	@Tags			Participant
//	@Produce		json
//	@Param			id	path	int	true	"Participant ID"
//	@Success		200	string	string
//	@Failure		400	string	string
//	@Router			/api/participant/{id} [get]
func GetParticipant(context *gin.Context) {
	id := convert2uint(context, "id")
	isExist, data := IsGetParticipant(context, id)
	if !isExist {
		return
	}
	context.IndentedJSON(http.StatusOK, data)
}

// Post Participant godoc
//
//	@Summary		Create one Participant
//	@Description	Post one new Participant data with new id
//	@Tags			Participant
//	@Accept			json
//	@Produce		json
//	@Param			Participant	body	string	true	"Participant"
//	@Success		200			string	string
//	@Failure		400			string	string
//	@Router			/api/participant [post]
func PostParticipant(context *gin.Context) {
	var data database.Participant
	err := context.BindJSON(&data)
	if response.ErrorReceiveDataTest(context, 0, "Create Participant", err) {
		return
	} else if response.ErrorIdTest(context, data.CompetitionID, database.GetCompetitionIsExist(data.CompetitionID), "Get competition when post Participant ") {
		return
	} else if response.ErrorIdTest(context, data.UserID, database.GetUserIsExist(data.UserID), "Get user when post Participant ") {
		return
	}
	data, err = database.CreateParticipant(data)
	if response.ErrorInternalErrorTest(context, data.ID, "Post User", err) {
		return
	}
	/*check if competition id is exist*/
	competitionId := data.CompetitionID
	if response.ErrorIdTest(context, competitionId, database.GetCompetitionIsExist(competitionId), "Competition when post Participant ") {
		return
	}
	/*check if User id is exist*/
	userId := data.UserID
	if response.ErrorIdTest(context, userId, database.GetUserIsExist(userId), "User when post Participant ") {
		return
	}
	id := data.ID
	IsExist, newData := IsGetParticipant(context, id)
	if !IsExist {
		return
	}
	response.AcceptPrint(id, fmt.Sprint(newData), "Participant")
	context.IndentedJSON(http.StatusOK, newData)
}

// Update Participant godoc
//
//	@Summary		update one Participant
//	@Description	Put whole new Participant and overwrite with the id
//	@Tags			Participant
//	@Accept			json
//	@Produce		json
//	@Param			id			path	string	true	"Participant ID"
//	@Param			Participant	body	string	true	"Participant"
//	@Success		200			string	string
//	@Failure		400			string	string
//	@Failure		404			string	string
//	@Failure		500			string	string
//	@Router			/api/participant/whole/{id} [put]
func UpdateParticipant(context *gin.Context) {
	var data database.Participant
	err := context.BindJSON(&data)
	id := convert2uint(context, "id")
	if response.ErrorReceiveDataTest(context, id, "Participant", err) {
		return
	}
	if response.ErrorIdTest(context, id, database.GetParticipantIsExist(id), "Participant") {
		return
	}
	success, err := database.UpdateParticipant(id, data)
	if response.ErrorInternalErrorTest(context, id, "Update Participant", err) {
		return
	} else if !success {
		response.ErrorIdTest(context, id, success, "Participant")
		return
	}

	IsExist, newdata := IsGetParticipant(context, id)
	if !IsExist {
		return
	}
	response.AcceptPrint(id, fmt.Sprint(newdata), "Participant")
	context.IndentedJSON(http.StatusOK, newdata)
}

// Delete Participant by id godoc
//
//	@Summary		delete one Participant
//	@Description	delete one Participant by id
//	@Tags			Participant
//	@Accept			json
//	@Produce		json
//	@Param			id	path	string	true	"Participant ID"
//	@Success		200	string	string
//	@Failure		400	string	string
//	@Failure		404	string	string
//	@Router			/api/participant/{id} [delete]
func DeleteParticipantById(context *gin.Context) {
	id := convert2uint(context, "id")
	DeleteParticipaint(context, id)
}

func DeleteParticipaint(context *gin.Context, id uint) bool {
	if response.ErrorIdTest(context, id, database.GetParticipantIsExist(id), "Participant") {
		return false
	}
	success, err := database.DeleteParticipant(id)
	if response.ErrorInternalErrorTest(context, id, "Delete Participant", err) {
		return false
	} else if !success {
		response.ErrorIdTest(context, id, success, "Participant")
		return false
	}
	response.AcceptDeleteSuccess(context, id, success, "Participant")
	return true
}
