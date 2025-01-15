package endpoint

import (
	"backend/internal/database"
	"backend/internal/pkg"
	"backend/internal/response"
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
)

type Participants struct {
	Participants []database.Participant `json:"participants"`
}
type ParticipantWName struct {
	ID            uint   `gorm:"primaryKey;autoIncrement" json:"id"`
	UserID        uint   `gorm:"not null" json:"user_id"`
	CompetitionID uint   `gorm:"not null" json:"competition_id"`
	Name          string `gorm:"not null" json:"name"`
	Role          string `gorm:"not null" json:"role"`
	Status        string `gorm:"not null" json:"status"`
}
type NewParticipantInfo struct {
	UserID        uint   `json:"user_id"`
	CompetitionID uint   `json:"competition_id"`
	Role          string `json:"role"`
}

type PutParticipantData struct {
	ID     uint   `json:"id"`
	Role   string `json:"role"`
	Status string `json:"status"`
}
type PatchParticipantsErrorDataType struct {
	ErrorMessage       string             `json:"errorMessage"`
	PutParticipantData PutParticipantData `json:"putParticipantData"`
}
type PatchParticipantsReturnData struct {
	ProcessedNum int                              `json:"processedNum"`
	SuccessNum   int                              `json:"successNum"`
	FailNum      int                              `json:"failNum"`
	ErrorData    []PatchParticipantsErrorDataType `json:"errorData"`
}

//JSON

// PostParticipant godoc
//
//	@Summary		Post a particpant to the competition.
//	@Description	Post a particpant to the competition from the user.
//	@Description	Cannot repeat participant.
//	@Description	Role cannot be empty.
//	@Description	Status is always initialized as "pending".
//	@Tags			Participant
//	@Accept			json
//	@Produce		json
//	@Param			NewParticipantInfo	body		endpoint.NewParticipantInfo				true	"role"
//	@Success		200					{object}	database.Participant					"success, return participant"
//	@Failure		400					{object}	response.ErrorReceiveDataFormatResponse	"invalid info / role is not defined / participant exists / invalid user ID / invalid competition ID"
//	@Failure		500					{object}	response.ErrorInternalErrorResponse		"db error"
//	@Router			/participant [post]
func PostParticipant(c *gin.Context) {
	var newParticipantInfo NewParticipantInfo
	if err := c.ShouldBindJSON(&newParticipantInfo); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"result": "invalid info"})
		return
	}
	if response.ErrorIdTest(c, newParticipantInfo.CompetitionID, database.GetCompetitionIsExist(newParticipantInfo.CompetitionID), "Competition ID when posting participant") {
		return
	}
	if response.ErrorIdTest(c, newParticipantInfo.UserID, database.GetUserIsExist(newParticipantInfo.UserID), "User ID when posting participant") {
		return
	}

	if database.CheckParticipantExist(newParticipantInfo.UserID, newParticipantInfo.CompetitionID) {
		c.JSON(http.StatusBadRequest, gin.H{"result": "participant exists"})
		return
	}
	if !pkg.EnsureRoleInGameRoleSet(pkg.StringToRole(newParticipantInfo.Role)) {
		c.JSON(http.StatusBadRequest, gin.H{"result": "role is not defined"})
		return
	}

	var par database.Participant
	par.UserID = newParticipantInfo.UserID
	par.CompetitionID = newParticipantInfo.CompetitionID
	par.Role = newParticipantInfo.Role
	par.Status = "pending"

	database.AddParticipant(&par)
	c.JSON(http.StatusOK, par)
}

// mushroom // hope be edited by JSON
func IsGetParticipant(context *gin.Context, id uint) (bool, database.Participant) {
	if response.ErrorIdTest(context, id, database.GetParticipantIsExist(id), "Participant") {
		return false, database.Participant{}
	}
	data, err := database.GetParticipant(id)
	if response.ErrorInternalErrorTest(context, id, "Get Participant", err) {
		return false, data
	}
	response.AcceptPrint(id, fmt.Sprint(data), "Participant")
	return true, data
}

// Get One Participant By ID godoc
//
//	@Summary		Show One Participant By ID.
//	@Description	Get One Participant By ID.
//	@Tags			Participant
//	@Produce		json
//	@Param			id	path		int									true	"Participant ID"
//	@Success		200	{object}	database.Participant				"success, return participant"
//	@Failure		400	{object}	response.ErrorIdResponse			"invalid participant id"
//	@Failure		500	{object}	response.ErrorInternalErrorResponse	"db error"
//	@Router			/participant/{id} [get]
func GetParticipantById(context *gin.Context) {
	id := Convert2uint(context, "id")
	isExist, data := IsGetParticipant(context, id)
	if !isExist {
		return
	}
	context.IndentedJSON(http.StatusOK, data)
}

