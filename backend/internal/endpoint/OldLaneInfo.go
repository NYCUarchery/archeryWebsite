package endpoint

import (
	"backend/internal/database"
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
)

func loadOldLaneInfo(data *database.LaneData) {
	/* save UserIds indexing */
	for index, user := range data.UserIds {
		user.UserIndex = index
	}
	/* save LaneStage indexing*/
	for index, laneStage := range data.Stages {
		laneStage.StageIndex = index
		/*save LaneStage.OldEndScores*/
		for end_index, end := range laneStage.OldEndScores {
			end.UserIndex = end_index
			/*save OldEndScores.AllScres */
			for all_index, all := range end.AllScores {
				all.ArrowIndex = all_index
			}
		}
		/*save LaneStage.Comfirmations*/
		for confirm_index, confirm := range laneStage.Confirmations {
			confirm.UserIndex = confirm_index
		}
	}
}

// Get OldLaneInfo By ID godoc
//
//	@Summary		Show one OldLaneInfo
//	@Description	Get one OldLaneInfo by id
//	@Tags			OldLaneInfo
//	@Produce		json
//	@Param			id	path	int	true	"OldLaneInfo ID"
//	@Success		200	string	string
//	@Failure		400	string	string
//	@Router			/oldlaneinfo/{id} [get]
func GetOldLaneInfoByID(context *gin.Context) {
	data := database.GetOldLaneInfoByID(Convert2uint(context, "id"))
	if data.ID == 0 {
		context.IndentedJSON(http.StatusBadRequest, gin.H{"error": "無效的用戶 ID"})
		return
	}
	fmt.Println("LaneInfo with ID(", context.Param("id"), ") -> ", data)

	context.IndentedJSON(http.StatusOK, data)
}

// Post OldLaneInfo godoc
//
//	@Summary		Create one OldLaneInfo
//	@Description	Post one new OldLaneInfo data with new id, and return the new OldLaneInfo data
//	@Tags			OldLaneInfo
//	@Accept			json
//	@Produce		json
//	@Param			LaneData	body	string	true	"LaneData"
//	@Success		200			string	string
//	@Failure		400			string	string
//	@Router			/oldlaneinfo [post]
func PostOldLaneInfo(context *gin.Context) {
	data := database.LaneData{}
	err := context.BindJSON(&data)
	if err != nil {
		context.IndentedJSON(http.StatusBadRequest, "error : "+err.Error())
		return
	}
	loadOldLaneInfo(&data)
	newData := database.PostOldLaneInfo(data)
	context.IndentedJSON(http.StatusOK, newData)
}

