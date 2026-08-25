package endpoint

import (
	"backend/internal/database"
	"backend/internal/response"
	"errors"

	"fmt"
	"io"
	"net/http"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

var errPlayerSetMutationLocked = errors.New("player sets cannot change after bracket initialization")

var (
	errAutoPlayerSetsInvalidCount         = errors.New("count must be between 4 and the number of ranked players")
	errAutoPlayerSetsInvalidAdvancingNum  = errors.New("qualification advancing_num must be between 4 and the number of ranked players")
	errAutoPlayerSetsInvalidRanks         = errors.New("ranked players must use a continuous rank sequence starting at 1")
	errAutoPlayerSetsQualificationMissing = errors.New("qualification for the elimination group does not exist")
	errAutoPlayerSetsTeamSize             = errors.New("auto player set creation only supports individual eliminations")
	errAutoPlayerSetsConflict             = errors.New("existing player sets are incompatible with the requested ranked players")
)

// AutoCreatePlayerSetsRequest accepts an optional number of top qualification
// players.  Omitting Count uses the qualification's advancing_num.
type AutoCreatePlayerSetsRequest struct {
	Count *int `json:"count"`
}

// AutoCreatePlayerSetsResponse reports both newly created and reused sets so
// callers can refresh their normal elimination/player-set views without
// guessing whether a retry made another write.
type AutoCreatePlayerSetsResponse struct {
	EliminationID  uint                 `json:"elimination_id"`
	RequestedCount int                  `json:"requested_count"`
	CreatedCount   int                  `json:"created_count"`
	ReusedCount    int                  `json:"reused_count"`
	PlayerSets     []database.PlayerSet `json:"player_sets"`
}

// withPlayerSetMutationLock serializes seed mutations with bracket creation by
// locking the same elimination row. The stage check and mutation therefore
// cannot race with PostEliminationBracket.
func withPlayerSetMutationLock(eliminationID uint, mutation func(*gorm.DB) error) error {
	return database.DB.Transaction(func(tx *gorm.DB) error {
		var elimination database.Elimination
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&elimination, eliminationID).Error; err != nil {
			return err
		}
		var stageCount int64
		if err := tx.Model(&database.Stage{}).Where("elimination_id = ?", eliminationID).Count(&stageCount).Error; err != nil {
			return err
		}
		if stageCount > 0 {
			return errPlayerSetMutationLocked
		}
		return mutation(tx)
	})

}

func writePlayerSetMutationError(context *gin.Context, id uint, action string, err error) bool {
	if err == nil {
		return false
	}
	if errors.Is(err, errPlayerSetMutationLocked) {
		context.JSON(http.StatusConflict, gin.H{"error": err.Error()})
		return true
	}
	response.ErrorInternalErrorTest(context, id, action, err)
	return true
}

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

