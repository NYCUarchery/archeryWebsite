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

//JSON

// JoinInCompetition godoc
// @Summary			join in a competition
// @Description		add a particpant to the competition
// @Tags			Participant
// @Accept			json
// @Produce			json
// @Param			competitionID	formData int true "competition id"
// @Success			200  {object}	response.Response "success"
// @Failure			400  {object}	response.Response "cannot parse competitionID | participant exists"
// @Failure			400  {object}	response.Response "no user/competition found"
// @Failure			500  {object}	response.Response "internal db error"
// @Router			/participant/ [post]
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

// mushroom

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
func GetParticipant(context *gin.Context) {
	id := convert2uint(context, "id")
	isExist, data := IsGetParticipant(context, id)
	if !isExist {
		return
	}
	context.IndentedJSON(http.StatusOK, data)
}

// Post Participant godoc
//
//	@Summary		Create one Participant
//	@Description	Post one new Participant data with new id
//	@Tags			Participant
//	@Accept			json
//	@Produce		json
//	@Param			Participant	body	string	true	"Participant"
//	@Success		200			string	string
//	@Failure		400			string	string
//	@Router			/api/participant [post]
func PostParticipant(context *gin.Context) {
	var data database.Participant
	err := context.BindJSON(&data)
	if response.ErrorReceiveDataTest(context, 0, "Create Participant", err) {
		return
	} else if response.ErrorIdTest(context, data.CompetitionID, database.GetCompetitionIsExist(data.CompetitionID), "Get competition when post Participant ") {
		return
	} else if response.ErrorIdTest(context, data.UserID, database.GetUserIsExist(data.UserID), "Get user when post Participant ") {
		return
	}
	data, err = database.CreateParticipant(data)
	if response.ErrorInternalErrorTest(context, data.ID, "Post User", err) {
		return
	}
	/*check if competition id is exist*/
	competitionId := data.CompetitionID
	if response.ErrorIdTest(context, competitionId, database.GetCompetitionIsExist(competitionId), "Competition when post Participant ") {
		return
	}
	/*check if User id is exist*/
	userId := data.UserID
	if response.ErrorIdTest(context, userId, database.GetUserIsExist(userId), "User when post Participant ") {
		return
	}
	id := data.ID
	IsExist, newData := IsGetParticipant(context, id)
	if !IsExist {
		return
	}
	response.AcceptPrint(id, fmt.Sprint(newData), "Participant")
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
