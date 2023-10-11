package translate

import (
	"fmt"
	"net/http"
	"web_server_gin/database"

	"github.com/gin-gonic/gin"
)

func GetGroupInfoByID(context *gin.Context) {
	id := convert2int(context, "id")
	data, error := database.GetGroupInfoById(id)
	if data.ID == 0 {
		context.IndentedJSON(http.StatusBadRequest, gin.H{"error": "無效的用戶 ID"})
		return
	} else if error != nil {
		context.IndentedJSON(http.StatusInternalServerError, gin.H{"error": error.Error()})
		return
	}
	fmt.Printf("GroupInfo with ID(%v) -> %v\n", id, data)

	context.IndentedJSON(http.StatusOK, data)
}

// func GetGroupInfosByCompetitionID(context *gin.Context) {
// 	id := convert2int(context, "id")
// 	data, error := database.GetGroupInfos(id)
// 	if error != nil {
// 		context.IndentedJSON(http.StatusInternalServerError, gin.H{"error": error.Error()})
// 		return
// 	}
// 	fmt.Printf("GroupInfos with CompetitionID(%v) -> %v\n", id, data)

// 	context.IndentedJSON(http.StatusOK, data)
// }

func PostGroupInfo(context *gin.Context) {
	var data database.GroupInfo
	err := context.BindJSON(&data)
	if err != nil {
		context.IndentedJSON(http.StatusBadRequest, "error : "+err.Error())
		return
	}
	newData, error := database.CreateGroupInfo(data)
	if newData.ID == 0 {
		context.IndentedJSON(http.StatusBadRequest, gin.H{"error": "無效的用戶 ID"})
		return
	} else if error != nil {
		context.IndentedJSON(http.StatusInternalServerError, gin.H{"error": error.Error()})
		return
	}
	context.IndentedJSON(http.StatusOK, newData)
}

func UpdateGroupInfo(context *gin.Context) {
	var data database.GroupInfo
	id := convert2int(context, "id")
	data.ID = uint(id)
	err := context.BindJSON(&data)
	if err != nil {
		context.IndentedJSON(http.StatusBadRequest, "error : "+err.Error())
		return
	}
	newData, error := database.UpdateGroupInfo(id, data)
	if newData.ID == 0 {
		context.IndentedJSON(http.StatusBadRequest, gin.H{"error": "無效的用戶 ID"})
		return
	} else if error != nil {
		context.IndentedJSON(http.StatusInternalServerError, gin.H{"error": error.Error()})
		return
	}
	context.IndentedJSON(http.StatusOK, newData)
}

func DeleteGroupInfo(context *gin.Context) {
	id := convert2int(context, "id")
	affected, error := database.DeleteGroupInfo(id)
	if !affected {
		context.IndentedJSON(http.StatusBadRequest, gin.H{"error": "無效的用戶 ID 或 格式錯誤 "})
		return
	} else if error != nil {
		context.IndentedJSON(http.StatusInternalServerError, gin.H{"error": error.Error()})
		return
	}
	context.IndentedJSON(http.StatusOK, gin.H{"message": "成功刪除用戶"})
}
