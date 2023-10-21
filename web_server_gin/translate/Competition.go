package translate

import (
	"fmt"
	"net/http"
	"web_server_gin/database"
	response "web_server_gin/translate/Response"

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

func GetOnlyCompetitionByID(context *gin.Context) {
	id := convert2int(context, "id")
	isExist, data := IsGetOnlyCompetition(context, id)
	if !isExist {
		return
	}
	context.IndentedJSON(http.StatusOK, data)
}

func GetCompetitionWGroupsByID(context *gin.Context) {
	id := convert2int(context, "id")
	isExist, data := IsGetCompetitionWGroup(context, id)
	if !isExist {
		return
	}
	context.IndentedJSON(http.StatusOK, data)
}

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
	/*auto write Groups_num*/
	data.Groups_num = 0

	newData, err := database.PostCompetition(data)
	if response.ErrorInternalErrorTest(context, id, "Post GroupInfo", err) {
		return
	}
	context.IndentedJSON(http.StatusOK, newData)
}

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

	/*replace GroupNum with old one*/
	data.Groups_num = database.GetCompetitionGroupNum(id)
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

func DeleteCompetition(context *gin.Context) {
	id := convert2int(context, "id")
	/*check data exist*/
	isExist, data := IsGetCompetitionWGroup(context, id)
	if !isExist {
		return
	}
	/*delete all related groups*/
	for _, group := range data.Groups {
		_, err := database.DeleteGroupInfo(int(group.ID))
		if response.ErrorInternalErrorTest(context, int(group.ID), "Delete GroupInfo in Competition", err) {
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
