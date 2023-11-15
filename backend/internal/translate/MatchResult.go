package translate

import (
	"backend/internal/database"
	response "backend/internal/translate/Response"
	"fmt"

	"github.com/gin-gonic/gin"
)

func IsGetMatchResult(context *gin.Context, uid uint) (bool, database.MatchResult) {
	id := int(uid) // require review after player branch merge
	if response.ErrorIdTest(context, id, database.GetMatchResultIsExist(uid), "MatchResult") {
		return false, database.MatchResult{}
	}
	data, err := database.GetMatchResultById(uid)
	if response.ErrorInternalErrorTest(context, id, "Get MatchResult", err) {
		return false, data
	}
	response.AcceptPrint(id, fmt.Sprint(data), "MatchResult")
	return true, data
}

func IsGetMatchResultWScoresById(context *gin.Context, uid uint) (bool, database.MatchResult) {
	id := int(uid) // require review after player branch merge
	if response.ErrorIdTest(context, id, database.GetMatchResultIsExist(uid), "MatchResult") {
		return false, database.MatchResult{}
	}
	data, err := database.GetMatchResultWScoresById(uid)
	if response.ErrorInternalErrorTest(context, id, "Get MatchResult with scores", err) {
		return false, data
	}
	response.AcceptPrint(id, fmt.Sprint(data), "MatchResult with scores")
	return true, data
}

// Get only MatchResult By ID godoc
//
//	@Summary		Show one MatchResult
//	@Description	Get one MatchResult without other data by id
//	@Tags			MatchResult
//	@Produce		json
//	@Param			id	path	int	true	"MatchResult ID"
//	@Success		200	string	string
//	@Failure		400	string	string
//	@Router			/api/matchresult/{id} [get]
func GetMatchResultById(context *gin.Context) {
	uid := convert2uint(context, "id")
	isExist, data := IsGetMatchResult(context, uid)
	if !isExist {
		return
	}
	context.IndentedJSON(200, data)
}

// Get MatchResult with scores By ID godoc
//
//	@Summary		Show one MatchResult with match_ends and match_scores
//	@Description	Get one MatchResult with match_ends and match_scores by id
//	@Tags			MatchResult
//	@Produce		json
//	@Param			id	path	int	true	"MatchResult ID"
//	@Success		200	string	string
//	@Failure		400	string	string
//	@Router			/api/matchresult/scores/{id} [get]
func GetMatchResultWScoresById(context *gin.Context) {
	uid := convert2uint(context, "id")
	isExist, data := IsGetMatchResultWScoresById(context, uid)
	if !isExist {
		return
	}
	context.IndentedJSON(200, data)
}

// Post MatchResult godoc
//
//	@Summary		Create one MatchResult
//	@Description	Post one new MatchResult data with new id, and auto write totalPoints ShootOffScore IsWinner
//	@Tags			MatchResult
//	@Accept			json
//	@Produce		json
//	@Param			MatchResult	body	string	true	"MatchResult"
//	@Success		200			string	string
//	@Failure		400			string	string
//	@Router			/api/matchresult [post]
func PostMatchResult(context *gin.Context) {
	var data database.MatchResult
	context.BindJSON(&data)
	id := int(data.ID) // require review after player branch merge
	if response.ErrorIdTest(context, int(data.MatchId), database.GetMatchIsExist(data.MatchId), "Match when creating MatchResult") {
		return
	}
	data.TotalPoints = 0
	data.ShootOffScore = -1
	data.IsWinner = false
	newData, err := database.CreateMatchResult(data)
	if response.ErrorInternalErrorTest(context, id, "Post MatchResult", err) {
		return
	}
	_, newData = IsGetMatchResultWScoresById(context, newData.ID)
	response.AcceptPrint(id, fmt.Sprint(newData), "MatchResult")
	context.IndentedJSON(200, newData)
}
func PostMatchEnd(context *gin.Context, matchResultId uint) bool {
	var data database.MatchEnd
	if response.ErrorIdTest(context, int(matchResultId), database.GetMatchResultIsExist(matchResultId), "MatchResult when creating matchEnd") {
		return false
	}
	data.MatchResultId = matchResultId
	data.TotalScore = 0
	data.IsConfirmed = false
	newData, err := database.CreateMatchEnd(data)
	if response.ErrorInternalErrorTest(context, int(matchResultId), "Post MatchEnd", err) {
		return false
	}
	/*create arrows*/
	teamsize, err := database.GetEliminationTeamSizeByMatchResultId(matchResultId)
	if response.ErrorInternalErrorTest(context, int(matchResultId), "Get Elimination TeamSize by matchResultId", err) {
		return false
	}
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

	response.AcceptPrint(int(matchResultId), fmt.Sprint(data), "MatchEnd")
	return true
}
func PostMatchScore(context *gin.Context, matchEndId uint) bool {
	var data database.MatchScore
	if response.ErrorIdTest(context, int(matchEndId), database.GetMatchEndIsExist(matchEndId), "MatchEnd when creating matchScore") {
		return false
	}
	data.MatchEndId = matchEndId
	data.Score = -1
	_, err := database.CreateMatchScore(data)
	if response.ErrorInternalErrorTest(context, int(matchEndId), "Post MatchScore", err) {
		return false
	}
	response.AcceptPrint(int(matchEndId), fmt.Sprint(data), "MatchScore")
	return true
}

func PutMatchResultTotalPointsById(context *gin.Context) {
	id := convert2uint(context, "id")
	var data database.MatchResult
	err := context.BindJSON(&data)
	if response.ErrorIdTest(context, int(id), database.GetMatchResultIsExist(id), "MatchResult when updating totalPoints") {
		return
	} else if response.ErrorReceiveDataTest(context, int(id), "MatchResult when updating totalPoints", err) {
		return
	} else if response.ErrorReceiveDataNilTest(context, int(id), data.TotalPoints, "MatchResult when updating totalPoints, totalPoints is nil") {
		return
	}
	err = database.UpdateMatchResultTotalPointsById(id, data.TotalPoints)
	if response.ErrorInternalErrorTest(context, int(id), "Update MatchResult totalPoints", err) {
		return
	}
	response.AcceptPrint(int(id), fmt.Sprint(data), "MatchResult totalPoints")
	context.IndentedJSON(200, nil)
}

// Delete MatchResult By ID godoc
//
//	@Summary		Delete one MatchResult
//	@Description	Delete one MatchResult with matchEnds and matchScores by id
//	@Tags			MatchResult
//	@Produce		json
//	@Param			id	path	int	true	"MatchResult ID"
//	@Success		200	string	string
//	@Failure		400	string	string
//	@Router			/api/matchresult/{id} [delete]
func DeleteMatchResultById(context *gin.Context) {
	id := convert2uint(context, "id")
	if response.ErrorIdTest(context, int(id), database.GetMatchResultIsExist(id), "MatchResult") {
		return
	}
	err := database.DeleteMatchResultById(id)
	if response.ErrorInternalErrorTest(context, int(id), "Delete MatchResult", err) {
		return
	}
	response.AcceptPrint(int(id), fmt.Sprint(id), "MatchResult")
	context.IndentedJSON(200, nil)
}
