package endpoint

import (
	"backend/internal/database"
	"backend/internal/pkg"
	"backend/internal/response"
	"fmt"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

type ParticipantWName struct {
	ID            uint   `gorm:"primaryKey;autoIncrement" json:"id"`
	UserID        uint   `gorm:"not null" json:"userID"`
	CompetitionID uint   `gorm:"not null" json:"competitionID"`
	Name          string `gorm:"not null" json:"name"`
	Role          string `gorm:"not null" json:"role"`
	Status        string `gorm:"not null" json:"status"`
}

type Participants struct {
	Participants []database.Participant `json:"participants"`
}

//JSON

// JoinInCompetition godoc
//
//	@Summary		join in a competition
//	@Description	add a particpant to the competition
//	@Tags			Participant
//	@Accept			json
//	@Produce		json
//	@Param			competitionID	formData	int					true	"competition id"
//	@Success		200				{object}	response.Response	"success"
//	@Failure		400				{object}	response.Response	"cannot parse competitionID | participant exists"
//	@Failure		400				{object}	response.Response	"no user/competition found"
//	@Failure		500				{object}	response.Response	"internal db error"
//	@Router			/api/participant/ [post]
func JoinInCompetition(c *gin.Context) {
	userID := pkg.QuerySession(c, "id").(uint)
	compIDu64, err := strconv.ParseUint(c.PostForm("competitionID"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"result": "cannot parse competitionID"})
		return
	}
	compID := uint(compIDu64)

	user, err := database.FindByUserID(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"result": "internal db error"})
		return
	}

	if user.ID == 0 {
		c.JSON(http.StatusNotFound, gin.H{"result": "no user found"})
		return
	}

	comp, err := database.GetOnlyCompetition(compID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"result": "internal db error"})
		return
	}

	if comp.ID == 0 {
		c.JSON(http.StatusNotFound, gin.H{"result": "no competition found"})
		return
	}

	if database.CheckParticipantExist(userID, compID) {
		c.JSON(http.StatusBadRequest, gin.H{"result": "participant exists"})
		return
	}
	var par database.Participant
	par.UserID = userID
	par.CompetitionID = compID
	par.Status = "pending"

	database.AddParticipant(&par)
	c.JSON(http.StatusOK, gin.H{"result": "success"})
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
	id := convert2uint(context, "id")
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
	type userData struct {
		UserID uint `json:"user_id"`
	}
	var newData Participants
	var data userData
	err := context.BindJSON(&data)
	if response.ErrorReceiveDataTest(context, data.UserID, "Get participants by user id", err) {
		return
	} else if response.ErrorIdTest(context, data.UserID, database.GetUserIsExist(data.UserID), "User ID when getting participants") {
		return
	}
	newData.Participants, err = database.GetParticipantByUserId(data.UserID)
	if response.ErrorInternalErrorTest(context, data.UserID, "Get Participants by user id", err) {
		return
	}
	context.IndentedJSON(http.StatusOK, newData)
}

// Get Participants By competition ID godoc
//
//	@Summary		Show Participants By competition ID
//	@Description	Get Participants By competition ID, including name
//	@Tags			Participant
//	@Produce		json
//	@Param			competition_id	body	int	true	"competition ID"
//	@Success		200				string	string
//	@Failure		400				string	string
//	@Router			/api/participant/competition [get]
func GetParticipantByCompetitionId(context *gin.Context) {
	type CompetitionData struct {
		CompetitionId uint `json:"competition_id"`
	}
	var newData []ParticipantWName
	var data CompetitionData
	err := context.BindJSON(&data)
	if response.ErrorReceiveDataTest(context, data.CompetitionId, "Get participants by competition id ", err) {
		return
	} else if response.ErrorIdTest(context, data.CompetitionId, database.GetCompetitionIsExist(data.CompetitionId), "Competition ID when getting participants") {
		return
	}
	participants, err := database.GetParticipantByCompetitionId(data.CompetitionId)
	if response.ErrorInternalErrorTest(context, data.CompetitionId, "Get Participants by competition id", err) {
		return
	}
	for _, participant := range participants {
		var tempData ParticipantWName
		user, err := database.FindByUserID(participant.UserID)
		if response.ErrorInternalErrorTest(context, data.CompetitionId, "Get Participants by competition id", err) {
			return
		}
		tempData.ID = participant.ID
		tempData.UserID = participant.UserID
		tempData.CompetitionID = participant.CompetitionID
		tempData.Name = user.Name
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
	type bodyData struct {
		CompetitionId uint `json:"competition_id"`
		UserId        uint `json:"user_id"`
	}
	var newData Participants
	var data bodyData
	err := context.BindJSON(&data)
	if response.ErrorReceiveDataTest(context, 0, "Get participants by competition id and user id", err) {
		return
	} else if response.ErrorIdTest(context, data.UserId, database.GetUserIsExist(data.UserId), "User ID when getting participants") {
		return
	} else if response.ErrorIdTest(context, data.CompetitionId, database.GetCompetitionIsExist(data.CompetitionId), "Competition ID when getting participants") {
		return
	}
	newData.Participants, err = database.GetParticipantByCompetitionIdUserId(data.CompetitionId, data.UserId)
	if response.ErrorInternalErrorTest(context, data.CompetitionId, "Get Participants by competition id and user id", err) {
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
	id := convert2uint(context, "id")
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
	id := convert2uint(context, "id")
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
