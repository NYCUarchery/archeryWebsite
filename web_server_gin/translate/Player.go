package translate

import (
	"fmt"
	"web_server_gin/database"
	response "web_server_gin/translate/Response"

	"github.com/gin-gonic/gin"
)

func IsGetOnlyPlayer(context *gin.Context, id uint) (bool, database.Player) {
	if response.ErrorIdTest(context, id, database.GetPlayerIsExist(id), "Player") {
		return false, database.Player{}
	}
	data, err := database.GetOnlyPlayer(id)
	if response.ErrorInternalErrorTest(context, id, "Get only Player", err) {
		return false, data
	}
	response.AcceptPrint(id, fmt.Sprint(data), "only Player")
	return true, data
}

func IsGetPlayerWScores(context *gin.Context, id uint) (bool, database.Player) {
	if response.ErrorIdTest(context, id, database.GetPlayerIsExist(id), "Player") {
		return false, database.Player{}
	}
	data, err := database.GetPlayerWScores(id)
	if response.ErrorInternalErrorTest(context, id, "Get Player with scores ", err) {
		return false, data
	}
	response.AcceptPrint(id, fmt.Sprint(data), "Player with scores ")
	return true, data
}

func GetOnlyPlayerByID(context *gin.Context) {
	id := convert2uint(context, "id")
	isExist, data := IsGetOnlyPlayer(context, id)
	if !isExist {
		return
	}
	context.IndentedJSON(200, data)
}

func GetPlayerWScoresByID(context *gin.Context) {
	id := convert2uint(context, "id")
	isExist, data := IsGetPlayerWScores(context, id)
	if !isExist {
		return
	}
	context.IndentedJSON(200, data)
}

func PostPlayer(context *gin.Context) {
	var data database.Player
	/*only get participant_id*/
	participantId := convert2uint(context, "participant_id")
	data.ParticipantId = participantId

	/*copy data from participant, user, competition*/
	participant, _ := database.GetParticipant(participantId)
	userID := participant.UserID
	competitionId := participant.CompetitionID
	user, _ := database.GetUserById(userID)
	data.GroupId = database.GetCompetitionNoTypeGroupId(competitionId)
	data.LaneId = database.GetCompetitionNoTypeLaneId(competitionId)
	data.Name = user.Name
	data.TotalScore = 0
	data.ShootOffScore = 0
	data.Rank = 0
	data.Order = 0

	data, err := database.CreatePlayer(data)
	if response.ErrorInternalErrorTest(context, data.ID, "Create Player", err) {
		return
	}
	response.AcceptPrint(data.ID, fmt.Sprint(data), "Create Player")
	context.IndentedJSON(200, data)
}

func DeletePlayer(context *gin.Context) {
	id := convert2uint(context, "id")
	if response.ErrorIdTest(context, id, database.GetPlayerIsExist(id), "Player") {
		return
	}
	err := database.DeletePlayer(id)
	if response.ErrorInternalErrorTest(context, id, "Delete Player", err) {
		return
	}
	response.AcceptPrint(id, fmt.Sprint(id), "Player")
	context.IndentedJSON(200, id)
}
