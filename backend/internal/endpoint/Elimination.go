package endpoint

import (
	"backend/internal/database"
	response "backend/internal/response"
	"fmt"

	"github.com/gin-gonic/gin"
)

func IsGetEliminationById(context *gin.Context) (bool, database.Elimination) {
	id := convert2uint(context, "id")
	data, err := database.GetOnlyEliminationById(id)
	isExist := (data.ID == id)
	if response.ErrorIdTest(context, id, isExist, "Elimination") {
		return false, database.Elimination{}
	} else if response.ErrorInternalErrorTest(context, id, "Get Elimination", err) {
		return false, data
	}
	response.AcceptPrint(id, fmt.Sprint(data), "Elimination")
	return true, data
}

func IsGetEliminationWStagesById(context *gin.Context) (bool, database.Elimination) {
	id := convert2uint(context, "id")
	data, err := database.GetEliminationWStagesById(id)
	isExist := (data.ID == id)
	if response.ErrorIdTest(context, id, isExist, "Elimination") {
		return false, database.Elimination{}
	} else if response.ErrorInternalErrorTest(context, id, "Get Elimination with stages", err) {
		return false, data
	}
	response.AcceptPrint(id, fmt.Sprint(data), "Elimination with stages")
	return true, data
}

// Get one Elimination By ID godoc
//
//	@Summary		Show one Elimination
//	@Description	Get one Elimination by id
//	@Tags			Elimination
//	@Produce		json
//	@Param			id	path	int	true	"Elimination ID"
//	@Success		200	string	string
//	@Failure		400	string	string
//	@Router			/api/elimination/{id} [get]
func GetOnlyEliminationById(context *gin.Context) {
	isExist, data := IsGetEliminationById(context)
	if !isExist {
		return
	}
	context.IndentedJSON(200, data)
}

// Get one Elimination By ID with player sets godoc
//
//	@Summary		Show one Elimination with player sets
//	@Description	Get one Elimination with player sets by id
//	@Tags			Elimination
//	@Produce		json
//	@Param			id	path	int	true	"Elimination ID"
//	@Success		200	string	string
//	@Failure		400	string	string
//	@Router			/api/elimination/playersets/{id} [get]
func GetEliminationWPlayerSetsById(context *gin.Context) {
	id := convert2uint(context, "id")
	isExist, _ := IsGetEliminationById(context)
	if !isExist {
		return
	}
	data, err := database.GetEliminationWPlayerSetsById(id)
	if response.ErrorInternalErrorTest(context, id, "Get Elimination with player sets", err) {
		return
	}
	response.AcceptPrint(id, fmt.Sprint(data), "Elimination with player sets")
	context.IndentedJSON(200, data)
}

// Get one Elimination By ID with stages godoc
//
//	@Summary		Show one Elimination with stages
//	@Description	Get one Elimination with stages by id
//	@Tags			Elimination
//	@Produce		json
//	@Param			id	path	int	true	"Elimination ID"
//	@Success		200	string	string
//	@Failure		400	string	string
//	@Router			/api/elimination/stages/{id} [get]
func GetEliminationWStagesById(context *gin.Context) {
	isExist, data := IsGetEliminationWStagesById(context)
	if !isExist {
		return
	}
	context.IndentedJSON(200, data)
}

// Get one Elimination By ID with all scores godoc
//
//	@Summary		Show one Elimination with all scores
//	@Description	Get one Elimination with stages, matches, matchResults, matchEnds, scores by id
//	@Tags			Elimination
//	@Produce		json
//	@Param			id	path	int	true	"Elimination ID"
//	@Success		200	string	string
//	@Failure		400	string	string
//	@Router			/api/elimination/scores/{id} [get]
func GetEliminationWScoresById(context *gin.Context) {
	id := convert2uint(context, "id")
	isExist, _ := IsGetEliminationById(context)
	if !isExist {
		return
	}
	data, err := database.GetEliminationWScoresById(id)
	if response.ErrorInternalErrorTest(context, id, "Get Elimination with scores", err) {
		return
	}
	response.AcceptPrint(id, fmt.Sprint(data), "Elimination with scores")
	context.IndentedJSON(200, data)
}

// Get one Elimination By ID with all related data godoc
//
//	@Summary		Show one Elimination with all related data
//	@Description	Get one Elimination with stages, matches, matchResults, matchEnds, scores, playerSets, players, medals by id
//	@Tags			Elimination
//	@Produce		json
//	@Param			id	path	int	true	"Elimination ID"
//	@Success		200	string	string
//	@Failure		400	string	string
//	@Router			/api/elimination/stages/scores/medals/{id} [get]
func GetEliminationById(context *gin.Context) {
	id := convert2uint(context, "id")
	isExist, _ := IsGetEliminationById(context)
	if !isExist {
		return
	}
	data, err := database.GetEliminationById(id)
	if response.ErrorInternalErrorTest(context, id, "Get Elimination", err) {
		return
	}
	response.AcceptPrint(id, fmt.Sprint(data), "Elimination")
	context.IndentedJSON(200, data)
}

