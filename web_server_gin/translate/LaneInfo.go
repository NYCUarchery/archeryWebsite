package translate

import (
	"fmt"
	"net/http"
	"strconv"
	"web_server_gin/database"

	"github.com/gin-gonic/gin"
)

func convert2int(c *gin.Context, name string) int {
	dataStr := c.Param(name)
	data, err := strconv.Atoi(dataStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "unvalid " + name + " parameter"})
		return 0
	}

	return data
}

/*
func convert2bool(c *gin.Context, name string) bool {
	dataStr := c.Param(name)

	data, err := strconv.ParseBool(dataStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "unvalid " + name + " parameter"})
		return data
	}
	return data
}
*/

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
		context.IndentedJSON(http.StatusNotAcceptable, "Error : "+err.Error())
		return
	}
	/* save UserIds indexing */
	for index, user := range data.UserIds {
		user.UserIndex = index
	}
	/* save LaneStage indexing*/
	for index, laneStage := range data.Stages {
		laneStage.StageIndex = index
		/*save LaneStage.Totals*/
		for total_index, total := range laneStage.Totals {
			total.UserIndex = total_index
		}
		/*save LaneStage.Comfirmations*/
		for confirm_index, confirm := range laneStage.Confirmations {
			confirm.UserIndex = confirm_index
		}
		/*save LaneStage.EndScores*/
		for end_index, end := range laneStage.EndScores {
			end.UserIndex = end_index
			/*save EndScores.AllScres */
			for all_index, all := range end.AllScores {
				all.ArrowIndex = all_index
			}
		}
	}

	newData := database.PostLaneInfo(data)
	context.IndentedJSON(http.StatusOK, newData)

}

func UpdateLaneInfo(context *gin.Context) {
	data := database.LaneData{}
	err := context.BindJSON(&data)
	if err != nil {
		context.IndentedJSON(http.StatusBadRequest, "Error")
		return
	}
	newdata := database.UpdateLaneInfo(convert2int(context, "id"), data)
	/* 暫時的struct還沒建立id
	if newdata.ID == 0 {
		context.IndentedJSON(http.StatusNotFound, "Error")
		return
	}
	*/
	context.IndentedJSON(http.StatusOK, newdata)
}

func UpdataLaneScore(context *gin.Context) {
	data := database.LaneData{}
	err := context.BindJSON(&data)
	if err != nil {
		context.IndentedJSON(http.StatusBadRequest, "Error")
		return
	}
	newdata := database.UpdataLaneScore(convert2int(context, "id"), convert2int(context, "stageindex"), convert2int(context, "userindex"), convert2int(context, "arrowindex"), convert2int(context, "score"))
	if newdata.ID == 0 {
		context.IndentedJSON(http.StatusNotFound, "Error")
		return
	}
	context.IndentedJSON(http.StatusOK, newdata)
}

/*
	func UpdataLaneConfirm(context *gin.Context) {
		data := database.LaneData{}
		err := context.BindJSON(&data)
		if err != nil {
			context.IndentedJSON(http.StatusBadRequest, "Error")
			return
		}
		newdata := database.UpdataLaneConfirm(convert2int(context, "id"), convert2int(context, "who"), convert2bool((context), "confirm"))
		if newdata.ID == 0 {
			context.IndentedJSON(http.StatusNotFound, "Error")
			return
		}
		context.IndentedJSON(http.StatusOK, newdata)
	}

func DeleteLaneInfoByID(context *gin.Context) {
	if !database.DeleteLaneInfoByID(convert2int(context, "id")) {
		context.IndentedJSON(http.StatusNotFound, "Error")
		return
	}
	context.IndentedJSON(http.StatusOK, "Successfully")
}
*/
