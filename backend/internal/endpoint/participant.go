package endpoint

import (
	"backend/internal/database"
	"backend/internal/pkg"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

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

	comp, err := database.GetOnlyCompetition(int(compID))
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
