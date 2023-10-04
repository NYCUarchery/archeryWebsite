package api

import (
	"github.com/gin-gonic/gin"
	"net/http"
	"backend/internal/model"
	"backend/internal/pkg"
	"strconv"
)

// JoinInCompetition godoc
// @Summary      join in a competition
// @Description  add a particpant to the competition
// @Tags         participant
// @Accept       json
// @Produce      json
// @Param   	 competitionID 	 formData int true "competition id"
// @Success      200  {object}  response.Response "success"
// @Failure      400  {object}  response.Response "cannot parse competitionID | participant exists"
// @Failure      400  {object}  response.Response "no user/competition found"
// @Router       /participant/ [post]
func JoinInCompetition(c *gin.Context) {
	userID := pkg.QuerySession(c, "id").(uint)
	compIDu64, err := strconv.ParseUint(c.PostForm("competitionID"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"result": "cannot parse competitionID"})
		return
	}
	compID := uint(compIDu64)

	var user model.User
	if user, _ = model.UserInfoByID(userID); user.ID == 0 {
		c.JSON(http.StatusNotFound, gin.H{"result": "no user found"})
		return
	}

	if comp, _ := model.CompetitionInfoByID(compID); comp.ID == 0 {
		c.JSON(http.StatusNotFound, gin.H{"result": "no competition found"})
		return
	}

	if model.CheckParticipantExist(userID, compID) {
		c.JSON(http.StatusBadRequest, gin.H{"result": "participant exists"})
		return
	}
	var par model.Participant
	par.UserID, par.CompetitionID = userID, compID
	
	model.AddParticipant(&par)
	c.JSON(http.StatusOK, gin.H{"result": "success"})
}