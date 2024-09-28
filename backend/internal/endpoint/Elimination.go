package endpoint

import (
	"backend/internal/database"
	response "backend/internal/response"
	"fmt"

	"github.com/gin-gonic/gin"
)

func IsGetEliminationById(context *gin.Context) (bool, database.Elimination) {
	id := Convert2uint(context, "id")
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

func IsGetEliminationWStagesMatchesById(context *gin.Context) (bool, database.Elimination) {
	id := Convert2uint(context, "id")
	data, err := database.GetEliminationWStagesMatchesById(id)
	isExist := (data.ID == id)
	if response.ErrorIdTest(context, id, isExist, "Elimination") {
		return false, database.Elimination{}
	} else if response.ErrorInternalErrorTest(context, id, "Get Elimination with stages, matches", err) {
		return false, data
	}
	response.AcceptPrint(id, fmt.Sprint(data), "Elimination with stages, matches")
	return true, data
}

// Get one Elimination By ID godoc
//
//	@Summary		Show only one Elimination
//	@Description	Get only one Elimination by id
//	@Tags			Elimination
//	@Produce		json
//	@Param			id	path		int																							true	"Elimination ID"
//	@Success		200	{object}	database.Elimination{player_sets=response.Nill,stages=response.Nill,medals=response.Nill}	"success, return one Elimination without related data"
//	@Failure		400	{object}	response.ErrorIdResponse																	"invalid Elimination ID, maybe not exist"
//	@Failure		500	{object}	response.ErrorInternalErrorResponse															"internal db error for Get Elimination"
//	@Router			/elimination/{id} [get]
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
//	@Param			id	path		int																														true	"Elimination ID"
//	@Success		200	{object}	database.Elimination{player_sets=database.PlayerSet{players=response.Nill},stages=response.Nill,medals=response.Nill}	"success, return one Elimination with player sets"
//	@Failure		400	{object}	response.ErrorIdResponse																								"invalid Elimination ID, maybe not exist"
//	@Failure		500	{object}	response.ErrorInternalErrorResponse																						"internal db error for Get Elimination"
//	@Router			/elimination/playersets/{id} [get]
func GetEliminationWPlayerSetsById(context *gin.Context) {
	id := Convert2uint(context, "id")
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

// Get one Elimination By ID with stages, matches godoc
//
//	@Summary		Show one Elimination with stages, matches
//	@Description	Get one Elimination with stages, matches by id
//	@Tags			Elimination
//	@Produce		json
//	@Param			id	path		int																																				true	"Elimination ID"
//	@Success		200	{object}	database.Elimination{stages=database.Stage{matches=database.Match{MatchResult=response.Nill}},medals=response.Nill,player_sets=response.Nill}	"success, return one Elimination with stages, matches"
//	@Failure		400	{object}	response.ErrorIdResponse																														"invalid Elimination ID, maybe not exist"
//	@Failure		500	{object}	response.ErrorInternalErrorResponse																												"internal db error for Get Elimination"
//	@Router			/elimination/stages/matches/{id} [get]
func GetEliminationWStagesMatchesById(context *gin.Context) {
	isExist, data := IsGetEliminationWStagesMatchesById(context)
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
//	@Param			id	path		int																		true	"Elimination ID"
//	@Success		200	{object}	database.Elimination{medals=response.Nill,player_sets=response.Nill}	"success, return one Elimination with all scores"
//	@Failure		400	{object}	response.ErrorIdResponse												"invalid Elimination ID, maybe not exist"
//	@Failure		500	{object}	response.ErrorInternalErrorResponse										"internal db error for Get Elimination"
//	@Router			/elimination/scores/{id} [get]
func GetEliminationWScoresById(context *gin.Context) {
	id := Convert2uint(context, "id")
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
//	@Param			id	path		int									true	"Elimination ID"
//	@Success		200	{object}	database.Elimination				"success, return one Elimination with all related data"
//	@Failure		400	{object}	response.ErrorIdResponse			"invalid Elimination ID, maybe not exist"
//	@Failure		500	{object}	response.ErrorInternalErrorResponse	"internal db error for Get Elimination"
//	@Router			/elimination/stages/scores/medals/{id} [get]
func GetEliminationById(context *gin.Context) {
	id := Convert2uint(context, "id")
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
//	@Param			matchid	path		int									true	"Match ID"
//	@Success		200		{object}	database.Match						"success, return one Match with all related data"
//	@Failure		400		{object}	response.ErrorIdResponse			"invalid Match ID, maybe not exist"
//	@Failure		500		{object}	response.ErrorInternalErrorResponse	"internal db error for Get Match"
//	@Router			/elimination/match/scores/{matchid} [get]
func GetMatchWScoresById(context *gin.Context) {
	id := Convert2uint(context, "matchid")
	if response.ErrorIdTest(context, id, database.GetMatchIsExist(id), "Match") {
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
//	@Param			Elimination	body		endpoint.PostElimination.PostEliminationData												true	"Elimination"
//	@Success		200			{object}	database.Elimination{player_sets=response.Nill,stages=response.Nill,medals=response.Nill}	"success, return one Elimination with new id"
//	@Failure		400			{object}	response.ErrorIdResponse																	"invalid group ID, maybe not exist"
//	@Failure		500			{object}	response.ErrorInternalErrorResponse															"internal db error for Create Elimination"
//	@Router			/elimination [post]
func PostElimination(context *gin.Context) {
	type PostEliminationData struct {
		GroupId  uint `json:"group_id"`
		TeamSize int  `json:"team_size"`
	}
	_ = PostEliminationData{}
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
//	@Param			Stage	body		endpoint.PostStage.PostStageData		true	"Stage"
//	@Success		200		{object}	database.Stage{matchs=response.Nill}	"success, return one Stage with new id"
//	@Failure		400		{object}	response.ErrorIdResponse				"invalid elimination ID, maybe not exist"
//	@Failure		500		{object}	response.ErrorInternalErrorResponse		"internal db error for Create Stage"
//	@Router			/elimination/stage [post]
func PostStage(context *gin.Context) {
	type PostStageData struct {
		EliminationId uint `json:"elimination_id"`
	}
	_ = PostStageData{}
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
//	@Description	Each matchResults with 4 or 5 matchEnds with different teamSize
//	@Description	Each matchEnds with 3, 4, 6 matchScores with different teamSize
//	@Description	input PlayerSetIds should have 2 playerSets in the same elimination
//	@Description	input LaneNumbers should have 2 laneNumbers for each playerset
//	@Tags			Elimination
//	@Accept			json
//	@Produce		json
//	@Param			Match	body		endpoint.PostMatch.MatchData		true	"Match"
//	@Success		200		{object}	database.Match						"success, return one Match with new id"
//	@Failure		400		{object}	response.ErrorIdResponse			"invalid stage ID, maybe not exist, or player set id should be 2, lane numbers should be 2"
//	@Failure		500		{object}	response.ErrorInternalErrorResponse	"internal db error for Create Match, MatchResult, MatchEnd, MatchScore, or get Stage"
//	@Router			/elimination/match [post]
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
	/*get elimination teamsize*/
	elimination, err := database.GetOnlyEliminationById(eliminationId)
	if response.ErrorInternalErrorTest(context, eliminationId, "Get Elimination when creating match", err) {
		return
	}
	teamSize := elimination.TeamSize
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
		/*create matchEnd*/
		var loopTime int
		if teamSize == 1 {
			loopTime = 5
		} else {
			loopTime = 4
		}
		for j := 0; j < loopTime; j++ {
			success := PostMatchEndByMatchResultId(context, newMatchResult.ID, teamSize)
			if !success {
				return
			}
		}
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
//	@Param			id	path		int									true	"Elimination ID"
//	@Success		200	{object}	response.Nill						"success, return one Elimination with new current stage"
//	@Failure		400	{object}	response.ErrorIdResponse			"invalid Elimination ID, maybe not exist"
//	@Failure		500	{object}	response.ErrorInternalErrorResponse	"internal db error for Update Elimination CurrentStage"
//	@Router			/elimination/currentstage/plus/{id} [patch]
func PutEliminationCurrentStagePlusById(context *gin.Context) {
	id := Convert2uint(context, "id")
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
//	@Param			id	path		int									true	"Elimination ID"
//	@Success		200	{object}	response.Nill						"success, return one Elimination with new current stage"
//	@Failure		400	{object}	response.ErrorIdResponse			"invalid Elimination ID, maybe not exist"
//	@Failure		500	{object}	response.ErrorInternalErrorResponse	"internal db error for Update Elimination CurrentStage"
//	@Router			/elimination/currentstage/minus/{id} [patch]
func PutEliminationCurrentStageMinusById(context *gin.Context) {
	id := Convert2uint(context, "id")
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
//	@Param			id	path		int									true	"Elimination ID"
//	@Success		200	{object}	response.Nill						"success, return one Elimination with new current end"
//	@Failure		400	{object}	response.ErrorIdResponse			"invalid Elimination ID, maybe not exist"
//	@Failure		500	{object}	response.ErrorInternalErrorResponse	"internal db error for Update Elimination CurrentStage"
//	@Router			/elimination/currentend/plus/{id} [patch]
func PutEliminationCurrentEndPlusById(context *gin.Context) {
	id := Convert2uint(context, "id")
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
//	@Param			id	path		int									true	"Elimination ID"
//	@Success		200	{object}	response.Nill						"success, return one Elimination with new current end"
//	@Failure		400	{object}	response.ErrorIdResponse			"invalid Elimination ID, maybe not exist"
//	@Failure		500	{object}	response.ErrorInternalErrorResponse	"internal db error for Update Elimination CurrentStage"
//	@Router			/elimination/currentend/minus/{id} [patch]
func PutEliminationCurrentEndMinusById(context *gin.Context) {
	id := Convert2uint(context, "id")
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
//	@Param			id	path		int									true	"Elimination ID"
//	@Success		200	{object}	response.DeleteSuccessResponse		"success, return delete success message"
//	@Failure		400	{object}	response.ErrorIdResponse			"invalid Elimination ID, maybe not exist, or already deleted"
//	@Failure		500	{object}	response.ErrorInternalErrorResponse	"internal db error for Delete Elimination"
//	@Router			/elimination/{id} [delete]
func DeleteElimination(context *gin.Context) {
	id := Convert2uint(context, "id")
	isChanged, err := database.DeleteElimination(id)
	if response.ErrorInternalErrorTest(context, id, "Delete Elimination", err) {
		return
	}
	response.AcceptDeleteSuccess(context, id, isChanged, "Elimination")
}
