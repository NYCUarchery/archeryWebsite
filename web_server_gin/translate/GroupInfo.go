package translate

import (
	"fmt"
	"net/http"
	"web_server_gin/database"

	"github.com/gin-gonic/gin"
)

type groupIdsForReorder struct {
	CompetitionId int   `json:"competition_id"`
	GroupIds      []int `json:"group_ids"`
}

// {
// 	"competition_id" : 000,
// 	"group_ids" : [1, 2, 3, 4, 5, 6, 7, 8]
// }

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

func PostGroupInfo(context *gin.Context) {
	var data database.Group
	err := context.BindJSON(&data)
	if err != nil {
		context.IndentedJSON(http.StatusBadRequest, "error : "+err.Error())
		return
	}
	fmt.Printf("Post GroupInfo -> %v\n", data)
	data.GroupIndex = database.GetGameInfoGroupNum(int(data.GameInfoID))
	newData, error := database.CreateGroupInfo(data)
	if newData.ID == 0 {
		context.IndentedJSON(http.StatusBadRequest, gin.H{"error": "無效的用戶 ID"})
		return
	} else if error != nil {
		context.IndentedJSON(http.StatusInternalServerError, gin.H{"error": error.Error()})
		return
	}
	database.AddOneGameInfoGroupNum(int(data.GameInfoID))
	context.IndentedJSON(http.StatusOK, newData)
}

func UpdateGroupInfo(context *gin.Context) {
	var data database.Group
	id := convert2int(context, "id")
	data.ID = uint(id)
	err := context.BindJSON(&data)
	if err != nil {
		context.IndentedJSON(http.StatusBadRequest, "error : "+err.Error())
		return
	}
	ischanged, newData, error := database.UpdateGroupInfo(id, data)
	if newData.ID == 0 {
		context.IndentedJSON(http.StatusBadRequest, gin.H{"error": "無效的用戶 ID"})
		return
	} else if error != nil {
		context.IndentedJSON(http.StatusInternalServerError, gin.H{"error": error.Error()})
		return
	} else if !ischanged {
		context.IndentedJSON(http.StatusInternalServerError, gin.H{"error": "資料庫unchanged"})
		return
	}
	context.IndentedJSON(http.StatusOK, newData)
}

func ReorderGroupInfo(context *gin.Context) {
	var idArray groupIdsForReorder
	err := context.BindJSON(&idArray)
	if err != nil {
		context.IndentedJSON(http.StatusBadRequest, "error : "+err.Error())
		return
	} else if idArray.CompetitionId == 0 {
		context.IndentedJSON(http.StatusBadRequest, gin.H{"error": "無效的用戶 CompetitionId"})
		return
	} else if idArray.GroupIds == nil {
		context.IndentedJSON(http.StatusBadRequest, gin.H{"error": "無效的用戶 GroupIds"})
		return
	}
	gamedata, err := database.GetOnlyGameInfo(idArray.CompetitionId)
	if gamedata.ID == 0 || gamedata.Groups_num != len(idArray.GroupIds) {
		context.IndentedJSON(http.StatusBadRequest, gin.H{"error": "Groups_num 與 GroupIds 長度不符, Group_num = " + fmt.Sprint(gamedata.Groups_num) + ", GroupIds = " + fmt.Sprint(idArray.GroupIds)})
		return
	} else if err != nil {
		context.IndentedJSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	for index, id := range idArray.GroupIds {
		fmt.Print("id = ", id, "\n")
		if id == 0 {
			context.IndentedJSON(http.StatusBadRequest, gin.H{"error": "無效的用戶 Group ID"})
			return
		}
		var data database.Group
		data, error := database.GetGroupInfoById(id)
		if data.ID == 0 {
			context.IndentedJSON(http.StatusInternalServerError, gin.H{"error": "資料庫無效的用戶 ID"})
			return
		} else if error != nil {
			context.IndentedJSON(http.StatusInternalServerError, gin.H{"error": error.Error()})
			return
		} else {
			_, tempdata, err := database.UpdateGroupInfoIndex(id, index)
			if err != nil {
				context.IndentedJSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
			fmt.Print("tempdata.GroupIndex = ", tempdata.GroupIndex, "\n")
			temp2data, _ := database.GetGroupInfoById(id)
			fmt.Print("temp2data.GroupIndex = ", temp2data.GroupIndex, "\n")
			context.IndentedJSON(http.StatusOK, tempdata)
		}
	}
	data := database.GetGameInfoWGroups(idArray.CompetitionId)
	fmt.Printf("Reorder GroupInfo with ID(%v) -> %v\n", idArray.CompetitionId, data)
	if data.ID == 0 {
		context.IndentedJSON(http.StatusBadRequest, gin.H{"error": "資料庫無效的用戶 competition_id "})
		return
	}
	fmt.Println("GameInfo with ID(", idArray.CompetitionId, ") -> ", data)
	context.IndentedJSON(http.StatusOK, data)
}

func DeleteGroupInfo(context *gin.Context) {
	id := convert2int(context, "id")
	affected, competitionId, error := database.DeleteGroupInfo(id)
	if !affected {
		context.IndentedJSON(http.StatusBadRequest, gin.H{"error": "無效的用戶 ID 或 格式錯誤 "})
		return
	} else if error != nil {
		context.IndentedJSON(http.StatusInternalServerError, gin.H{"error": error.Error()})
		return
	}
	database.MinusOneGameInfoGroupNum(competitionId)
	context.IndentedJSON(http.StatusOK, gin.H{"message": "成功刪除用戶"})
}