// Get Participants By user id and competition id godoc
//
//	@Summary		Get Participants By user id and competition id, and update session gamerole.
//	@Description	Get Participants By user id and competition id.
//	@Description	And update session gamerole.
//	@Description	Warnings: Something need to be modified in the future.
//	@Description	Warnings: Only take the first one temporarily, for player and dummy player assumption in one competition of a user.
//	@Tags			Participant
//	@Produce		json
//	@Param			competitionid	path		int									true	"Competition ID"
//	@Success		200				{object}	database.Participant				"success, return the first participant, and update session gamerole"
//	@Failure		400				{object}	response.ErrorIdResponse			"invalid competition id / invalid user id"
//	@Failure		401				{object}	response.ErrorUnauthorizedResponse	"unauthorized"
//	@Failure		500				{object}	response.ErrorInternalErrorResponse	"get participants by competition id and user id"
//	@Router			/participant/me/{competitionid} [get]
func GetParticipantWithSession(context *gin.Context) {
	// Already Authenticated checked by AuthSessionMiddleware
	compeitionId := Convert2uint(context, "competitionid")
	userId := pkg.QuerySession(context, "userid").(uint)
	newGameRole := pkg.RNone

	if response.ErrorIdTest(context, compeitionId, database.GetCompetitionIsExist(compeitionId), "Competition ID when getting participants") {
		return
	}
	if response.ErrorIdTest(context, userId, database.GetUserIsExist(userId), "User ID when getting participants") {
		return
	}

	participants, err := database.GetParticipantByCompetitionIdUserId(compeitionId, userId)
	if response.ErrorInternalErrorTest(context, compeitionId, "Get Participants by competition id and user id", err) {
		return
	}
	if len(participants) == 0 {
		response.ErrorReceiveDataTest(context, compeitionId, "Participant", fmt.Errorf("no participant found"))
		return
	}
	participant := participants[0] // only take the first one temporarily, need to be modified in the future
	newGameRole = pkg.StringToRole(participant.Role)
	pkg.UpdateAuthSession(context, "gamerole", int(newGameRole))
	pkg.UpdateAuthSession(context, "participantid", int(participant.ID))
	pkg.PrintSession(context)
	context.IndentedJSON(http.StatusOK, participant)
}

// Get Participants By user ID godoc
//
//	@Summary		Show Participants By user ID.
//	@Description	Get Participants By user ID.
//	@Tags			Participant
//	@Produce		json
//	@Param			userid	path		int									true	"user ID"
//	@Success		200		{object}	[]database.Participant				"success, return participants of the user"
//	@Failure		400		{object}	response.ErrorIdResponse			"invalid user id"
//	@Failure		500		{object}	response.ErrorInternalErrorResponse	"internal db error / Get participants by user id / Get user"
//	@Router			/participant/user/{userid} [get]
func GetParticipantByUserId(context *gin.Context) {
	userId := Convert2uint(context, "userid")
	var newData []database.Participant
	if response.ErrorIdTest(context, userId, database.GetUserIsExist(userId), "User ID when getting participants") {
		return
	}
	newData, err := database.GetParticipantByUserId(userId)
	if response.ErrorInternalErrorTest(context, userId, "Get Participants by user id", err) {
		return
	}
	context.IndentedJSON(http.StatusOK, newData)
}

// Get Participants By competition ID godoc
//
//	@Summary		Show Participants by competition ID.
//	@Description	Get Participants by competition ID, including realname.
//	@Tags			Participant
//	@Produce		json
//	@Param			competitionid	path		int									true	"competition ID"
//	@Success		200				{object}	[]endpoint.ParticipantWName			"success, return participants of the competition"
//	@Failure		400				{object}	response.ErrorIdResponse			"invalid competition id"
//	@Failure		500				{object}	response.ErrorInternalErrorResponse	"internal db error / Get participants by competition id / Get user by id"
//	@Router			/participant/competition/{competitionid} [get]
func GetParticipantByCompetitionId(context *gin.Context) {
	competitionId := Convert2uint(context, "competitionid")
	var newData []ParticipantWName
	if response.ErrorIdTest(context, competitionId, database.GetCompetitionIsExist(competitionId), "Competition ID when getting participants") {
		return
	}
	participants, err := database.GetParticipantByCompetitionId(competitionId)
	if response.ErrorInternalErrorTest(context, competitionId, "Get Participants by competition id", err) {
		return
	}
	for _, participant := range participants {
		var tempData ParticipantWName
		user, err := database.FindByUserID(participant.UserID)
		if response.ErrorInternalErrorTest(context, participant.UserID, "Get user by id", err) {
			return
		}
		tempData.ID = participant.ID
		tempData.UserID = participant.UserID
		tempData.CompetitionID = participant.CompetitionID
		tempData.Name = user.RealName
		tempData.Role = participant.Role
		tempData.Status = participant.Status
		newData = append(newData, tempData)
	}
	context.IndentedJSON(http.StatusOK, newData)
}

