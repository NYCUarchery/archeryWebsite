package translate

import (
	"fmt"
	"net/http"
	"web_server_gin/database"

	"github.com/gin-gonic/gin"
)

func GetOnlyCompetitionByID(context *gin.Context) {
	data, error := database.GetOnlyCompetition(convert2int(context, "id"))
	if data.ID == 0 {
		context.IndentedJSON(http.StatusBadRequest, gin.H{"error": "無效的用戶 ID"})
		return
	} else if error != nil {
		context.IndentedJSON(http.StatusInternalServerError, gin.H{"error": error.Error()})
		return
	}
	fmt.Println("Competition with ID(", context.Param("id"), ") -> ", data)
	context.IndentedJSON(http.StatusOK, data)
}

func GetCompetitionWGroupsByID(context *gin.Context) {
	data := database.GetCompetitionWGroups(convert2int(context, "id"))
	if data.ID == 0 {
		context.IndentedJSON(http.StatusBadRequest, gin.H{"error": "無效的用戶 ID"})
		return
	}
	fmt.Println("Competition with ID(", context.Param("id"), ") -> ", data)
	context.IndentedJSON(http.StatusOK, data)
}

func PostCompetition(context *gin.Context) {
	data := database.Competition{}
	err := context.BindJSON(&data)
	if err != nil {
		context.IndentedJSON(http.StatusBadRequest, "error : "+err.Error())
		return
	}
	data.Groups_num = 0
	newData := database.PostCompetition(data)
	context.IndentedJSON(http.StatusOK, newData)
}

func UpdateCompetition(context *gin.Context) {
	data := database.Competition{}
	id := convert2int(context, "id")
	err := context.BindJSON(&data)
	if err != nil {
		context.IndentedJSON(http.StatusBadRequest, "error : "+err.Error())
		return
	}
	data.Groups_num = database.GetCompetitionGroupNum(id)
	newData, error := database.UpdateCompetition(id, data)
	if newData.Title == "" {
		context.IndentedJSON(http.StatusInternalServerError, "error : "+err.Error())
		return
	} else if error != nil {
		context.IndentedJSON(http.StatusInternalServerError, "error : "+error.Error())
		return
	}
	context.IndentedJSON(http.StatusOK, newData)
}

func DeleteCompetition(context *gin.Context) {
	if !database.DeleteCompetition(convert2int(context, "id")) {
		context.IndentedJSON(http.StatusBadRequest, gin.H{"error": "無效的用戶 ID 或 格式錯誤 "})
		return
	}
	context.IndentedJSON(http.StatusOK, "success")
}
