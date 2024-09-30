package endpoint

import (
	"backend/internal/database"
	"backend/internal/response"

	"fmt"

	"github.com/gin-gonic/gin"
)

func IsGetPlayerSetById(context *gin.Context, id uint) (bool, database.PlayerSet) {
	var playerSet database.PlayerSet
	isExist := database.GetPlayerSetIsExist(id)
	if !isExist {
		response.ErrorIdTest(context, id, isExist, "player set")
		return false, database.PlayerSet{}
	}
	playerSet, err := database.GetPlayerSetById(id)
	if err != nil {
		response.ErrorInternalErrorTest(context, id, "get player set by id", err)
		return false, database.PlayerSet{}
	}
	return true, playerSet
}

// Get player set with players by id
//
//	@Summary		Get player set with players by id
//	@Description	Get player set with players by id
//	@Tags			PlayerSet
//	@Produce		json
//	@Param			id	path		uint																						true	"Player Set ID"
//	@Success		200	{object}	database.PlayerSet{players=database.Player{rounds=response.Nill,player_sets=response.Nill}}	"success, return player set with players"
//	@Failure		400	{object}	response.ErrorIdResponse																	"invalid player set id, maybe not exist"
//	@Failure		500	{object}	response.ErrorInternalErrorResponse															"internal error for get player set by id"
//	@Router			/playerset/{id} [get]
func GetPlayerSetWPlayerById(context *gin.Context) {
	id := Convert2uint(context, "id")
	var isExist bool
	isExist, data := IsGetPlayerSetById(context, id)
	if !isExist {
		return
	}
	context.IndentedJSON(200, data)
}

// Get all player sets by elimination id
//
//	@Summary		Get all player sets by elimination id
//	@Description	Get all player sets by elimination id
//	@Tags			PlayerSet
//	@Produce		json
//	@Param			eliminationid	path		uint								true	"Elimination ID"
//	@Success		200				{object}	[]database.PlayerSet				"success"
//	@Failure		400				{object}	response.ErrorIdResponse			"invalid player set id"
//	@Failure		500				{object}	response.ErrorInternalErrorResponse	"internal db error / Get Player Sets By Elimination Id"
//	@Router			/playerset/elimination/{eliminationid} [get]
func GetAllPlayerSetsByEliminationId(context *gin.Context) {
	id := Convert2uint(context, "eliminationid")
	var data []database.PlayerSet
	data, err := database.GetPlayerSetsByEliminationId(id)
	if response.ErrorInternalErrorTest(context, id, "get player sets by elimination id", err) {
		return
	}
	response.AcceptPrint(id, fmt.Sprint(data), "get player sets by elimination id")
	context.IndentedJSON(200, data)
}

// Get player sets which have medals by elimination id
//
//	@Summary		Get player sets which have medals by elimination id
//	@Description	Get player sets which have medals by elimination id
//	@Tags			PlayerSet
//	@Produce		json
//	@Param			eliminationid	path		uint															true	"Elimination ID"
//	@Success		200				{object}	[]endpoint.GetPlayerSetsByMedalByEliminationId.playerSetData	"success"
//	@Failure		400				{object}	response.ErrorIdResponse										"invalid elimination id"
//	@Failure		500				{object}	response.ErrorInternalErrorResponse								"internal db error / Get Medal Info By Elimination Id"
//	@Router			/playerset/elimination/medal/{eliminationid} [get]
func GetPlayerSetsByMedalByEliminationId(context *gin.Context) {
	type playerSetData struct {
		ID      uint   `json:"id"`
		SetName string `json:"set_name"`
		Type    int    `json:"type"`
	}
	eliminationId := Convert2uint(context, "eliminationid")
	var data []playerSetData
	isExist, medals := IsGetMedalsByEliminationId(context, eliminationId)
	if !isExist {
		return
	}
	for _, medal := range medals {
		var tempData playerSetData
		isExist = database.GetPlayerSetIsExist(medal.PlayerSetId)
		if isExist {
			playerSet, _ := database.GetPlayerSetById(medal.PlayerSetId)
			tempData.ID = playerSet.ID
			tempData.SetName = playerSet.SetName
		}
		tempData.Type = medal.Type
		data = append(data, tempData)
	}
	context.IndentedJSON(200, data)
}