// Update OldLaneInfo godoc
//
//	@Summary		update one OldLaneInfo
//	@Description	Put whole new OldLaneInfo and overwrite with the id
//	@Tags			OldLaneInfo
//	@Accept			json
//	@Produce		json
//	@Param			id			path	string	true	"OldLaneInfo ID"
//	@Param			LaneData	body	string	true	"LaneData"
//	@Success		200			string	string
//	@Failure		400			string	string
//	@Failure		404			string	string
//	@Failure		500			string	string
//	@Router			/oldlaneinfo/{id} [put]
func PutOldLaneInfo(context *gin.Context) {
	data := database.LaneData{}
	err := context.BindJSON(&data)
	if err != nil {
		context.IndentedJSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	loadOldLaneInfo(&data)
	newdata := database.UpdateOldLaneInfo(Convert2uint(context, "id"), data)
	if newdata.UserIds == nil {
		context.IndentedJSON(http.StatusInternalServerError, gin.H{"error": "更新失敗"})
		return
	}
	context.IndentedJSON(http.StatusOK, newdata)
}

// Update OldLaneInfo Score godoc
//
//	@Summary		update one OldLaneInfo Score
//	@Description	Put one OldLaneInfo score by index and id
//	@Tags			OldLaneInfo
//	@Accept			json
//	@Produce		json
//	@Param			id			path	string	true	"OldLaneInfo ID"
//	@Param			stageindex	path	string	true	"OldLaneInfo stage index"
//	@Param			userindex	path	string	true	"OldLaneInfo user index of the stage"
//	@Param			arrowindex	path	string	true	"OldLaneInfo arrow index of the user"
//	@Param			score		path	string	true	"score of the arrow"
//	@Success		200			string	string
//	@Failure		400			string	string
//	@Failure		404			string	string
//	@Failure		500			string	string
//	@Router			/oldlaneinfo/score/{id}/{stageindex}/{userindex}/{arrowindex}/{score} [patch]
func PutOldLaneScore(context *gin.Context) {
	id := Convert2uint(context, "id")
	stageindex := Convert2int(context, "stageindex")
	userindex := Convert2int(context, "userindex")
	arrowindex := Convert2int(context, "arrowindex")
	score := Convert2int(context, "score")
	result := database.UpdataOldLaneScore(id, stageindex, userindex, arrowindex, score)
	if !result {
		context.IndentedJSON(http.StatusInternalServerError, gin.H{"error": "更新失敗"})
		return
	}

	newdata := database.GetOldLaneInfoByID(id)
	if newdata.ID == 0 {
		context.IndentedJSON(http.StatusBadRequest, gin.H{"error": "無效的用戶 ID"})
		return
	}
	fmt.Println("LaneInfo with ID(", context.Param("id"), ") -> ", newdata)
	context.IndentedJSON(http.StatusOK, newdata)
}

// Update OldLaneInfo Confirmation godoc
//
//	@Summary		update one OldLaneInfo confirmation
//	@Description	Put one OldLaneInfo confirm by index and id
//	@Tags			OldLaneInfo
//	@Accept			json
//	@Produce		json
//	@Param			id			path	string	true	"OldLaneInfo ID"
//	@Param			stageindex	path	string	true	"OldLaneInfo stage index"
//	@Param			userindex	path	string	true	"OldLaneInfo user index of the stage"
//	@Param			confirm		path	string	true	"confirmation of the user"
//	@Success		200			string	string
//	@Failure		400			string	string
//	@Failure		404			string	string
//	@Failure		500			string	string
//	@Router			/oldlaneinfo/confirm/{id}/{stageindex}/{userindex}/{confirm} [patch]
func PutOldLaneConfirm(context *gin.Context) {
	id := Convert2uint(context, "id")
	stageindex := Convert2int(context, "stageindex")
	userindex := Convert2int(context, "userindex")
	confirm := Convert2bool(context, "confirm")
	result := database.UpdataOldLaneConfirm(id, stageindex, userindex, confirm)
	if !result {
		context.IndentedJSON(http.StatusInternalServerError, gin.H{"error": "更新失敗"})
		return
	}
	newdata := database.GetOldLaneInfoByID(id)
	if newdata.ID == 0 {
		context.IndentedJSON(http.StatusBadRequest, gin.H{"error": "無效的用戶 ID"})
		return
	}
	fmt.Println("LaneInfo with ID(", context.Param("id"), ") -> ", newdata)
	context.IndentedJSON(http.StatusOK, newdata)
}

// Delete OldLaneInfo by id godoc
//
//	@Summary		delete one OldLaneInfo
//	@Description	delete one OldLaneInfo by id
//	@Tags			OldLaneInfo
//	@Accept			json
//	@Produce		json
//	@Param			id	path	string	true	"OldLaneInfo ID"
//	@Success		200	string	string
//	@Failure		400	string	string
//	@Failure		404	string	string
//	@Router			/oldlaneinfo/{id} [delete]
func DeleteOldLaneInfoByID(context *gin.Context) {
	if !database.DeleteOldLaneInfoByID(Convert2uint(context, "id")) {
		context.IndentedJSON(http.StatusBadRequest, gin.H{"error": "無效的用戶 ID 或 格式錯誤 "})
		return
	}
	context.IndentedJSON(http.StatusOK, "Successfully")
}
