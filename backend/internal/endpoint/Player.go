package endpoint

import (
	"backend/internal/database"
	"backend/internal/endpoint/tools"
	response "backend/internal/response"

	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
)

type UpdateTotalScoreData struct {
	PlayerId   uint `json:"player_id"`
	RoundId    uint `json:"round_id"`
	RoundEndId uint `json:"round_end_id"`
	Score      int  `json:"score"`
}

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
//	@Router			/api/player/{id} [get]
func GetOnlyPlayerByID(context *gin.Context) {
	id := tools.Convert2uint(context, "id")
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
//	@Router			/api/player/scores/{id} [get]
func GetPlayerWScoresByID(context *gin.Context) {
	id := tools.Convert2uint(context, "id")
	isExist, data := IsGetPlayerWScores(context, id)
	if !isExist {
		return
	}
	context.IndentedJSON(200, data)
}

// Get One Player with PlayerSets By ID and elimination id godoc
//
//	@Summary		Show one Player with player sets
//	@Description	Get one Player with player sets by id and elimination id
//	@Tags			Player
//	@Produce		json
//	@Param			id				path	int	true	"Player ID"
//	@Param			eliminationid	path	int	true	"Elimination ID"
//	@Success		200				string	string
//	@Failure		400				string	string
//	@Router			/api/player/playersets/{id}/{eliminationid} [get]
func GetPlayerWPlayerSetsByIDEliminationID(context *gin.Context) {
	id := tools.Convert2uint(context, "id")
	eliminationId := tools.Convert2uint(context, "eliminationid")
	if response.ErrorIdTest(context, eliminationId, database.GetEliminationIsExist(eliminationId), "Elimination when getting player sets") {
		return
	} else if response.ErrorIdTest(context, id, database.GetPlayerIsExist(id), "Player when getting player sets") {
		return
	}
	data, err := database.GetPlayerWPlayerSetsByIDCompeitionID(id, eliminationId)
	if response.ErrorInternalErrorTest(context, id, "Get Player with player sets", err) {
		return
	}
	response.AcceptPrint(id, fmt.Sprint(data), "Player with player sets")
	context.IndentedJSON(200, data)
}

// Post one Player By Participant ID godoc
//
//	@Summary		Create one Player by Participant ID
//	@Description	Create one Player by participant id, create realeted rounds by laneNum of competition, create 6 roundscores for each 6 roundends, UnassignedLane playerNum ++
//	@Tags			Player
//	@Produce		json
//	@Param			participantid	path	int	true	"Participant ID"
//	@Success		200				string	string
//	@Failure		400				string	string
//	@Router			/api/player/{participantid} [post]
func PostPlayer(context *gin.Context) {
	var data database.Player
	/*only get participant_id*/
	participantId := tools.Convert2uint(context, "participantid")
	data.ParticipantId = participantId
	if response.ErrorIdTest(context, participantId, database.GetParticipantIsExist(participantId), "Participant when creating Player") {
		return
	}

	/*copy data from participant, user, competition*/
	participant, _ := database.GetParticipant(participantId)
	userID := participant.UserID
	competitionId := participant.CompetitionID
	roundsNum := database.GetCompetitionRoundsNum(competitionId)
	user, _ := database.FindByUserID(userID)
	data.GroupId = database.GetCompetitionUnassignedGroupId(competitionId)
	data.LaneId = database.GetCompetitionUnassignedLaneId(competitionId)
	data.Name = user.RealName
	data.TotalScore = 0
	data.ShootOffScore = -1
	data.Rank = 0
	data.Order = 0

	data, err := database.CreatePlayer(data)
	if response.ErrorInternalErrorTest(context, data.ID, "Create Player", err) {
		return
	}
	response.AcceptPrint(data.ID, fmt.Sprint(data), "Create Player")
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
		/*create roundends*/
		for j := 0; j < 6; j++ {
			var roundEnd database.RoundEnd
			roundEnd.RoundId = round.ID
			roundEnd.IsConfirmed = false
			roundEnd, err = database.CreateRoundEnd(roundEnd)
			if response.ErrorInternalErrorTest(context, roundEnd.ID, "Create RoundEnd when creating player ", err) {
				return
			}
			response.AcceptPrint(roundEnd.ID, fmt.Sprint(roundEnd), "Create RoundEnd when creating player ")
			/*create roundscores*/
			for k := 0; k < 6; k++ {
				var roundScore database.RoundScore
				roundScore.RoundEndId = roundEnd.ID
				roundScore.Score = -1
				roundScore, err = database.CreateRoundScore(roundScore)
				if response.ErrorInternalErrorTest(context, roundScore.ID, "Create RoundScore when creating player ", err) {
					return
				}
				response.AcceptPrint(roundScore.ID, fmt.Sprint(roundScore), "Create RoundScore when creating player ")
			}
		}
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
//	@Router			/api/player/roundend [post]
func PostRoundEnd(context *gin.Context) {
	var data database.RoundEnd
	err := context.BindJSON(&data)
	if response.ErrorReceiveDataTest(context, 0, "Create RoundEnd", err) {
		return
	} else if response.ErrorIdTest(context, data.RoundId, database.GetRoundIsExist(data.RoundId), "Round when creating RoundEnd") {
		return
	}
	data.IsConfirmed = false
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
//	@Router			/api/player/roundscore [post]
func PostRoundScore(context *gin.Context) {
	var data UpdateTotalScoreData
	err := context.BindJSON(&data)
	playerId := data.PlayerId
	roundId := data.RoundId
	roundEndId := data.RoundEndId
	score := data.Score
	var roundScore database.RoundScore
	roundScore.RoundEndId = roundEndId
	roundScore.Score = score
	if response.ErrorReceiveDataTest(context, 0, "Create RoundScore", err) {
		return
	} else if response.ErrorIdTest(context, roundEndId, database.GetRoundEndIsExist(roundEndId), "RoundEnd when creating RoundScore") {
		return
	}
	if err != nil {
		context.IndentedJSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	newRoundScore, err := database.CreateRoundScore(roundScore)
	if response.ErrorInternalErrorTest(context, newRoundScore.ID, "Create RoundScore", err) {
		return
	}
	/*auto update total score in rounds when create score*/
	score = tools.Scorefmt(score)
	if !UpdatePlayerTotalScoreWithOneScore(context, playerId, roundId, score) {
		return
	}
	response.AcceptPrint(newRoundScore.ID, fmt.Sprint(newRoundScore.ID), "Create RoundScore")
	context.IndentedJSON(200, newRoundScore)
}

func IsUpdatePlayerGroupId(context *gin.Context, playerId uint, groupId uint) bool {
	if response.ErrorIdTest(context, playerId, database.GetPlayerIsExist(playerId), "Player when updating groupId") {
		return false
	}
	if response.ErrorIdTest(context, groupId, database.GetGroupIsExist(groupId), "Group when updating player groupId") {
		return false
	}
	err := database.UpdatePlayerGroupId(playerId, groupId)
	return !response.ErrorInternalErrorTest(context, playerId, "Update Player groupId", err)
}

func IsUpdatePlayerLaneId(context *gin.Context, playerId uint, laneId uint) bool {
	if response.ErrorIdTest(context, playerId, database.GetPlayerIsExist(playerId), "Player when updating laneId") {
		return false
	}
	if response.ErrorIdTest(context, laneId, database.GetLaneIsExist(laneId), "Lane when updating player laneId") {
		return false
	}

	err := database.UpdatePlayerLaneId(playerId, laneId)
	return !response.ErrorInternalErrorTest(context, playerId, "Update Player laneId", err)
}

// Update one Player GroupId By ID godoc
//
//	@Summary		Update one Player groupId by id
//	@Description	Update one Player groupId by id, and change player laneid to Unassigned lane
//	@Tags			Player
//	@Accept			json
//	@Produce		json
//	@Param			playerid	path	int	true	"Player ID"
//	@Success		200			string	string
//	@Failure		400			string	string
//	@Router			/api/player/groupid/{playerid}/{groupid} [put]
func UpdataPlayerGroupId(context *gin.Context) {
	var data database.Player
	playerId := tools.Convert2uint(context, "id")
	err := context.BindJSON(&data)
	groupId := data.GroupId
	if response.ErrorReceiveDataTest(context, playerId, "Update Player laneId", err) {
		return
	}
	if response.ErrorIdTest(context, playerId, database.GetPlayerIsExist(playerId), "Player when updating groupId") {
		return
	}
	if response.ErrorIdTest(context, groupId, database.GetGroupIsExist(groupId), "Group when updating player groupId") {
		return
	}

	if !IsUpdatePlayerGroupId(context, playerId, groupId) {
		return
	}
	/*change player laneid to Unassigned lane*/
	_, group := IsGetGroupInfo(context, groupId)
	UnassignedLaneId := database.GetCompetitionUnassignedLaneId(group.CompetitionId)
	if !IsUpdatePlayerLaneId(context, playerId, UnassignedLaneId) {
		return
	}

	isExist, data := IsGetOnlyPlayer(context, playerId)
	if !isExist {
		return
	}
	context.IndentedJSON(200, data)
}

// Update one Player LaneId By ID godoc
//
//	@Summary		Update one Player laneId by id
//	@Description	Update one Player laneId by id, update lane playernum
//	@Tags			Player
//	@Accept			json
//	@Produce		json
//	@Param			playerid	path	int	true	"Player ID"
//	@Success		200			string	string
//	@Failure		400			string	string
//	@Router			/api/player/laneid/{playerid} [put]
func UpdatePlayerLaneId(context *gin.Context) {
	var data database.Player
	playerId := tools.Convert2uint(context, "id")
	err := context.BindJSON(&data)
	laneId := data.LaneId
	if response.ErrorReceiveDataTest(context, playerId, "Update Player laneId", err) {
		return
	}

	if !IsUpdatePlayerLaneId(context, playerId, laneId) {
		return
	}

	isExist, data := IsGetOnlyPlayer(context, playerId)
	if !isExist {
		return
	}
	context.IndentedJSON(200, data)
}

// Update one Player Order By ID godoc
//
//	@Summary		Update one Player order by id
//	@Description	Update one Player order by id
//	@Tags			Player
//	@Accept			json
//	@Produce		json
//	@Param			id	path	int	true	"Player ID"
//	@Success		200	string	string
//	@Failure		400	string	string
//	@Router			/api/player/order/{id} [put]
func UpdatePlayerOrder(context *gin.Context) {
	var data database.Player
	playerId := tools.Convert2uint(context, "id")
	err := context.BindJSON(&data)
	order := data.Order
	if response.ErrorReceiveDataTest(context, playerId, "Update Player order", err) {
		return
	}
	if response.ErrorIdTest(context, playerId, database.GetPlayerIsExist(playerId), "Player when updating order") {
		return
	}

	err = database.UpdatePlayerOrder(playerId, order)
	if response.ErrorInternalErrorTest(context, playerId, "Update Player order", err) {
		return
	}

	isExist, data := IsGetOnlyPlayer(context, playerId)
	if !isExist {
		return
	}
	context.IndentedJSON(200, data)
}

// Update one Player IsConfirmed By ID godoc
//
//	@Summary		Update one Player isConfirmed by id
//	@Description	Update one Player isConfirmed by id
//	@Tags			Player
//	@Accept			json
//	@Produce		json
//	@Param			roundendid	path	int	true	"RoundEnd ID"
//	@Success		200			string	string
//	@Failure		400			string	string
//	@Router			/api/player/isconfirmed/{roundendid} [put]
func UpdatePlayerIsConfirmed(context *gin.Context) {
	var newRoundEnd database.RoundEnd
	roundEndId := tools.Convert2uint(context, "id")
	err := context.BindJSON(&newRoundEnd)
	if response.ErrorReceiveDataTest(context, roundEndId, "Update Player isConfirmed", err) {
		return
	}
	if response.ErrorIdTest(context, roundEndId, database.GetRoundEndIsExist(roundEndId), "RoundEnd when updating isConfirmed") {
		return
	}

	err = database.UpdatePlayerIsConfirmed(roundEndId, newRoundEnd.IsConfirmed)
	if response.ErrorInternalErrorTest(context, roundEndId, "Update Player isConfirmed", err) {
		return
	}

	context.IndentedJSON(200, nil)
}

/*auto update player total score and round total score in rounds when update score*/
func UpdatePlayerTotalScoreWithOneScore(context *gin.Context, playerId uint, roundId uint, score int) bool {
	/*check validity*/
	if response.ErrorIdTest(context, playerId, database.GetPlayerIsExist(playerId), "Player when updating total score") {
		return false
	} else if response.ErrorIdTest(context, roundId, database.GetRoundIsExist(roundId), "Round when updating total score") {
		return false
	}
	/*get old total score*/
	fmt.Printf("score: %d\n", score)
	oldPlayerTotalScore, err := database.GetPlayerTotalScoreByPlayerId(playerId)
	fmt.Printf("oldPlayerTotalScore: %d\n", oldPlayerTotalScore)
	if response.ErrorInternalErrorTest(context, playerId, "Get Player total score", err) {
		return false
	}
	oldPlayerRoundTotalScore, err := database.GetPlayerRoundTotalScoreByRoundId(roundId)
	fmt.Printf("oldPlayerRoundTotalScore: %d\n", oldPlayerRoundTotalScore)
	if response.ErrorInternalErrorTest(context, roundId, "Get Player round total score", err) {
		return false
	}
	/*update total score*/
	err = database.UpdatePlayerTotalScore(playerId, score+oldPlayerTotalScore)
	if response.ErrorInternalErrorTest(context, playerId, "Update Player total score", err) {
		return false
	}
	err = database.UpdatePlayerRoundTotalScore(roundId, score+oldPlayerRoundTotalScore)
	return !response.ErrorInternalErrorTest(context, roundId, "Update Player round total score", err)
}

// Update one Player TotalScore By ID godoc
//
//	@Summary		Update one Player total score by id
//	@Description	Update one Player total score by id
//	@Tags			Player
//	@Accept			json
//	@Produce		json
//	@Param			id	path	int	true	"Player ID"
//	@Success		200	string	string
//	@Failure		400	string	string
//	@Router			/api/player/totalscore/{id} [put]
func UpdatePlayerTotalScoreByplayerId(context *gin.Context) {
	type UpdateTotalScoreData struct {
		NewScore int `json:"new_score"`
	}

	var data UpdateTotalScoreData
	err := context.BindJSON(&data)
	if response.ErrorReceiveDataTest(context, 0, "Update Player total score", err) {
		return
	}
	playerId := tools.Convert2uint(context, "id")
	if response.ErrorIdTest(context, playerId, database.GetPlayerIsExist(playerId), "Player when updating total score") {
		return
	}

	err = database.UpdatePlayerTotalScore(playerId, data.NewScore)
	if response.ErrorInternalErrorTest(context, playerId, "Update Player total score", err) {
		return
	}

	context.IndentedJSON(200, nil)
}

// Update one Player Score By ID godoc
//
//	@Summary		Update one Player score by id
//	@Description	Update one Player score by id
//	@Tags			Player
//	@Accept			json
//	@Produce		json
//	@Param			roundscoreid	path	int	true	"RoundScore ID"
//	@Success		200				string	string
//	@Failure		400				string	string
//	@Router			/api/player/score/{roundscoreid} [put]
func UpdatePlayerScore(context *gin.Context) {
	var data UpdateTotalScoreData
	roundScoreId := tools.Convert2uint(context, "id")
	err := context.BindJSON(&data)
	/*check data validity*/
	if response.ErrorReceiveDataTest(context, roundScoreId, "Update Player score", err) {
		return
	}
	if response.ErrorIdTest(context, roundScoreId, database.GetRoundScoreIsExist(roundScoreId), "RoundScore when updating score") {
		return
	}
	if response.ErrorIdTest(context, data.PlayerId, database.GetPlayerIsExist(data.PlayerId), "Player when updating score") {
		return
	}
	if response.ErrorIdTest(context, data.RoundId, database.GetRoundIsExist(data.RoundId), "Round when updating score") {
		return
	}
	if response.ErrorIdTest(context, data.RoundEndId, database.GetRoundEndIsExist(data.RoundEndId), "RoundEnd when updating score") {
		return
	}
	/*update one score*/
	newScore := data.Score
	oldScore, err := database.GetPlayerScoreByRoundScoreId(roundScoreId)
	if response.ErrorInternalErrorTest(context, roundScoreId, "Get Player score when update totalscore", err) {
		return
	}

	err = database.UpdatePlayerScore(roundScoreId, newScore)
	if response.ErrorInternalErrorTest(context, roundScoreId, "Update Player score", err) {
		return
	}

	/*auto update player total score and round total score in rounds when update score*/
	newScore = tools.Scorefmt(newScore)
	fmt.Printf("oldScore: %d\n", oldScore)
	oldScore = tools.Scorefmt(oldScore)
	roundId, err := database.GetRoundIdByRoundScoreId(roundScoreId)
	if response.ErrorInternalErrorTest(context, roundId, "Get Round id by roundScoreId", err) {
		return
	}
	playerId, err := database.GetPlayerIdByRoundScoreId(roundScoreId)
	if response.ErrorInternalErrorTest(context, playerId, "Get Player id by roundScoreId", err) {
		return
	}
	if !UpdatePlayerTotalScoreWithOneScore(context, playerId, roundId, newScore-oldScore) {
		return
	}

	context.IndentedJSON(200, nil)
}

// Update one Player ShootoffScore By ID godoc
//
//	@Summary		Update one Player shootoffScore by id
//	@Description	Update one Player shootoffScore by id
//	@Tags			Player
//	@Accept			json
//	@Produce		json
//	@Param			id	path	int	true	"Player ID"
//	@Success		200	string	string
//	@Failure		400	string	string
//	@Router			/api/player/shootoffscore/{id} [put]
func UpdatePlayerShootoffScore(context *gin.Context) {
	var data database.Player
	playerId := tools.Convert2uint(context, "id")
	err := context.BindJSON(&data)
	shootoffScore := data.ShootOffScore
	if response.ErrorReceiveDataTest(context, playerId, "Update Player shootoffScore", err) {
		return
	}
	if response.ErrorIdTest(context, playerId, database.GetPlayerIsExist(playerId), "Player when updating shootoffScore") {
		return
	}

	err = database.UpdatePlayerShootoffScore(playerId, shootoffScore)
	if response.ErrorInternalErrorTest(context, playerId, "Update Player shootoffScore", err) {
		return
	}

	isExist, data := IsGetOnlyPlayer(context, playerId)
	if !isExist {
		return
	}
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
//	@Router			/api/player/{id} [delete]
func DeletePlayer(context *gin.Context) {
	id := tools.Convert2uint(context, "id")
	isExist, _ := IsGetOnlyPlayer(context, id)
	if !isExist {
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

// Get Dummy Players By Participant ID godoc
//
//	@Summary		Show dummy players
//	@Description	Get dummy players by participant id
//	@Tags			Player
//	@Produce		json
//	@Param			participantid	path	int	true	"Participant ID"
//	@Success		200				string	string
//	@Failure		400				string	string
//	@Router			/api/player/dummy/{participantid} [get]
func GetDummyPlayerByParticipantId(context *gin.Context) {
	var data []database.Player
	participantId := tools.Convert2uint(context, "participantid")
	if response.ErrorIdTest(context, participantId, database.GetParticipantIsExist(participantId), "Participant when getting dummy players") {
		return
	}
	data, err := database.GetDummyPlayersByParticipantId(participantId)
	if response.ErrorInternalErrorTest(context, participantId, "Get dummy players", err) {
		return
	}
	response.AcceptPrint(participantId, fmt.Sprint(data), "Get dummy players")
	context.IndentedJSON(200, data)
}

// Post Dummy Player By Player ID godoc
//
//	@Summary		Create dummy player
//	@Description	Create dummy player by player id
//	@Tags			Player
//	@Produce		json
//	@Param			playerid	path	int	true	"Player ID"
//	@Success		200			string	string
//	@Failure		400			string	string
//	@Router			/api/player/dummy/{playerid} [post]
func PostDummyPlayerByPlayerId(context *gin.Context) {
	id := tools.Convert2uint(context, "playerid")
	if response.ErrorIdTest(context, id, database.GetPlayerIsExist(id), "Player when creating dummy player") {
		return
	}
	player, _ := database.GetOnlyPlayer(id)
	/*get competition data*/
	participant, _ := database.GetParticipant(player.ParticipantId)
	competitionId := participant.CompetitionID
	unassignedLaneId := database.GetCompetitionUnassignedLaneId(competitionId)
	unassigendGroupId := database.GetCompetitionUnassignedGroupId(competitionId)
	/*copy data*/
	var data database.Player
	data.ParticipantId = player.ParticipantId
	data.GroupId = unassigendGroupId
	data.LaneId = unassignedLaneId
	data.Name = player.Name
	data.TotalScore = -1
	data.ShootOffScore = -1
	data.Rank = -1
	data.Order = -1
	newDummy, err := database.CreatePlayer(data)
	if response.ErrorInternalErrorTest(context, newDummy.ID, "Create Dummy Player", err) {
		return
	}
	response.AcceptPrint(newDummy.ID, fmt.Sprint(newDummy), "Create Dummy Player")
	context.IndentedJSON(200, newDummy)
}