// Get Participants By competition ID and user ID godoc
//
//	@Summary		Show Participants By competition ID and user ID
//	@Description	Get Participants By competition ID and user ID
//	@Tags			Participant
//	@Produce		json
//	@Param			competitionid	path		int									true	"competition ID"
//	@Param			userid			path		int									true	"user ID"
//	@Success		200				{object}	[]database.Participant				"success, return participants of the competition and user"
//	@Failure		400				{object}	response.ErrorIdResponse			"invalid user id / invalid competition id"
//	@Failure		500				{object}	response.ErrorInternalErrorResponse	"internal db error / Get participants by competition id and user id"
//	@Router			/participant/competition/user/{competitionid}/{userid} [get]
func GetParticipantByCompetitionIdUserId(context *gin.Context) {
	competitionId := Convert2uint(context, "competitionid")
	userId := Convert2uint(context, "userid")
	var newData []database.Participant
	if response.ErrorIdTest(context, userId, database.GetUserIsExist(userId), "User ID when getting participants") {
		return
	} else if response.ErrorIdTest(context, competitionId, database.GetCompetitionIsExist(competitionId), "Competition ID when getting participants") {
		return
	}
	newData, err := database.GetParticipantByCompetitionIdUserId(competitionId, userId)
	if response.ErrorInternalErrorTest(context, competitionId, "Get Participants by competition id and user id", err) {
		return
	}
	context.IndentedJSON(http.StatusOK, newData)
}

// Update Participant godoc
//
//	@Summary		Update one Participant.
//	@Description	Put whole new Participant.
//	@Tags			Participant
//	@Accept			json
//	@Produce		json
//	@Param			id			path		int									true	"Participant ID"
//	@Param			Participant	body		endpoint.PutParticipantData			true	"Participant"
//	@Success		200			{object}	database.Participant				"success, return updated participant"
//	@Failure		400			{object}	response.ErrorIdResponse			"invalid participant id"
//	@Failure		500			{object}	response.ErrorInternalErrorResponse	"internal db error / Update Participant"
//	@Router			/participant/{id} [put]
func PutParticipant(context *gin.Context) {
	var data database.Participant
	err := context.BindJSON(&data)
	id := Convert2uint(context, "id")
	if response.ErrorReceiveDataTest(context, id, "Participant", err) {
		return
	}
	if response.ErrorIdTest(context, id, database.GetParticipantIsExist(id), "Participant") {
		return
	}
	success, err := database.UpdateParticipant(id, data)
	if response.ErrorInternalErrorTest(context, id, "Update Participant", err) {
		return
	} else if !success {
		response.ErrorIdTest(context, id, success, "Participant")
		return
	}

	IsExist, newdata := IsGetParticipant(context, id)
	if !IsExist {
		return
	}
	response.AcceptPrint(id, fmt.Sprint(newdata), "Participant")
	context.IndentedJSON(http.StatusOK, newdata)
}