// Get one Match By ID with all related data godoc
//
//	@Summary		Show one Match with all related data
//	@Description	Get one Match with matchResults, matchEnds, scores, playerSets, players by id
//	@Tags			Elimination
//	@Produce		json
//	@Param			matchid	path	int	true	"Match ID"
//	@Success		200	string	string
//	@Failure		400	string	string
//	@Router			/api/elimination/match/scores/{matchid} [get]
func GetMatchWScoresById(context *gin.Context) {
	id := convert2uint(context, "matchid")
	isExist := database.GetMatchIsExist(id)
	if !isExist {
		return
	}
	data, err := database.GetMatchWScoresById(id)
	if response.ErrorInternalErrorTest(context, id, "Get Match with scores", err) {
		return
	}
	response.AcceptPrint(id, fmt.Sprint(data), "Match with scores")
	context.IndentedJSON(200, data)
}

func PostEliminationById(context *gin.Context, data database.Elimination) (bool, database.Elimination) {
	newdata, err := database.CreateElimination(data)
	if response.ErrorInternalErrorTest(context, newdata.ID, "Create Elimination", err) {
		return false, database.Elimination{}
	}
	id := newdata.ID
	/*create medals*/
	for i := 0; i < 3; i++ {
		var medal database.Medal
		medal.EliminationId = id
		medal.Type = i
		medal, err = database.CreateMedal(medal)
		if response.ErrorInternalErrorTest(context, id, "Create Medal when creating elimination", err) {
			return false, database.Elimination{}
		}
	}
	response.AcceptPrint(id, fmt.Sprint(newdata), "Elimination")
	return true, newdata
}

// Post one Elimination godoc
//
//	@Summary		Create one Elimination
//	@Description	Post one new Elimination data, and three medals
//	@Tags			Elimination
//	@Accept			json
//	@Produce		json
//	@Param			Elimination	body	string	true	"Elimination"
//	@Success		200			string	string
//	@Failure		400			string	string
//	@Router			/api/elimination [post]
func PostElimination(context *gin.Context) {
	var data database.Elimination
	err := context.BindJSON(&data)
	if response.ErrorReceiveDataTest(context, 0, "Elimination", err) {
		return
	} else if response.ErrorIdTest(context, data.GroupId, database.GetGroupIsExist(data.GroupId), "group when creating elimination") {
		return
	}
	data.CurrentEnd = 0
	data.CurrentStage = 0
	success, newData := PostEliminationById(context, data)
	if !success {
		return
	}
	context.IndentedJSON(200, newData)
}

// Post one Stage godoc
//
//	@Summary		Create one Stage
//	@Description	Post one new Stage data with new id
//	@Tags			Elimination
//	@Accept			json
//	@Produce		json
//	@Param			Stage	body	string	true	"Stage"
//	@Success		200		string	string
//	@Failure		400		string	string
//	@Router			/api/elimination/stage [post]
func PostStage(context *gin.Context) {
	var data database.Stage
	err := context.BindJSON(&data)
	if response.ErrorReceiveDataTest(context, 0, "Stage", err) {
		return
	} else if response.ErrorIdTest(context, data.EliminationId, database.GetEliminationIsExist(data.EliminationId), "elimintion when creating stage") {
		return
	}
	data, err = database.CreateStage(data)
	if response.ErrorInternalErrorTest(context, 0, "Create Stage", err) {
		return
	}
	id := data.ID
	response.AcceptPrint(id, fmt.Sprint(data), "Stage")
	context.IndentedJSON(200, data)
}

// Post one Match godoc
//
//	@Summary		Create one Match
//	@Description	Post one new Match data with 2 matchResults
//	@Tags			Elimination
//	@Accept			json
//	@Produce		json
//	@Param			Match	body	string	true	"Match"
//	@Success		200		string	string
//	@Failure		400		string	string
//	@Router			/api/elimination/match [post]
func PostMatch(context *gin.Context) {
	type MatchData struct {
		StageId      uint   `json:"stage_id"`
		PlayerSetIds []uint `json:"player_set_ids"`
		LaneNumbers  []int  `json:"lane_numbers"`
	}
	var data MatchData
	/*check request data*/
	err := context.BindJSON(&data)
	if response.ErrorReceiveDataTest(context, 0, "Match", err) {
		return
	} else if response.ErrorIdTest(context, data.StageId, database.GetStageIsExist(data.StageId), "stage when creating match") {
		return
	} else if len(data.PlayerSetIds) != 2 {
		response.ErrorReceiveDataFormat(context, " player set ids should be 2")
	} else if len(data.LaneNumbers) != 2 {
		response.ErrorReceiveDataFormat(context, "lane numbers should be 2")
	}
	/*id existence*/
	stage, err := database.GetStageById(data.StageId)
	if response.ErrorInternalErrorTest(context, 0, "Get Stage when creating match", err) {
		return
	}
	eliminationId := stage.EliminationId
	for i := 0; i < 2; i++ {
		isExist, PlayerSet := IsGetPlayerSetById(context, data.PlayerSetIds[i])
		if !isExist {
			return
		} else if PlayerSet.EliminationId != eliminationId {
			response.ErrorReceiveDataFormat(context, "player set id should be in the same elimination")
			return
		}
	}
	/*create match*/
	var match database.Match
	match.StageId = data.StageId
	match, err = database.CreateMatch(match)
	if response.ErrorInternalErrorTest(context, 0, "Create Match", err) {
		return
	}
	/*create two matchResults */
	for i := 0; i < 2; i++ {
		var matchResult database.MatchResult
		matchResult.MatchId = match.ID
		matchResult.PlayerSetId = data.PlayerSetIds[i]
		matchResult.LaneNumber = data.LaneNumbers[i]
		matchResult.ShootOffScore = -1
		newMatchResult, err := database.CreateMatchResult(matchResult)
		if response.ErrorInternalErrorTest(context, newMatchResult.ID, "Create MatchResult when creating match", err) {
			return
		}
		response.AcceptPrint(newMatchResult.ID, fmt.Sprint(newMatchResult), "MatchResult")
	}
	/*get new data*/
	newData, err := database.GetMatchWScoresById(match.ID)
	if response.ErrorInternalErrorTest(context, 0, "Get Match with scores when creating match", err) {
		return
	}
	response.AcceptPrint(newData.ID, fmt.Sprint(newData), "Match")
	context.IndentedJSON(200, newData)
}