// Post player set
//
//	@Summary		Post player set
//	@Description	Post player set, and build player set match table
//	@Description	If team size is 1, set name will be player name
//	@Tags			PlayerSet
//	@Accept			json
//	@Produce		json
//	@Param			data	body		endpoint.PostPlayerSet.playerSetData		true	"Player Set Data"
//	@Success		200		{object}	database.PlayerSet{players=response.Nill}	"success, return player set without players"
//	@Failure		400		{object}	response.ErrorIdResponse					"invalid elimination id, player id maybe not exist / player set's length and teamsize does not match"
//	@Failure		500		{object}	response.ErrorInternalErrorResponse			"internal db error for create player set / get player / create player set match table / get elimination"
//	@Router			/playerset [post]
func PostPlayerSet(context *gin.Context) {
	type playerSetData struct {
		EliminationId uint   `json:"elimination_id"`
		SetName       string `json:"set_name"`
		PlayerIds     []uint `json:"player_ids"`
	}
	var data playerSetData
	var playerSet database.PlayerSet
	err := context.BindJSON(&data)
	/*received data check*/
	if err != nil {
		response.ErrorReceiveDataFormat(context, "player set data")
		return
	} else if response.ErrorIdTest(context, data.EliminationId, database.GetEliminationIsExist(data.EliminationId), "elimination when post player set") {
		return
	}
	elimination, _ := database.GetOnlyEliminationById(data.EliminationId)
	if len(data.PlayerIds) != elimination.TeamSize {
		errorMessage := fmt.Sprintf("player ids length should be equal to team size, team size: %d, player ids length: %d", elimination.TeamSize, len(data.PlayerIds))
		response.ErrorReceiveDataFormat(context, errorMessage)
		return
	}
	for _, playerId := range data.PlayerIds {
		if response.ErrorIdTest(context, playerId, database.GetPlayerIsExist(playerId), "player when post player set") {
			return
		}
	}
	/*build player set data*/
	playerSet.EliminationId = data.EliminationId
	if elimination.TeamSize == 1 {
		_, player := IsGetOnlyPlayer(context, data.PlayerIds[0])
		playerSet.SetName = player.Name
	} else {
		playerSet.SetName = data.SetName
	}
	for _, playerId := range data.PlayerIds {
		_, player := IsGetOnlyPlayer(context, playerId)
		fmt.Println(player.TotalScore)
		playerSet.TotalScore += player.TotalScore
	}
	/*create player set*/
	playerSet, err = database.CreatePlayerSet(playerSet)
	if err != nil {
		response.ErrorInternalErrorTest(context, playerSet.ID, "create player set", err)
		return
	}
	/*create player set match table*/
	for _, playerId := range data.PlayerIds {
		var playerSetMatchTable database.PlayerSetMatchTable
		playerSetMatchTable.PlayerId = playerId
		playerSetMatchTable.PlayerSetId = playerSet.ID
		newMatchTable, err := database.CreatePlayerSetMatchTable(playerSetMatchTable)
		if err != nil {
			response.ErrorInternalErrorTest(context, playerSet.ID, "create player set match table when create player set", err)
			return
		}
		response.AcceptPrint(playerId, fmt.Sprint(newMatchTable), "create player set match table")
	}
	response.AcceptPrint(playerSet.ID, fmt.Sprint(playerSet), "create player set")
	context.IndentedJSON(200, playerSet)
}

