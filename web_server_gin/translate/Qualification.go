package translate

import (
	"fmt"
	"net/http"
	"web_server_gin/database"
	response "web_server_gin/translate/Response"

	"github.com/gin-gonic/gin"
)

func IsGetQualification(context *gin.Context, id int) (bool, database.Qualification) {
	if response.ErrorIdTest(context, id, database.GetQualificationIsExist(id), "Qualification") {
		return false, database.Qualification{}
	}
	data, err := database.GetQualification(id)
	if response.ErrorInternalErrorTest(context, id, "Get Qualification", err) {
		return false, data
	}
	response.AcceptPrint(id, fmt.Sprint(data), "Qualification")
	return true, data
}

// Get One Qualification By ID godoc
//
//	@Summary		Show one Qualification
//	@Description	Get one Qualification by id
//	@Tags			Qualification
//	@Produce		json
//	@Param			id	path	int	true	"Qualification ID"
//	@Success		200	string	string
//	@Failure		400	string	string
//	@Router			/data/qualification/{id} [get]
func GetQualificationByID(context *gin.Context) {
	id := convert2int(context, "id")
	isExist, data := IsGetQualification(context, id)
	if !isExist {
		return
	}
	context.IndentedJSON(http.StatusOK, data)
}

// when group is created, qualification is created
// share same id with group
func PostQualificationThroughGroup(context *gin.Context, id int) bool {
	var data database.Qualification
	/*insert data*/
	data, err := database.PostQualification(data)
	if response.ErrorInternalErrorTest(context, id, "Post Qualification", err) {
		return false
	}
	response.AcceptPrint(id, fmt.Sprint(data), "Qualification")
	return true
}

// Update Qualification godoc
//
//	@Summary		update one Qualification
//	@Description	Put whole new Qualification and overwrite with the id, but cannot replace groupid
//	@Tags			Qualification
//	@Accept			json
//	@Produce		json
//	@Param			id			path	string	true	"Qualification ID"
//	@Param			Qualification	body	string	true	"Qualification"
//	@Success		200			string	string
//	@Failure		400			string	string
//	@Failure		404			string	string
//	@Failure		500			string	string
//	@Router			/data/qualification/whole/{id} [put]
func UpdateQualificationByID(context *gin.Context) {
	var data database.Qualification
	err := context.BindJSON(&data)
	id := convert2int(context, "id")
	/*parse data check*/
	if response.ErrorReceiveDataTest(context, id, "Qualification", err) {
		return
	} else if response.ErrorIdTest(context, id, database.GetQualificationIsExist(id), "Qualification") {
		return
	}
	/*update data*/
	isChanged, err := database.UpdateQualification(id, data)
	if response.ErrorInternalErrorTest(context, id, "Update Qualification", err) {
		return
	} else if response.ErrorIdTest(context, id, isChanged, "Qualification") {
		return
	}
	/*return data*/
	data, err = database.GetQualification(id)
	if response.ErrorInternalErrorTest(context, id, "Get Qualification", err) {
		return
	}
	response.AcceptPrint(id, fmt.Sprint(data), "Qualification")
	context.IndentedJSON(http.StatusOK, data)
}

// delete qualification when group is deleted
// cannot delete qualification solely
func DeleteQualificationThroughGroup(context *gin.Context, id int) bool {
	/*delete data*/
	isChanged, err := database.DeleteQualification(id)
	if response.ErrorInternalErrorTest(context, id, "Delete Qualification", err) {
		return false
	} else if !isChanged {
		response.AcceptNotChange(context, id, isChanged, "Qualification")
		return false
	}

	response.AcceptPrint(id, fmt.Sprint(id), "Qualification")
	return true
}