// AutoCreateIndividualPlayerSets creates or safely reuses the one-player
// PlayerSets for the leading saved qualification ranks.  It intentionally does
// not recalculate qualification rankings: an administrator must first persist
// the intended order.
//
//	@Summary		Auto-create individual elimination player sets
//	@Description	Creates one PlayerSet per saved qualification rank. Count defaults to the qualification advancing_num. Requires a competition Admin.
//	@Tags			PlayerSet
//	@Accept			json
//	@Produce		json
//	@Param			eliminationid	path	uint	true	"Elimination ID"
//	@Param			data	body	endpoint.AutoCreatePlayerSetsRequest	false	"Optional player count"
//	@Success		200	{object}	endpoint.AutoCreatePlayerSetsResponse
//	@Failure		400	{object}	response.ErrorResponse
//	@Failure		403	{object}	response.ErrorResponse
//	@Failure		409	{object}	response.ErrorResponse
//	@Failure		500	{object}	response.ErrorResponse
//	@Router			/playerset/elimination/{eliminationid}/auto [post]
func AutoCreateIndividualPlayerSets(context *gin.Context) {
	eliminationID := Convert2uint(context, "eliminationid")
	elimination, err := database.GetOnlyEliminationById(eliminationID)
	if err != nil || elimination.ID == 0 {
		context.JSON(http.StatusBadRequest, gin.H{"error": "invalid elimination ID"})
		return
	}
	if !requireEliminationCompetitionAdmin(context, elimination) {
		return
	}

	var request AutoCreatePlayerSetsRequest
	if err := context.ShouldBindJSON(&request); err != nil && !errors.Is(err, io.EOF) {
		context.JSON(http.StatusBadRequest, gin.H{"error": "invalid auto player set request"})
		return
	}

	var result AutoCreatePlayerSetsResponse
	err = database.DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&elimination, eliminationID).Error; err != nil {
			return err
		}
		if elimination.TeamSize != 1 {
			return errAutoPlayerSetsTeamSize
		}

		var stageCount int64
		if err := tx.Model(&database.Stage{}).Where("elimination_id = ?", eliminationID).Count(&stageCount).Error; err != nil {
			return err
		}
		if stageCount != 0 {
			return errPlayerSetMutationLocked
		}

		// Qualification and Group deliberately share their ID in this data model.
		var qualification database.Qualification
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&qualification, elimination.GroupId).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return errAutoPlayerSetsQualificationMissing
			}
			return err
		}
		requestedCount := qualification.AdvancingNum
		usingQualificationDefault := request.Count == nil
		if request.Count != nil {
			requestedCount = *request.Count
		}

		var players []database.Player
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).
			Where("group_id = ? AND `rank` != -1", elimination.GroupId).
			Order("`rank` ASC, id ASC").Find(&players).Error; err != nil {
			return err
		}
		if requestedCount < 4 || requestedCount > len(players) {
			if usingQualificationDefault {
				return errAutoPlayerSetsInvalidAdvancingNum
			}
			return errAutoPlayerSetsInvalidCount
		}
		for index, player := range players {
			if player.Rank != index+1 {
				return errAutoPlayerSetsInvalidRanks
			}
		}
		players = players[:requestedCount]
		selectedByID := make(map[uint]database.Player, len(players))
		for _, player := range players {
			selectedByID[player.ID] = player
		}

		var playerSets []database.PlayerSet
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).
			Where("elimination_id = ?", eliminationID).Order("id ASC").Find(&playerSets).Error; err != nil {
			return err
		}
		setIDs := make([]uint, 0, len(playerSets))
		for _, playerSet := range playerSets {
			setIDs = append(setIDs, playerSet.ID)
		}
		var links []database.PlayerSetMatchTable
		if len(setIDs) > 0 {
			if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).
				Where("player_set_id IN ?", setIDs).Order("player_set_id ASC, player_id ASC").Find(&links).Error; err != nil {
				return err
			}
		}

		linksBySetID := make(map[uint][]database.PlayerSetMatchTable, len(playerSets))
		for _, link := range links {
			linksBySetID[link.PlayerSetId] = append(linksBySetID[link.PlayerSetId], link)
		}
		existingByPlayerID := make(map[uint]database.PlayerSet, len(playerSets))
		for _, playerSet := range playerSets {
			setLinks := linksBySetID[playerSet.ID]
			if len(setLinks) != 1 {
				return errAutoPlayerSetsConflict
			}
			player, selected := selectedByID[setLinks[0].PlayerId]
			if !selected {
				return errAutoPlayerSetsConflict
			}
			if _, duplicate := existingByPlayerID[player.ID]; duplicate {
				return errAutoPlayerSetsConflict
			}
			existingByPlayerID[player.ID] = playerSet
		}

		result = AutoCreatePlayerSetsResponse{EliminationID: eliminationID, RequestedCount: requestedCount}
		result.PlayerSets = make([]database.PlayerSet, 0, len(players))
		for _, player := range players {
			playerSet, exists := existingByPlayerID[player.ID]
			if exists {
				updates := map[string]interface{}{"rank": player.Rank, "set_name": player.Name, "total_score": player.TotalScore}
				if err := tx.Model(&database.PlayerSet{}).Where("id = ?", playerSet.ID).Updates(updates).Error; err != nil {
					return err
				}
				playerSet.Rank = player.Rank
				playerSet.SetName = player.Name
				playerSet.TotalScore = player.TotalScore
				result.ReusedCount++
			} else {
				playerSet = database.PlayerSet{EliminationId: eliminationID, Rank: player.Rank, SetName: player.Name, TotalScore: player.TotalScore}
				if err := tx.Create(&playerSet).Error; err != nil {
					return err
				}
				if err := tx.Create(&database.PlayerSetMatchTable{PlayerId: player.ID, PlayerSetId: playerSet.ID}).Error; err != nil {
					return err
				}
				result.CreatedCount++
			}
			result.PlayerSets = append(result.PlayerSets, playerSet)
		}
		return nil
	})
	if err != nil {
		switch {
		case errors.Is(err, errPlayerSetMutationLocked), errors.Is(err, errAutoPlayerSetsConflict):
			context.JSON(http.StatusConflict, gin.H{"error": err.Error()})
		case errors.Is(err, errAutoPlayerSetsInvalidCount),
			errors.Is(err, errAutoPlayerSetsInvalidAdvancingNum),
			errors.Is(err, errAutoPlayerSetsInvalidRanks),
			errors.Is(err, errAutoPlayerSetsQualificationMissing),
			errors.Is(err, errAutoPlayerSetsTeamSize),
			errors.Is(err, gorm.ErrRecordNotFound):
			context.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		default:
			response.ErrorInternalErrorTest(context, eliminationID, "auto create individual player sets", err)
		}
		return
	}
	context.JSON(http.StatusOK, result)
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
	err = withPlayerSetMutationLock(data.EliminationId, func(tx *gorm.DB) error {
		if err := tx.Create(&playerSet).Error; err != nil {
			return err
		}
		for _, playerID := range data.PlayerIds {
			playerSetMatchTable := database.PlayerSetMatchTable{PlayerId: playerID, PlayerSetId: playerSet.ID}
			if err := tx.Create(&playerSetMatchTable).Error; err != nil {
				return err
			}
			response.AcceptPrint(playerID, fmt.Sprint(playerSetMatchTable), "create player set match table")
		}
		return nil
	})
	if writePlayerSetMutationError(context, data.EliminationId, "create player set", err) {
		return
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
	eliminationId := Convert2uint(context, "eliminationid")
	if response.ErrorIdTest(context, eliminationId, database.GetEliminationIsExist(eliminationId), "elimination when ranking player sets") {
		return
	}
	err := withPlayerSetMutationLock(eliminationId, func(tx *gorm.DB) error {
		var yourResultStruct []database.ResultStruct
		if err := tx.Table("(SELECT player_sets.id AS player_set_id, player_set_match_tables.player_id FROM player_sets JOIN player_set_match_tables ON player_sets.id = player_set_match_tables.player_set_id WHERE player_sets.elimination_id = ?) AS A", eliminationId).
			Select("A.player_set_id, SUM(C.total_score) AS all_total_score, SUM(C.x_cnt) AS all_x_cnt, SUM(C.ten_up_cnt) AS all_ten_up_cnt").
			Joins("JOIN (SELECT players.id AS player_id, players.total_score, SUM(IF(round_scores.score = 11, 1, 0)) AS x_cnt, SUM(IF(round_scores.score >= 10, 1, 0)) AS ten_up_cnt FROM players JOIN (SELECT DISTINCT player_set_match_tables.player_id FROM player_sets JOIN player_set_match_tables ON player_sets.id = player_set_match_tables.player_set_id WHERE player_sets.elimination_id = ?) AS B ON players.id = B.player_id JOIN rounds ON players.id = rounds.player_id JOIN round_ends ON rounds.id = round_ends.round_id JOIN round_scores ON round_ends.id = round_scores.round_end_id GROUP BY players.id, players.total_score) AS C ON A.player_id = C.player_id", eliminationId).
			Group("A.player_set_id").
			Order("all_total_score DESC, all_ten_up_cnt DESC, all_x_cnt DESC").
			Scan(&yourResultStruct).Error; err != nil {
			return err
		}
		for index, resultStruct := range yourResultStruct {
			if err := tx.Model(&database.PlayerSet{}).Where("id = ?", resultStruct.PlayerSetId).UpdateColumn("rank", index+1).Error; err != nil {
				return err
			}
			fmt.Printf("rank: %d, player set id: %d, TotalScore %d, allTenUpCnt: %d, XCnt %d \n", index+1, resultStruct.PlayerSetId, resultStruct.AllTotalScore, resultStruct.AllTenUpCnt, resultStruct.AllXCnt)
		}
		return nil
	})
	if writePlayerSetMutationError(context, eliminationId, "update player set rank", err) {
		return
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
	isChanged := false
	err := withPlayerSetMutationLock(playerSet.EliminationId, func(tx *gorm.DB) error {
		if err := tx.Where("player_set_id = ?", id).Delete(&database.PlayerSetMatchTable{}).Error; err != nil {
			return err
		}
		result := tx.Where("id = ?", id).Delete(&database.PlayerSet{})
		isChanged = result.RowsAffected != 0
		return result.Error
	})
	if writePlayerSetMutationError(context, id, "delete player set", err) {
		return
	}
	response.AcceptPrint(id, fmt.Sprint(playerSet), "delete player set")
	response.AcceptDeleteSuccess(context, id, isChanged, "player set")
}
