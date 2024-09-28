package endpoint

import (
	"backend/internal/database"
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
//	@Failure		400					{object}	response.ErrorReceiveDataFormatResponse	"invalid info / role is empty / participant exists / invalid user ID / invalid competition ID"
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

	if newParticipantInfo.Role == "" {
		c.JSON(http.StatusBadRequest, gin.H{"result": "role is empty"})
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
//	@Success		200				{object}	database.Participant				"success, return participants of the competition and user"
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
//	@Param			id			path		int											true	"Participant ID"
//	@Param			Participant	body		endpoint.PutParticipant.PutParticipantData	true	"Participant"
//	@Success		200			{object}	database.Participant						"success, return updated participant"
//	@Failure		400			{object}	response.ErrorIdResponse					"invalid participant id"
//	@Failure		500			{object}	response.ErrorInternalErrorResponse			"internal db error / Update Participant"
//	@Router			/participant/{id} [put]
func PutParticipant(context *gin.Context) {
	type PutParticipantData struct {
		Role   string `json:"role"`
		Status string `json:"status"`
	}
	_ = PutParticipantData{}
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
