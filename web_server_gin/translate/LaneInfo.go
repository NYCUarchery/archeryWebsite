package translate

import (
	"fmt"
	"net/http"
	"web_server_gin/database"

	"github.com/gin-gonic/gin"
)

func loadLaneInfo(data *database.LaneData) {
	/* save UserIds indexing */
	for index, user := range data.UserIds {
		user.UserIndex = uint(index)
	}
	/* save LaneStage indexing*/
	for index, laneStage := range data.Stages {
		laneStage.StageIndex = uint(index)
		/*save LaneStage.EndScores*/
		for end_index, end := range laneStage.EndScores {
			end.UserIndex = uint(end_index)
			/*save EndScores.AllScres */
			for all_index, all := range end.AllScores {
				all.ArrowIndex = uint(all_index)
			}
		}
		/*save LaneStage.Comfirmations*/
		for confirm_index, confirm := range laneStage.Confirmations {
			confirm.UserIndex = uint(confirm_index)
		}
	}
}

func GetLaneInfoByID(context *gin.Context) {
	data := database.GetLaneInfoByID(convert2int(context, "id"))
	if data.ID == 0 {
		context.IndentedJSON(http.StatusBadRequest, gin.H{"error": "無效的用戶 ID"})
		return
	}
	fmt.Println("LaneInfo with ID(", context.Param("id"), ") -> ", data)

	context.IndentedJSON(http.StatusOK, data)
}

func PostLaneInfo(context *gin.Context) {
	data := database.LaneData{}
	err := context.BindJSON(&data)
	if err != nil {
		context.IndentedJSON(http.StatusBadRequest, "error : "+err.Error())
		return
	}
	loadLaneInfo(&data)
	newData := database.PostLaneInfo(data)
	context.IndentedJSON(http.StatusOK, newData)
}

func UpdateLaneInfo(context *gin.Context) {
	data := database.LaneData{}
	err := context.BindJSON(&data)
	if err != nil {
		context.IndentedJSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	loadLaneInfo(&data)
	newdata := database.UpdateLaneInfo(convert2int(context, "id"), data)
	if newdata.UserIds == nil {
		context.IndentedJSON(http.StatusInternalServerError, gin.H{"error": "更新失敗"})
		return
	}
	context.IndentedJSON(http.StatusOK, newdata)
}

func UpdataLaneScore(context *gin.Context) {
	id := convert2int(context, "id")
	stageindex := convert2int(context, "stageindex")
	userindex := convert2int(context, "userindex")
	arrowindex := convert2int(context, "arrowindex")
	score := convert2int(context, "score")
	result := database.UpdataLaneScore(id, stageindex, userindex, arrowindex, score)
	if !result {
		context.IndentedJSON(http.StatusInternalServerError, gin.H{"error": "更新失敗"})
		return
	}

	newdata := database.GetLaneInfoByID(id)
	if newdata.ID == 0 {
		context.IndentedJSON(http.StatusBadRequest, gin.H{"error": "無效的用戶 ID"})
		return
	}
	fmt.Println("LaneInfo with ID(", context.Param("id"), ") -> ", newdata)
	context.IndentedJSON(http.StatusOK, newdata)
}

func UpdataLaneConfirm(context *gin.Context) {
	id := convert2int(context, "id")
	stageindex := convert2int(context, "stageindex")
	userindex := convert2int(context, "userindex")
	confirm := convert2bool(context, "confirm")
	result := database.UpdataLaneConfirm(id, stageindex, userindex, confirm)
	if !result {
		context.IndentedJSON(http.StatusInternalServerError, gin.H{"error": "更新失敗"})
		return
	}
	newdata := database.GetLaneInfoByID(id)
	if newdata.ID == 0 {
		context.IndentedJSON(http.StatusBadRequest, gin.H{"error": "無效的用戶 ID"})
		return
	}
	fmt.Println("LaneInfo with ID(", context.Param("id"), ") -> ", newdata)
	context.IndentedJSON(http.StatusOK, newdata)
}

func DeleteLaneInfoByID(context *gin.Context) {
	if !database.DeleteLaneInfoByID(convert2int(context, "id")) {
		context.IndentedJSON(http.StatusBadRequest, gin.H{"error": "無效的用戶 ID"})
		return
	}
	context.IndentedJSON(http.StatusOK, "Successfully")
}