// Update Participants godoc
//
//	@Summary		Update Participants.
//	@Description	Patch Participants.
//	@Description	Only update role and status.
//	@Description	Role type should be defined.
//	@Description	Participant should be in the competition.
//	@Description	Admin cannot be updated or added.
//	@Tags			Participant
//	@Accept			json
//	@Produce		json
//	@Param			competitionid	path		int																								true	"Competition ID"
//	@Param			Participant		body		[]endpoint.PutParticipantData																	true	"Participant"
//	@Success		200				{object}	endpoint.PatchParticipantsReturnData{int, int, int, []endpoint.PatchParticipantsErrorDataType}	"success, return processedNum, successNum, failNum, errorData"
//	@Failure		400				{object}	response.ErrorIdResponse																		"invalid competition id / data length is 0"
//	@Router			/participant/bulk/roles/status/{competitionid} [patch]
func PatchParticipants(context *gin.Context) {
	var data []PutParticipantData
	var returnData = PatchParticipantsReturnData{0, 0, 0, []PatchParticipantsErrorDataType{}}
	err := context.BindJSON(&data)
	competitionid := Convert2uint(context, "competitionid")
	if response.ErrorReceiveDataTest(context, 0, "Put Participants", err) {
		return
	}
	if response.ErrorIdTest(context, competitionid, database.GetCompetitionIsExist(competitionid), "Competition ID when updating participants") {
		return
	}
	if len(data) == 0 {
		response.ErrorReceiveDataTest(context, 0, "Put Participants", fmt.Errorf("no data received"))
		return
	}

	for _, d := range data {
		if !database.GetParticipantIsExistWithCompetitionID(d.ID, competitionid) {
			returnData.FailNum++
			returnData.ErrorData = append(returnData.ErrorData, PatchParticipantsErrorDataType{"invalid participant id | participant not in competition", d})
			returnData.ProcessedNum++
			continue
		}
		oldparticipant, err := database.GetParticipant(d.ID)
		if err != nil {
			returnData.FailNum++
			returnData.ErrorData = append(returnData.ErrorData, PatchParticipantsErrorDataType{"internal db error to get participant", d})
			returnData.ProcessedNum++
			continue
		}
		if oldparticipant.Role == "Admin" {
			returnData.FailNum++
			returnData.ErrorData = append(returnData.ErrorData, PatchParticipantsErrorDataType{"Admin cannot be updated", d})
			returnData.ProcessedNum++
			continue
		}
		if d.Role == "Admin" {
			returnData.FailNum++
			returnData.ErrorData = append(returnData.ErrorData, PatchParticipantsErrorDataType{"Admin cannot be added", d})
			returnData.ProcessedNum++
			continue
		}
		if !pkg.EnsureRoleInGameRoleSet(pkg.StringToRole(d.Role)) {
			returnData.FailNum++
			returnData.ErrorData = append(returnData.ErrorData, PatchParticipantsErrorDataType{"role is not defined", d})
			returnData.ProcessedNum++
			continue
		}
		var par database.Participant = database.Participant{Role: d.Role, Status: d.Status}
		_, err = database.UpdateParticipant(d.ID, par)
		if response.ErrorInternalErrorTest(context, d.ID, "Update Participant", err) {
			returnData.FailNum++
			errorMessage := fmt.Sprintf("internal db error: %v", err)
			returnData.ErrorData = append(returnData.ErrorData, PatchParticipantsErrorDataType{errorMessage, d})
			returnData.ProcessedNum++
			continue
		}
		returnData.SuccessNum++
		returnData.ProcessedNum++
	}
	context.IndentedJSON(http.StatusOK, returnData)
}

// Delete Participant by id godoc
//
//	@Summary		Delete one Participant.
//	@Description	Delete one Participant by id.
//	@Description	This api is intentionally designed not to delete related data, because a user may drop out of competition, but competition still need the record.
//	@Tags			Participant
//	@Produce		json
//	@Param			id	path		int									true	"Participant ID"
//	@Success		200	{object}	response.DeleteSuccessResponse		"success"
//	@Failure		400	{object}	response.ErrorIdResponse			"invalid participant id"
//	@Failure		500	{object}	response.ErrorInternalErrorResponse	"internal db error / Delete Participant"
//	@Router			/participant/{id} [delete]
func DeleteParticipantById(context *gin.Context) {
	id := Convert2uint(context, "id")
	DeleteParticipaint(context, id)
}

func DeleteParticipaint(context *gin.Context, id uint) bool {
	if response.ErrorIdTest(context, id, database.GetParticipantIsExist(id), "Participant") {
		return false
	}
	success, err := database.DeleteParticipant(id)
	if response.ErrorInternalErrorTest(context, id, "Delete Participant", err) {
		return false
	} else if !success {
		response.ErrorIdTest(context, id, success, "Participant")
		return false
	}
	response.AcceptDeleteSuccess(context, id, success, "Participant")
	return true
}

func DeleteParticipaintThroughCompetition(context *gin.Context, id uint) bool {
	if response.ErrorIdTest(context, id, database.GetParticipantIsExist(id), "Participant through competition") {
		return false
	}
	success, err := database.DeleteParticipant(id)
	if response.ErrorInternalErrorTest(context, id, "Delete Participant through competition", err) {
		return false
	} else if !success {
		response.ErrorIdTest(context, id, success, "Participant through competition")
		return false
	}
	return true
}
