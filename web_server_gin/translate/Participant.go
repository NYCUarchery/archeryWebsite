package translate

import (
	"fmt"
	"net/http"
	"web_server_gin/database"
	response "web_server_gin/translate/Response"

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

func GetParticipant(context *gin.Context) {
	id := convert2uint(context, "id")
	isExist, data := IsGetParticipant(context, id)
	if !isExist {
		return
	}
	context.IndentedJSON(http.StatusOK, data)
}

func PostParticipant(context *gin.Context) {
	var data database.Participant
	err := context.BindJSON(&data)
	if response.ErrorReceiveDataTest(context, 0, "Participant", err) {
		return
	}
	data, err = database.CreateParticipant(data)
	if response.ErrorInternalErrorTest(context, 0, "Post User", err) {
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

func DeleteParticipant(context *gin.Context) {
	id := convert2uint(context, "id")
	if response.ErrorIdTest(context, id, database.GetParticipantIsExist(id), "Participant") {
		return
	}
	success, err := database.DeleteParticipant(id)
	if response.ErrorInternalErrorTest(context, id, "Delete Participant", err) {
		return
	} else if !success {
		response.ErrorIdTest(context, id, success, "Participant")
		return
	}
	response.AcceptDeleteSuccess(context, id, success, "Participant")
}
