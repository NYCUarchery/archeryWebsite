package endpoint

import (
	"backend/internal/database"
	response "backend/internal/response"
	"fmt"

	"github.com/gin-gonic/gin"
)

func IsGetMatchResult(context *gin.Context, id uint) (bool, database.MatchResult) {
	if response.ErrorIdTest(context, id, database.GetMatchResultIsExist(id), "MatchResult") {
		return false, database.MatchResult{}
	}
	data, err := database.GetMatchResultById(id)
	if response.ErrorInternalErrorTest(context, id, "Get MatchResult", err) {
		return false, data
	}
	response.AcceptPrint(id, fmt.Sprint(data), "MatchResult")
	return true, data
}

func IsGetMatchResultWScoresById(context *gin.Context, id uint) (bool, database.MatchResult) {
	if response.ErrorIdTest(context, id, database.GetMatchResultIsExist(id), "MatchResult") {
		return false, database.MatchResult{}
	}
	data, err := database.GetMatchResultWScoresById(id)
	if response.ErrorInternalErrorTest(context, id, "Get MatchResult with scores", err) {
		return false, data
	}
	response.AcceptPrint(id, fmt.Sprint(data), "MatchResult with scores")
	return true, data
}

// Get MatchResult By ID godoc
//
//	@Summary		Show one MatchResult with player set
//	@Description	Get one MatchResult with player set by id
//	@Tags			MatchResult
//	@Produce		json
//	@Param			id	path	int	true	"MatchResult ID"
//	@Success		200	string	string
//	@Failure		400	string	string
//	@Router			/api/matchresult/{id} [get]
func GetMatchResultById(context *gin.Context) {
	uid := Convert2uint(context, "id")
	isExist, data := IsGetMatchResult(context, uid)
	if !isExist {
		return
	}
	context.IndentedJSON(200, data)
}

// Get MatchResult with scores By ID godoc
//
//	@Summary		Show one MatchResult with match_ends, match_scores, player set
//	@Description	Get one MatchResult with match_ends, match_scores, player set by id
//	@Tags			MatchResult
//	@Produce		json
//	@Param			id	path	int	true	"MatchResult ID"
//	@Success		200	string	string
//	@Failure		400	string	string
//	@Router			/api/matchresult/scores/{id} [get]
func GetMatchResultWScoresById(context *gin.Context) {
	uid := Convert2uint(context, "id")
	isExist, data := IsGetMatchResultWScoresById(context, uid)
	if !isExist {
		return
	}
	context.IndentedJSON(200, data)
}

func PostMatchEndByMatchResultId(context *gin.Context, matchResultId uint, teamsize int) bool {
	var data database.MatchEnd
	if response.ErrorIdTest(context, matchResultId, database.GetMatchResultIsExist(matchResultId), "MatchResult when creating matchEnd") {
		return false
	}
	data.MatchResultId = matchResultId
	data.TotalScore = 0
	data.IsConfirmed = false
	newData, err := database.CreateMatchEnd(data)
	if response.ErrorInternalErrorTest(context, matchResultId, "Post MatchEnd", err) {
		return false
	}
	/*create arrows*/
	var arrowNum int
	switch teamsize {
	case 1:
		arrowNum = 3
	case 2:
		arrowNum = 4
	case 3:
		arrowNum = 6
	default:
		arrowNum = 0
		return false
	}
	for i := 0; i < arrowNum; i++ {
		PostMatchScore(context, newData.ID)
	}
	response.AcceptPrint(matchResultId, fmt.Sprint(data), "MatchEnd")
	return true
}

// Post MatchEnd godoc
//
//	@Summary		Create one MatchEnd
//	@Description	Post one new MatchEnd data, and auto write totalScores IsConfirmed, and auto create matchScores by teamSize
//	@Tags			MatchEnd
//	@Accept			json
//	@Produce		json
//	@Param			matchEndData	body	string	true	"matchEndData"
//	@Success		200				string	string
//	@Failure		400				string	string
//	@Router			/api/matchresult/matchend [post]
func PostMatchEnd(context *gin.Context) {
	type matchEndData struct {
		MatchResultId uint `json:"match_result_id"`
		TeamSize      int  `json:"team_size"`
	}
	var data matchEndData
	err := context.BindJSON(&data)
	if response.ErrorReceiveDataTest(context, data.MatchResultId, "MatchEndData when creating matchEnd", err) {
		return
	} else if response.ErrorIdTest(context, data.MatchResultId, database.GetMatchResultIsExist(data.MatchResultId), "MatchResult when creating matchEnd") {
		return
	}
	/*create matchend*/
	isCreated := PostMatchEndByMatchResultId(context, data.MatchResultId, data.TeamSize)
	if !isCreated {
		return
	}
	context.IndentedJSON(200, nil)
}
func PostMatchScore(context *gin.Context, matchEndId uint) bool {
	var data database.MatchScore
	if response.ErrorIdTest(context, matchEndId, database.GetMatchEndIsExist(matchEndId), "MatchEnd when creating matchScore") {
		return false
	}
	data.MatchEndId = matchEndId
	data.Score = -1
	newData, err := database.CreateMatchScore(data)
	if response.ErrorInternalErrorTest(context, newData.ID, "Post MatchScore", err) {
		return false
	}
	response.AcceptPrint(newData.ID, fmt.Sprint(newData), "MatchScore")
	return true
}

