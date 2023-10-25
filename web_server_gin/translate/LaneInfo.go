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

// Get LaneInfo By ID godoc
//
//	@Summary		Show one LaneInfo
//	@Description	Get one LaneInfo by id
//	@Tags			LaneInfo
//	@Produce		json
//	@Param			id	path	int	true	"LaneInfo ID"
//	@Success		200	string	string
//	@Failure		400	string	string
//	@Router			/data/laneinfo/{id} [get]
func GetLaneInfoByID(context *gin.Context) {
	data := database.GetLaneInfoByID(convert2int(context, "id"))
	if data.ID == 0 {
		context.IndentedJSON(http.StatusBadRequest, gin.H{"error": "無效的用戶 ID"})
		return
	}
	fmt.Println("LaneInfo with ID(", context.Param("id"), ") -> ", data)

	context.IndentedJSON(http.StatusOK, data)
}

// Post LaneInfo godoc
//
//	@Summary		Create one LaneInfo
//	@Description	Post one new LaneInfo data with new id, and return the new LaneInfo data
//	@Tags			LaneInfo
//	@Accept			json
//	@Produce		json
//	@Param			LaneData	body	string	true	"LaneData"
//	@Success		200			string	string
//	@Failure		400			string	string
//	@Router			/data/laneinfo [post]
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

// Update LaneInfo godoc
//
//	@Summary		update one LaneInfo
//	@Description	Put whole new LaneInfo and overwrite with the id
//	@Tags			LaneInfo
//	@Accept			json
//	@Produce		json
//	@Param			id			path	string	true	"LaneInfo ID"
//	@Param			LaneData	body	string	true	"LaneData"
//	@Success		200			string	string
//	@Failure		400			string	string
//	@Failure		404			string	string
//	@Failure		500			string	string
//	@Router			/data/laneinfo/whole/{id} [put]
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

// Update LaneInfo Score godoc
//
//	@Summary		update one LaneInfo Score
//	@Description	Put one LaneInfo score by index and id
//	@Tags			LaneInfo
//	@Accept			json
//	@Produce		json
//	@Param			id			path	string	true	"LaneInfo ID"
//	@Param			stageindex	path	string	true	"LaneInfo stage index"
//	@Param			userindex	path	string	true	"LaneInfo user index of the stage"
//	@Param			arrowindex	path	string	true	"LaneInfo arrow index of the user"
//	@Param			score		path	string	true	"score of the arrow"
//	@Success		200			string	string
//	@Failure		400			string	string
//	@Failure		404			string	string
//	@Failure		500			string	string
//	@Router			/data/laneinfo/score/{id}/{stageindex}/{userindex}/{arrowindex}/{score} [put]
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

// Update LaneInfo Confirmation godoc
//
//	@Summary		update one LaneInfo confirmation
//	@Description	Put one LaneInfo confirm by index and id
//	@Tags			LaneInfo
//	@Accept			json
//	@Produce		json
//	@Param			id			path	string	true	"LaneInfo ID"
//	@Param			stageindex	path	string	true	"LaneInfo stage index"
//	@Param			userindex	path	string	true	"LaneInfo user index of the stage"
//	@Param			confirm		path	string	true	"confirmation of the user"
//	@Success		200			string	string
//	@Failure		400			string	string
//	@Failure		404			string	string
//	@Failure		500			string	string
//	@Router			/data/laneinfo/confirm/{id}/{stageindex}/{userindex}/{confirm} [put]
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

// Delete LaneInfo by id godoc
//
//	@Summary		delete one LaneInfo
//	@Description	delete one LaneInfo by id
//	@Tags			LaneInfo
//	@Accept			json
//	@Produce		json
//	@Param			id	path	string	true	"LaneInfo ID"
//	@Success		200	string	string
//	@Failure		400	string	string
//	@Failure		404	string	string
//	@Router			/data/laneinfo/{id} [delete]
func DeleteLaneInfoByID(context *gin.Context) {
	if !database.DeleteLaneInfoByID(convert2int(context, "id")) {
		context.IndentedJSON(http.StatusBadRequest, gin.H{"error": "無效的用戶 ID 或 格式錯誤 "})
		return
	}
	context.IndentedJSON(http.StatusOK, "Successfully")
}
