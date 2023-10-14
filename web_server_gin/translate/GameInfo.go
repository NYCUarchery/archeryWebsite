package translate

import (
	"fmt"
	"net/http"
	"web_server_gin/database"

	"github.com/gin-gonic/gin"
)

func GetOnlyGameInfoByID(context *gin.Context) {
	data := database.GetOnlyGameInfo(convert2int(context, "id"))
	if data.ID == 0 {
		context.IndentedJSON(http.StatusBadRequest, gin.H{"error": "無效的用戶 ID"})
		return
	}
	fmt.Println("GameInfo with ID(", context.Param("id"), ") -> ", data)

	context.IndentedJSON(http.StatusOK, data)
}

func PostGameInfo(context *gin.Context) {
	data := database.GameInfo{}
	err := context.BindJSON(&data)
	if err != nil {
		context.IndentedJSON(http.StatusBadRequest, "error : "+err.Error())
		return
	}
	newData := database.PostGameInfo(data)
	context.IndentedJSON(http.StatusOK, newData)
}

func UpdateGameInfo(context *gin.Context) {
	data := database.GameInfo{}
	err := context.BindJSON(&data)
	if err != nil {
		context.IndentedJSON(http.StatusBadRequest, "error : "+err.Error())
		return
	}
	newData := database.UpdateGameInfo(convert2int(context, "id"), data)
	if newData.Title == "" {
		context.IndentedJSON(http.StatusInternalServerError, "error : "+err.Error())
		return
	}
	context.IndentedJSON(http.StatusOK, newData)
}

func DeleteGameInfo(context *gin.Context) {
	if !database.DeleteGameInfo(convert2int(context, "id")) {
		context.IndentedJSON(http.StatusBadRequest, gin.H{"error": "無效的用戶 ID 或 格式錯誤 "})
		return
	}
	context.IndentedJSON(http.StatusOK, "success")
}