// Put MatchResult totalpoints godoc
//
//	@Summary		Update one MatchResult totalPoints
//	@Description	Update one MatchResult totalPoints by id
//	@Tags			MatchResult
//	@Accept			json
//	@Param			id			path	int		true	"MatchResult ID"
//	@Param			MatchResult	body	string	true	"MatchResult"
//	@Success		200			string	string
//	@Failure		400			string	string
//	@Router			/api/matchresult/totalpoints/{id} [put]
func PutMatchResultTotalPointsById(context *gin.Context) {
	id := Convert2uint(context, "id")
	var data database.MatchResult
	err := context.BindJSON(&data)
	if response.ErrorIdTest(context, id, database.GetMatchResultIsExist(id), "MatchResult when updating totalPoints") {
		return
	} else if response.ErrorReceiveDataTest(context, id, "MatchResult when updating totalPoints", err) {
		return
	}
	err = database.UpdateMatchResultTotalPointsById(id, data.TotalPoints)
	if response.ErrorInternalErrorTest(context, id, "Update MatchResult totalPoints", err) {
		return
	}
	response.AcceptPrint(id, fmt.Sprint(data), "MatchResult totalPoints")
	context.IndentedJSON(200, nil)
}

// Put MatchResult shootOffScore godoc
//
//	@Summary		Update one MatchResult shootOffScore
//	@Description	Update one MatchResult shootOffScore by id
//	@Tags			MatchResult
//	@Accept			json
//	@Param			id			path	int		true	"MatchResult ID"
//	@Param			MatchResult	body	string	true	"MatchResult"
//	@Success		200			string	string
//	@Failure		400			string	string
//	@Router			/api/matchresult/shootoffscore/{id} [put]
func PutMatchResultShootOffScoreById(context *gin.Context) {
	id := Convert2uint(context, "id")
	var data database.MatchResult
	err := context.BindJSON(&data)
	if response.ErrorIdTest(context, id, database.GetMatchResultIsExist(id), "MatchResult when updating shootOffScore") {
		return
	} else if response.ErrorReceiveDataTest(context, id, "MatchResult when updating shootOffScore", err) {
		return
	}
	err = database.UpdateMatchShootOffScoreById(id, data.ShootOffScore)
	if response.ErrorInternalErrorTest(context, id, "Update MatchResult shootOffScore", err) {
		return
	}
	response.AcceptPrint(id, fmt.Sprint(data), "MatchResult shootOffScore")
	context.IndentedJSON(200, nil)
}

// Put MatchResult isWinner godoc
//
//	@Summary		Update one MatchResult isWinner
//	@Description	Update one MatchResult isWinner by id
//	@Tags			MatchResult
//	@Accept			json
//	@Param			id			path	int		true	"MatchResult ID"
//	@Param			MatchResult	body	string	true	"MatchResult"
//	@Success		200			string	string
//	@Failure		400			string	string
//	@Router			/api/matchresult/iswinner/{id} [put]
func PutMatchResultIsWinnerById(context *gin.Context) {
	id := Convert2uint(context, "id")
	var data database.MatchResult
	err := context.BindJSON(&data)
	if response.ErrorIdTest(context, id, database.GetMatchResultIsExist(id), "MatchResult when updating isWinner") {
		return
	} else if response.ErrorReceiveDataTest(context, id, "MatchResult when updating isWinner", err) {
		return
	}
	err = database.UpdateMatchResultIsWinnerById(id, data.IsWinner)
	if response.ErrorInternalErrorTest(context, id, "Update MatchResult isWinner", err) {
		return
	}
	response.AcceptPrint(id, fmt.Sprint(data), "MatchResult isWinner")
	context.IndentedJSON(200, nil)
}