// Put elimination current stage plus one by id
//
//	@Summary		Update one Elimination current stage plus one
//	@Description	Update one Elimination current stage plus one by id
//	@Tags			Elimination
//	@Param			id	path	int	true	"Elimination ID"
//	@Success		200	string	string
//	@Failure		400	string	string
//	@Router			/api/elimination/currentstage/plus/{id} [put]
func PutEliminationCurrentStagePlusById(context *gin.Context) {
	id := convert2uint(context, "id")
	isExist, _ := IsGetEliminationById(context)
	if !isExist {
		return
	}
	error := database.UpdateEliminationCurrentStagePlus(id)
	if response.ErrorInternalErrorTest(context, id, "Update Elimination CurrentStage", error) {
		return
	}
	context.IndentedJSON(200, nil)
}

// Put elimination current stage minus one by id
//
//	@Summary		Update one Elimination current stage minus one
//	@Description	Update one Elimination current stage minus one by id
//	@Tags			Elimination
//	@Param			id	path	int	true	"Elimination ID"
//	@Success		200	string	string
//	@Failure		400	string	string
//	@Router			/api/elimination/currentstage/minus/{id} [put]
func PutEliminationCurrentStageMinusById(context *gin.Context) {
	id := convert2uint(context, "id")
	isExist, _ := IsGetEliminationById(context)
	if !isExist {
		return
	}
	error := database.UpdateEliminationCurrentStageMinus(id)
	if response.ErrorInternalErrorTest(context, id, "Update Elimination CurrentStage", error) {
		return
	}
	context.IndentedJSON(200, nil)
}

// Put elimination current end plus one by id
//
//	@Summary		Update one Elimination current end plus one
//	@Description	Update one Elimination current end plus one by id
//	@Tags			Elimination
//	@Param			id	path	int	true	"Elimination ID"
//	@Success		200	string	string
//	@Failure		400	string	string
//	@Router			/api/elimination/currentend/plus/{id} [put]
func PutEliminationCurrentEndPlusById(context *gin.Context) {
	id := convert2uint(context, "id")
	isExist, _ := IsGetEliminationById(context)
	if !isExist {
		return
	}
	error := database.UpdateEliminationCurrentEndPlus(id)
	if response.ErrorInternalErrorTest(context, id, "Update Elimination CurrentStage", error) {
		return
	}
	context.IndentedJSON(200, nil)
}

// Put elimination current end minus one by id
//
//	@Summary		Update one Elimination current end minus one
//	@Description	Update one Elimination current end minus one by id
//	@Tags			Elimination
//	@Param			id	path	int	true	"Elimination ID"
//	@Success		200	string	string
//	@Failure		400	string	string
//	@Router			/api/elimination/currentend/minus/{id} [put]
func PutEliminationCurrentEndMinusById(context *gin.Context) {
	id := convert2uint(context, "id")
	isExist, _ := IsGetEliminationById(context)
	if !isExist {
		return
	}
	error := database.UpdateEliminationCurrentEndMinus(id)
	if response.ErrorInternalErrorTest(context, id, "Update Elimination CurrentStage", error) {
		return
	}
	context.IndentedJSON(200, nil)
}

// Delete Elimination godoc
//
//	@Summary		Delete one Elimination, and related stages and matches
//	@Description	Delete one Elimination by id, and related stages and matches
//	@Tags			Elimination
//	@Accept			json
//	@Produce		json
//	@Param			id	path	int	true	"Elimination ID"
//	@Success		200	string	string
//	@Success		204	string	string
//	@Failure		400	string	string
//	@Router			/api/elimination/{id} [delete]
func DeleteElimination(context *gin.Context) {
	id := convert2uint(context, "id")
	isChanged, err := database.DeleteElimination(id)
	if response.ErrorInternalErrorTest(context, id, "Delete Elimination", err) {
		return
	}
	response.AcceptDeleteSuccess(context, id, isChanged, "Elimination")
}
