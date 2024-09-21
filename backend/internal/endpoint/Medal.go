package endpoint

import (
	"backend/internal/database"
	response "backend/internal/response"
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
)

func IsGetMedalById(context *gin.Context, id uint) (bool, database.Medal) {
	var medal database.Medal
	isExist := database.GetMedalIsExist(id)
	if !isExist {
		response.ErrorIdTest(context, id, isExist, "Medal")
		return false, database.Medal{}
	}
	medal, err := database.GetMedalById(id)
	if err != nil {
		response.ErrorInternalErrorTest(context, id, "get medal by id", err)
		return false, database.Medal{}
	}
	return true, medal
}

func IsGetMedalsByEliminationId(context *gin.Context, id uint) (bool, []database.Medal) {
	var medals []database.Medal
	isExist := database.GetEliminationIsExist(id)
	if !isExist {
		response.ErrorIdTest(context, id, isExist, "Elimination")
		return false, []database.Medal{}
	}
	medals, err := database.GetMedalInfoByEliminationId(id)
	if err != nil {
		response.ErrorInternalErrorTest(context, id, "get medals by elimination id", err)
		return false, []database.Medal{}
	}
	return true, medals
}

// Get one Medals by id
//
//	@Summary		Show one medal by id
//	@Description	get one medal by id
//	@Tags			Medal
//	@Produce		json
//	@Param			id	path	int	true	"Medal ID"
//	@Success		200	string	string
//	@Failure		400	string	string
//	@Router			/medal/{id} [get]
func GetMedalById(context *gin.Context) {
	id := Convert2uint(context, "id")
	isExist, data := IsGetMedalById(context, id)
	if !isExist {
		return
	}
	context.IndentedJSON(http.StatusOK, data)
}

// Get medals of elimination by elimination id
//
//	@Summary		Show medals of elimination by elimination id
//	@Description	get medals of elimination by elimination id
//	@Tags			Medal
//	@Produce		json
//	@Param			id	path	int	true	"elimination ID"
//	@Success		200	string	string
//	@Failure		400	string	string
//	@Router			/medal/elimination/{id} [get]
func GetMedalInfoByEliminationId(context *gin.Context) {
	eliminationId := Convert2uint(context, "eliminationid")
	isExist, data := IsGetMedalsByEliminationId(context, eliminationId)
	if !isExist {
		return
	}
	context.IndentedJSON(http.StatusOK, data)
}

// update medal's player set id by id
//
//	@Summary		Update medal's player set id by id
//	@Description	update medal's player set id by id
//	@Tags			Medal
//	@Produce		json
//	@Param			id			path	int		true	"Medal ID"
//	@Param			PlayerSetId	body	string	true	"PlayerSetId"
//	@Success		200			string	string
//	@Failure		400			string	string
//	@Router			/medal/playersetid/{id} [put]
func PutMedalPlayerSetIdById(context *gin.Context) {
	type RequestBody struct {
		PlayerSetId uint `json:"player_set_id"`
	}
	id := Convert2uint(context, "id")
	var requestBody RequestBody
	err := context.BindJSON(&requestBody)
	if response.ErrorInternalErrorTest(context, id, "Request data of PutMedalPlayerSetIdById", err) {
		return
	}
	isExist, medal := IsGetMedalById(context, id)
	if !isExist {
		return
	}
	isExist, playerset := IsGetPlayerSetById(context, requestBody.PlayerSetId)
	if !isExist {
		return
	}
	if medal.EliminationId != playerset.EliminationId {
		errorMessage := fmt.Sprintf("Elimination id of medal and player set is not same, medal elimiination id: %d, player set elimination id: %d", medal.EliminationId, playerset.EliminationId)
		response.ErrorReceiveDataFormat(context, errorMessage)
		return
	}

	err = database.UpdateMedalPlayerSetId(id, requestBody.PlayerSetId)
	if response.ErrorInternalErrorTest(context, id, "Update medal player set id", err) {
		return
	}
	context.IndentedJSON(http.StatusOK, nil)
}
