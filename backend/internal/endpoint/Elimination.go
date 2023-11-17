package endpoint

import (
	"backend/internal/database"
	response "backend/internal/response"
	"fmt"

	"github.com/gin-gonic/gin"
)

func IsGetEliminationById(context *gin.Context) (bool, database.Elimination) {
	uid := convert2uint(context, "id") // require review after player branch merge
	id := int(uid)
	data, err := database.GetEliminationById(uid)
	isExist := (data.ID == uid) // require review after player branch merge
	if response.ErrorIdTest(context, id, isExist, "Elimination") {
		return false, database.Elimination{}
	} else if response.ErrorInternalErrorTest(context, id, "Get Elimination", err) {
		return false, data
	}
	response.AcceptPrint(id, fmt.Sprint(data), "Elimination")
	return true, data
}

func IsGetEliminationWStagesById(context *gin.Context) (bool, database.Elimination) {
	uid := convert2uint(context, "id") // require review after player branch merge
	id := int(uid)
	data, err := database.GetEliminationWStagesById(uid)
	isExist := (data.ID == uid) // require review after player branch merge
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

// Post one Elimination godoc
//
//	@Summary		Create one Elimination
//	@Description	Post one new Elimination data with new id
//	@Tags			Elimination
//	@Accept			json
//	@Produce		json
//	@Param			Elimination	body	string	true	"Elimination"
//	@Success		200			string	string
//	@Failure		400			string	string
//	@Router			/api/elimination [post]
func PostElimination(context *gin.Context) {
	var data database.Elimination
	err := context.BindJSON(&data) // require review after player branch merge
	if response.ErrorReceiveDataTest(context, 0, "Elimination", err) {
		return
	} else if response.ErrorIdTest(context, int(data.GroupId), database.GetGroupIsExist(int(data.GroupId)), "group when creating elimination") {
		return
	}
	data, err = database.CreateElimination(data)
	if response.ErrorInternalErrorTest(context, 0, "Create Elimination", err) {
		return
	}
	id := int(data.ID) // require review after player branch merge
	response.AcceptPrint(id, fmt.Sprint(data), "Elimination")
	context.IndentedJSON(200, data)
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
	err := context.BindJSON(&data) // require review after player branch merge
	if response.ErrorReceiveDataTest(context, 0, "Stage", err) {
		return
	} else if response.ErrorIdTest(context, int(data.EliminationId), database.GetEliminationIsExist(data.EliminationId), "elimintion when creating stage") {
		return
	}
	data, err = database.CreateStage(data)
	if response.ErrorInternalErrorTest(context, 0, "Create Stage", err) {
		return
	}
	id := int(data.ID) // require review after player branch merge
	response.AcceptPrint(id, fmt.Sprint(data), "Stage")
	context.IndentedJSON(200, data)
}

// Post one Match godoc
//
//	@Summary		Create one Match
//	@Description	Post one new Match data with new id
//	@Tags			Elimination
//	@Accept			json
//	@Produce		json
//	@Param			Match	body	string	true	"Match"
//	@Success		200		string	string
//	@Failure		400		string	string
//	@Router			/api/elimination/match [post]
func PostMatch(context *gin.Context) {
	var data database.Match
	err := context.BindJSON(&data) // require review after player branch merge
	if response.ErrorReceiveDataTest(context, 0, "Match", err) {
		return
	} else if response.ErrorIdTest(context, int(data.StageId), database.GetStageIsExist(data.StageId), "stage when creating match") {
		return
	}
	data, err = database.CreateMatch(data)
	if response.ErrorInternalErrorTest(context, 0, "Create Match", err) {
		return
	}
	id := int(data.ID) // require review after player branch merge
	response.AcceptPrint(id, fmt.Sprint(data), "Match")
	context.IndentedJSON(200, data)
}

func PutEliminationById(context *gin.Context, uid uint, data database.Elimination) bool {
	id := int(uid) // require review after player branch merge
	if response.ErrorIdTest(context, id, database.GetEliminationIsExist(uid), "Elimination") {
		return false
	}
	data, err := database.UpdateElimination(uid, data)
	if response.ErrorInternalErrorTest(context, id, "Update Elimination", err) {
		return false
	}
	id = int(data.ID) // require review after player branch merge
	response.AcceptPrint(id, fmt.Sprint(data), "Elimination")
	return true
}

// Put one Elimination godoc
//
//	@Summary		Update one Elimination
//	@Description	Update one Elimination data by id, can't update id, group id, team size
//	@Tags			Elimination
//	@Accept			json
//	@Produce		json
//	@Param			id			path	int		true	"Elimination ID"
//	@Param			Elimination	body	string	true	"Elimination"
//	@Success		200			string	string
//	@Failure		400			string	string
//	@Router			/api/elimination/whole/{id} [put]
func PutElimination(context *gin.Context) {
	var data database.Elimination
	err := context.BindJSON(&data)
	uid := convert2uint(context, "id") // require review after player branch merge
	id := int(uid)
	if response.ErrorReceiveDataTest(context, id, "Elimination", err) {
		return
	}
	isExist, oldData := IsGetEliminationById(context)
	if !isExist {
		return
	}
	/*id will not be changed*/
	data.ID = uid
	/*group id will not be changed*/
	data.GroupId = oldData.GroupId
	/*team size will not be changed*/
	data.TeamSize = oldData.TeamSize

	if !PutEliminationById(context, uint(id), data) { // require review after player branch merge
		return
	}
	isExist, newData := IsGetEliminationById(context)
	if !isExist {
		return
	}

	context.IndentedJSON(200, newData)
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
	uid := convert2uint(context, "id") // require review after player branch merge
	id := int(uid)
	isChanged, err := database.DeleteElimination(uid)
	if response.ErrorInternalErrorTest(context, id, "Delete Elimination", err) {
		return
	}
	response.AcceptDeleteSuccess(context, id, isChanged, "Elimination")
}