// Put player set name
//
//	@Summary		Put player set name
//	@Description	Put player set name
//	@Tags			PlayerSet
//	@Accept			json
//	@Produce		json
//	@Param			id		path		uint									true	"Player Set ID"
//	@Param			data	body		endpoint.PutPlayerSetName.playerSetData	true	"Player Set Data"
//	@Success		200		{object}	nil										"success"
//	@Failure		400		{object}	response.ErrorIdResponse				"invalid player set id"
//	@Failure		400		{object}	response.ErrorReceiveDataFormatResponse	"invalid player set data format"
//	@Failure		400		{object}	response.ErrorReceiveDataFormatResponse	"teamsize of elimination should not be 1"
//	@Failure		500		{object}	response.ErrorInternalErrorResponse		"internal db error / Get Player Set By Id / Update Player Set Name"
//	@Router			/playerset/name/{id} [patch]
func PutPlayerSetName(context *gin.Context) {
	type playerSetData struct {
		SetName string `json:"set_name"`
	}
	id := Convert2uint(context, "id")
	var data playerSetData
	isExist, playerSet := IsGetPlayerSetById(context, id)
	if !isExist {
		return
	}
	err := context.BindJSON(&data)
	/*received data check*/
	if err != nil {
		response.ErrorReceiveDataFormat(context, "player set data")
		return
	}
	elimination, _ := database.GetOnlyEliminationById(playerSet.EliminationId)
	if elimination.TeamSize == 1 {
		response.ErrorReceiveDataFormat(context, "team size is 1, cannot update player set name")
		return
	}
	/*update player set*/
	err = database.UpdatePlayerSetName(id, data.SetName)
	if err != nil {
		response.ErrorInternalErrorTest(context, playerSet.ID, "update player set", err)
		return
	}
	context.IndentedJSON(200, nil)
}

// Put player set rank
//
//	@Summary		Put player set rank
//	@Description	Put player set rank by elimination id
//	@Tags			PlayerSet
//	@Produce		json
//	@Param			eliminationid	path		uint								true	"Elimination ID"
//	@Success		200				{object}	nil									"success"
//	@Failure		500				{object}	response.ErrorInternalErrorResponse	"internal db error / Get Elimination Player Set Id Rank Order By Id / Update Player Set Rank"
//	@Router			/playerset/preranking/{eliminationid} [patch]
func PutPlayerSetPreRankingByEliminationId(context *gin.Context) {
	var yourResultStruct []database.ResultStruct
	eliminationId := Convert2uint(context, "eliminationid")
	yourResultStruct, err := database.GetEliminationPlayerSetIdRankOrderById(eliminationId)
	if response.ErrorInternalErrorTest(context, eliminationId, "get elimination player set id rank order by id", err) {
		return
	}
	for index, resultStruct := range yourResultStruct {
		err := database.UpdatePlayerSetRank(resultStruct.PlayerSetId, index+1)
		fmt.Printf("rank: %d, player set id: %d, TotalScore %d, allTenUpCnt: %d, XCnt %d \n", index+1, resultStruct.PlayerSetId, resultStruct.AllTotalScore, resultStruct.AllTenUpCnt, resultStruct.AllXCnt)
		if response.ErrorInternalErrorTest(context, resultStruct.PlayerSetId, "update player set rank", err) {
			return
		}
	}
	context.IndentedJSON(200, nil)
}

// Delete player set
//
//	@Summary		Delete player set
//	@Description	Delete player set, and delete player set match table
//	@Tags			PlayerSet
//	@Param			id	path		uint								true	"Player Set ID"
//	@Success		200	{object}	response.DeleteSuccessResponse		"success"
//	@Failure		400	{object}	response.ErrorIdResponse			"invalid plyer set id"
//	@Failure		500	{object}	response.ErrorInternalErrorResponse	"internal db error / Get Player Set By Id / Delete Player Set Match Table By Player Set Id / Delete Player Set By Id"
//	@Router			/playerset/{id} [delete]
func DeletePlayerSet(context *gin.Context) {
	id := Convert2uint(context, "id")
	isExist, playerSet := IsGetPlayerSetById(context, id)
	if !isExist {
		return
	}
	/*delete player set match table*/
	_, err := database.DeletePlayerSetMatchTableByPlayerSetId(id)
	if response.ErrorInternalErrorTest(context, id, "delete player set match tables by player set id", err) {
		return
	}

	/*delete player set*/
	isChanged, err := database.DeletePlayerSetById(id)
	if response.ErrorInternalErrorTest(context, id, "delete player set", err) {
		return
	}
	response.AcceptPrint(id, fmt.Sprint(playerSet), "delete player set")
	response.AcceptDeleteSuccess(context, id, isChanged, "player set")
}