// Put MatchResult laneNumber godoc
//
//	@Summary		Update one MatchResult laneNumber
//	@Description	Update one MatchResult laneNumber by id
//	@Tags			MatchResult
//	@Accept			json
//	@Param			id			path	int		true	"MatchResult ID"
//	@Param			MatchResult	body	string	true	"MatchResult"
//	@Success		200			string	string
//	@Failure		400			string	string
//	@Router			/api/matchresult/lanenumber/{id} [put]
func PutMatchResultLaneNumberById(context *gin.Context) {
	id := Convert2uint(context, "id")
	var data database.MatchResult
	err := context.BindJSON(&data)
	if response.ErrorIdTest(context, id, database.GetMatchResultIsExist(id), "MatchResult when updating laneNumber") {
		return
	} else if response.ErrorReceiveDataTest(context, id, "MatchResult when updating laneNumber", err) {
		return
	}
	err = database.UpdateMatchResultLaneNumberById(id, data.LaneNumber)
	if response.ErrorInternalErrorTest(context, id, "Update MatchResult laneNumber", err) {
		return
	}
	response.AcceptPrint(id, fmt.Sprint(data), "MatchResult laneNumber")
	context.IndentedJSON(200, nil)
}

// Put MatchEnd totalScores godoc
//
//	@Summary		Update one MatchEnd totalScores
//	@Description	Update one MatchEnd totalScores by id
//	@Tags			MatchEnd
//	@Accept			json
//	@Param			id			path	int		true	"MatchEnd ID"
//	@Param			MatchEnd	body	string	true	"MatchEnd"
//	@Success		200			string	string
//	@Failure		400			string	string
//	@Router			/api/matchend/totalscores/{id} [put]
func PutMatchEndsTotalScoresById(context *gin.Context) {
	id := Convert2uint(context, "id")
	var data database.MatchEnd
	err := context.BindJSON(&data)
	if response.ErrorIdTest(context, id, database.GetMatchEndIsExist(id), "MatchEnd when updating totalScores") {
		return
	} else if response.ErrorReceiveDataTest(context, id, "MatchEnd when updating totalScores", err) {
		return
	}
	err = database.UpdateMatchEndsTotalScoresById(id, data.TotalScore)
	if response.ErrorInternalErrorTest(context, id, "Update MatchEnd totalScores", err) {
		return
	}
	response.AcceptPrint(id, fmt.Sprint(data), "MatchEnd totalScores")
	context.IndentedJSON(200, nil)
}

// Put MatchEnds scores godoc
//
//	@Summary		Update one MatchEnd scores
//	@Description	Update one MatchEnd totalScores by id and all related MatchScores by MatchScore ids
//	@Description	MatchScore ids and scores must be the same length
//	@Tags			MatchEnd
//	@Accept			json
//	@Param			id					path	int		true	"MatchEnd ID"
//	@Param			matchEndScoresData	body	string	true	"matchEndScoresData"
//	@Success		200					string	string
//	@Failure		400					string	string
//	@Router			/api/matchend/scores/{id} [put]
func PutMatchEndsScoresById(context *gin.Context) {
	type matchEndScoresData struct {
		TotalScore    int    `json:"total_scores"`
		MatchScoreIds []uint `json:"match_score_ids"`
		Scores        []int  `json:"scores"`
	}
	matchEndId := Convert2uint(context, "id")
	var data matchEndScoresData
	err := context.BindJSON(&data)
	/*check data*/
	if response.ErrorIdTest(context, matchEndId, database.GetMatchEndIsExist(matchEndId), "MatchEnd when updating scores") {
		return
	} else if response.ErrorReceiveDataTest(context, matchEndId, "MatchEnd when updating scores", err) {
		return
	} else if len(data.MatchScoreIds) != len(data.Scores) {
		response.ErrorReceiveDataFormat(context, "matchScoreIds and scores length not match when updating scores")
		return
	}
	for i := 0; i < len(data.MatchScoreIds); i++ {
		if response.ErrorIdTest(context, data.MatchScoreIds[i], database.GetMatchScoreWMEndIdIsExist(data.MatchScoreIds[i], matchEndId), "MatchScore when updating scores") {
			return
		}
	}
	/*update data*/
	err = database.UpdateMatchEndsTotalScoresById(matchEndId, data.TotalScore)
	if response.ErrorInternalErrorTest(context, matchEndId, "Update MatchEnd totalScores when updating scores", err) {
		return
	}
	for i := 0; i < len(data.MatchScoreIds); i++ {
		err = database.UpdateMatchScoreScoresByMatchEndId(data.MatchScoreIds[i], matchEndId, data.Scores[i])
		if response.ErrorInternalErrorTest(context, data.MatchScoreIds[i], "Update MatchScore score when updating scores", err) {
			return
		}
	}
	context.IndentedJSON(200, nil)
}

