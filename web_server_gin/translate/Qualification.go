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

// group share id with qualification
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

// cannot replace groupid
func UpdateQualificationByID(context *gin.Context) {
	var data database.Qualification
	err := context.BindJSON(&data)
	id := int(data.ID)
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
