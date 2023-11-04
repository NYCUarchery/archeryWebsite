package translate

import (
	"fmt"
	"net/http"
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

// Get One Player By ID godoc
//
//	@Summary		Show one Player without other data
//	@Description	Get one Player without other data by id
//	@Tags			Player
//	@Produce		json
//	@Param			id	path	int	true	"Player ID"
//	@Success		200	string	string
//	@Failure		400	string	string
//	@Router			/data/player/{id} [get]
func GetOnlyPlayerByID(context *gin.Context) {
	id := convert2uint(context, "id")
	isExist, data := IsGetOnlyPlayer(context, id)
	if !isExist {
		return
	}
	context.IndentedJSON(200, data)
}

// Get One Player with Scores By ID godoc
//
//	@Summary		Show one Player with scores
//	@Description	Get one Player with rounds, roundends, roundscores by id
//	@Tags			Player
//	@Produce		json
//	@Param			id	path	int	true	"Player ID"
//	@Success		200	string	string
//	@Failure		400	string	string
//	@Router			/data/player/scores/{id} [get]
func GetPlayerWScoresByID(context *gin.Context) {
	id := convert2uint(context, "id")
	isExist, data := IsGetPlayerWScores(context, id)
	if !isExist {
		return
	}
	context.IndentedJSON(200, data)
}

// Post one Player By Participant ID godoc
//
//	@Summary		Create one Player by Participant ID
//	@Description	Create one Player by participant id, create realeted rounds by laneNum of competition, noTypeLane playerNum ++
//	@Tags			Player
//	@Produce		json
//	@Param			participantid	path	int	true	"Participant ID"
//	@Success		200				string	string
//	@Failure		400				string	string
//	@Router			/data/player/{participantid} [post]
func PostPlayer(context *gin.Context) {
	var data database.Player
	/*only get participant_id*/
	participantId := convert2uint(context, "participantid")
	data.ParticipantId = participantId
	if response.ErrorIdTest(context, participantId, database.GetParticipantIsExist(participantId), "Participant when creating Player") {
		return
	}

	/*copy data from participant, user, competition*/
	participant, _ := database.GetParticipant(participantId)
	userID := participant.UserID
	competitionId := participant.CompetitionID
	roundsNum := database.GetCompetitionRoundsNum(competitionId)
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
	/*playerNum plus one in lane*/
	if !UpdateLanePlayerNumAddOne(context, data.LaneId) {
		return
	}
	/*create rounds*/
	for i := 0; i < roundsNum; i++ {
		var round database.Round
		round.PlayerId = data.ID
		round.TotalScore = 0
		round, err = database.CreateRound(round)
		if response.ErrorInternalErrorTest(context, round.ID, "Create Round when creating player ", err) {
			return
		}
		response.AcceptPrint(round.ID, fmt.Sprint(round), "Create Round when creating player ")
	}
	context.IndentedJSON(200, data)
}

// Post one RoundEnd By Round ID godoc
//
//	@Summary		Create one RoundEnd by Round ID
//	@Description	Create one RoundEnd by round id, IsComfirmed is false
//	@Tags			Player
//	@Accept			json
//	@Produce		json
//	@Success		200	string	string
//	@Failure		400	string	string
//	@Router			/data/player/roundend [post]
func PostRoundEnd(context *gin.Context) {
	var data database.RoundEnd
	err := context.BindJSON(&data)
	if response.ErrorReceiveDataTest(context, 0, "Create RoundEnd", err) {
		return
	} else if response.ErrorIdTest(context, data.RoundId, database.GetRoundIsExist(data.RoundId), "Round when creating RoundEnd") {
		return
	}
	data.IsComfirmed = false
	data, err = database.CreateRoundEnd(data)
	if response.ErrorInternalErrorTest(context, data.ID, "Create RoundEnd", err) {
		return
	}
	response.AcceptPrint(data.ID, fmt.Sprint(data), "Create RoundEnd")
	context.IndentedJSON(200, data)
}

// Post one RoundScore By RoundEnd ID godoc
//
//	@Summary		Create one RoundScore by RoundEnd ID
//	@Description	Create one RoundScore by roundend id
//	@Tags			Player
//	@Accept			json
//	@Produce		json
//	@Success		200	string	string
//	@Failure		400	string	string
//	@Router			/data/player/roundscore [post]
func PostRoundScore(context *gin.Context) {
	var data database.RoundScore
	err := context.BindJSON(&data)
	if response.ErrorReceiveDataTest(context, data.ID, "Create RoundScore", err) {
		return
	} else if response.ErrorIdTest(context, data.RoundEndId, database.GetRoundEndIsExist(data.RoundEndId), "RoundEnd when creating RoundScore") {
		return
	}
	if err != nil {
		context.IndentedJSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	data, err = database.CreateRoundScore(data)
	if response.ErrorInternalErrorTest(context, data.ID, "Create RoundScore", err) {
		return
	}
	response.AcceptPrint(data.ID, fmt.Sprint(data), "Create RoundScore")
	context.IndentedJSON(200, data)
}

// Delete one Player By ID godoc
//
//	@Summary		Delete one Player by id
//	@Description	Delete one Player by id, delete related round, roundend, roundscore data, and playerNum minus one in lane
//	@Tags			Player
//	@Produce		json
//	@Param			id	path	int	true	"Player ID"
//	@Success		200	string	string
//	@Failure		400	string	string
//	@Router			/data/player/{id} [delete]
func DeletePlayer(context *gin.Context) {
	id := convert2uint(context, "id")
	isExist, data := IsGetOnlyPlayer(context, id)
	if !isExist {
		return
	}
	/*playerNum minus one in lane*/
	if !UpdateLanePlayerNumMinusOne(context, data.LaneId) {
		return
	}
	isChanged, err := database.DeletePlayer(id)
	if response.ErrorInternalErrorTest(context, id, "Delete Player", err) {
		return
	}
	response.AcceptDeleteSuccess(context, id, isChanged, "Delete Player")
}

func DeletePlayerThroughCompetition(context *gin.Context, id uint) bool {
	_, err := database.DeletePlayer(id)
	return !response.ErrorInternalErrorTest(context, id, "Delete Player through competition", err)
}