// Put MatchEnd isConfirmed godoc
//
//	@Summary		Update one MatchEnd isConfirmed
//	@Description	Update one MatchEnd isConfirmed by id
//	@Tags			MatchEnd
//	@Accept			json
//	@Param			id			path	int		true	"MatchEnd ID"
//	@Param			MatchEnd	body	string	true	"MatchEnd"
//	@Success		200			string	string
//	@Failure		400			string	string
//	@Router			/api/matchend/isconfirmed/{id} [put]
func PutMatchEndsIsConfirmedById(context *gin.Context) {
	id := Convert2uint(context, "id")
	var data database.MatchEnd
	err := context.BindJSON(&data)
	if response.ErrorIdTest(context, id, database.GetMatchEndIsExist(id), "MatchEnd when updating isConfirmed") {
		return
	} else if response.ErrorReceiveDataTest(context, id, "MatchEnd when updating isConfirmed", err) {
		return
	}
	err = database.UpdateMatchEndsIsConfirmedById(id, data.IsConfirmed)
	if response.ErrorInternalErrorTest(context, id, "Update MatchEnd isConfirmed", err) {
		return
	}
	response.AcceptPrint(id, fmt.Sprint(data), "MatchEnd isConfirmed")
	context.IndentedJSON(200, nil)
}

// Put MatchScore score godoc
//
//	@Summary		Update one MatchScore score
//	@Description	Update one MatchScore score by id
//	@Tags			MatchScore
//	@Accept			json
//	@Param			id			path	int		true	"MatchScore ID"
//	@Param			MatchScore	body	string	true	"MatchScore"
//	@Success		200			string	string
//	@Failure		400			string	string
//	@Router			/api/matchscore/score/{id} [put]
func PutMatchScoreScoreById(context *gin.Context) {
	id := Convert2uint(context, "id")
	var data database.MatchScore
	err := context.BindJSON(&data)
	newScore := data.Score
	if response.ErrorIdTest(context, id, database.GetMatchScoreIsExist(id), "MatchScore when updating score") {
		return
	} else if response.ErrorReceiveDataTest(context, id, "MatchScore when updating score", err) {
		return
	}
	oldData, err := database.GetMatchScoreById(id)
	if response.ErrorInternalErrorTest(context, id, "Get MatchScore by id", err) {
		return
	}
	err = database.UpdateMatchScoreScoreById(id, newScore)
	if response.ErrorInternalErrorTest(context, id, "Update MatchScore score", err) {
		return
	}
	matchEnd, err := database.GetMatchEndById(oldData.MatchEndId)
	if response.ErrorInternalErrorTest(context, id, "Get MatchEnd by MatchScore id", err) {
		return
	}
	newScore = Scorefmt(newScore)
	oldScore := Scorefmt(oldData.Score)
	err = database.UpdateMatchEndsTotalScoresById(matchEnd.ID, matchEnd.TotalScore-oldScore+newScore)
	if response.ErrorInternalErrorTest(context, id, "Update MatchEnd totalScores", err) {
		return
	}
	response.AcceptPrint(id, fmt.Sprint(data), "MatchScore score")
	context.IndentedJSON(200, nil)
}

// Delete MatchResult By ID godoc
//
//	@Summary		Delete one MatchResult
//	@Description	Delete one MatchResult with matchEnds and matchScores by id
//	@Tags			MatchResult
//	@Param			id	path	int	true	"MatchResult ID"
//	@Success		200	string	string
//	@Failure		400	string	string
//	@Router			/api/matchresult/{id} [delete]
func DeleteMatchResultById(context *gin.Context) {
	id := Convert2uint(context, "id")
	if response.ErrorIdTest(context, id, database.GetMatchResultIsExist(id), "MatchResult") {
		return
	}
	err := database.DeleteMatchResultById(id)
	if response.ErrorInternalErrorTest(context, id, "Delete MatchResult", err) {
		return
	}
	response.AcceptPrint(id, fmt.Sprint(id), "MatchResult")
	context.IndentedJSON(200, nil)
}
