package endpoint

import (
	"backend/internal/database"
	response "backend/internal/response"
	"net/http"

	"github.com/gin-gonic/gin"
)

// Get one Medals by id
//
//	@Summary		Show one medal by id
//	@Description	get one medal by id
//	@Tags			Medal
//	@Produce		json
//	@Param			id	path	int	true	"Medal ID"
//	@Success		200	string	string
//	@Failure		400	string	string
//	@Router			/api/medal/{id} [get]
func GetMedalById(context *gin.Context) {
	id := convert2uint(context, "id")
	if response.ErrorIdTest(context, id, database.GetMedalIsExist(id), "Medal") {
		return
	}
	data, err := database.GetMedalById(id)
	if response.ErrorInternalErrorTest(context, id, "get medal by id", err) {
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
//	@Router			/api/medal/elimination/{id} [get]
func GetMedalInfoByEliminationId(context *gin.Context) {
	type MedalsData struct {
		Medals []database.Medal `json:"medals"`
	}
	eliminationId := convert2uint(context, "id")
	if response.ErrorIdTest(context, eliminationId, database.GetEliminationIsExist(eliminationId), "Elimination") {
		return
	}
	var data MedalsData
	var err error
	data.Medals, err = database.GetMedalInfoByEliminationId(eliminationId)
	if response.ErrorInternalErrorTest(context, eliminationId, "get medals by elimination id", err) {
		return
	}
	context.IndentedJSON(http.StatusOK, data)
}
