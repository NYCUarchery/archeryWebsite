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
//	@Summary		post a particpant to the competition
//	@Description	post a particpant to the competition
//	@Description	cannot repeat participant
//	@Description	role cannot be empty
//	@Description	status is always "pending"
//	@Tags			Participant
//	@Accept			json
//	@Produce		json
//	@Param			NewParticipantInfo	body	endpoint.NewParticipantInfo	true	"role"
//	@Success		200					string	string						"success"
//	@Failure		400					string	string						"invalid info"
//	@Failure		400					string	string						"role is empty"
//	@Failure		400					string	string						"participant exists"
//	@Failure		400					string	string						"user ID is not exist"
//	@Failure		400					string	string						"competition ID is not exist"
//	@Failure		500					string	string						"db error"
//	@Router			/api/participant/ [post]
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
//	@Summary		Show One Participant By ID
//	@Description	Get One Participant By ID
//	@Tags			Participant
//	@Produce		json
//	@Param			id	path	int	true	"Participant ID"
//	@Success		200	string	string
//	@Failure		400	string	string
//	@Router			/api/participant/{id} [get]
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
//	@Summary		Show Participants By user ID
//	@Description	Get Participants By user ID
//	@Tags			Participant
//	@Produce		json
//	@Param			user_id	body	int	true	"user ID"
//	@Success		200		string	string
//	@Failure		400		string	string
//	@Router			/api/participant/user [get]
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
//	@Summary		Show Participants By competition ID
//	@Description	Get Participants By competition ID, including realname
//	@Tags			Participant
//	@Produce		json
//	@Param			competition_id	body	int	true	"competition ID"
//	@Success		200				string	string
//	@Failure		400				string	string
//	@Router			/api/participant/competition [get]
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
		if response.ErrorInternalErrorTest(context, competitionId, "Get Participants by competition id", err) {
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
//	@Param			competition_id	body	int	true	"competition ID"
//	@Param			user_id			body	int	true	"user ID"
//	@Success		200				string	string
//	@Failure		400				string	string
//	@Router			/api/participant/competition/user [get]
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
//	@Summary		update one Participant
//	@Description	Put whole new Participant and overwrite with the id
//	@Tags			Participant
//	@Accept			json
//	@Produce		json
//	@Param			id			path	string	true	"Participant ID"
//	@Param			Participant	body	string	true	"Participant"
//	@Success		200			string	string
//	@Failure		400			string	string
//	@Failure		404			string	string
//	@Failure		500			string	string
//	@Router			/api/participant/whole/{id} [put]
func UpdateParticipant(context *gin.Context) {
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
//	@Summary		delete one Participant
//	@Description	delete one Participant by id
//	@Tags			Participant
//	@Accept			json
//	@Produce		json
//	@Param			id	path	string	true	"Participant ID"
//	@Success		200	string	string
//	@Failure		400	string	string
//	@Failure		404	string	string
//	@Router			/api/participant/{id} [delete]
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
