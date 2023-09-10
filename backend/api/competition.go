package api

import (
	"github.com/gin-gonic/gin"
	"net/http"
	"time"
	"backend/model"
	"backend/pkg"
	"strconv"
)

func CreateCompetition(c *gin.Context) {
	name := c.PostForm("name")
	date := c.PostForm("date")
	groups := c.PostFormArray("groups")
	
	if findComp, _ := model.CompetitionInfoByName(name); findComp.ID != 0 {
		c.JSON(http.StatusOK, gin.H{"result": "competition name exists"})
		return
	}

	var comp model.Competition
	var err error = nil

	comp.Name = name
	loc := time.FixedZone("UTC+8", +8*60*60)
	if comp.Date, err = time.ParseInLocation("2006-01-02", date, loc); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"result": "cannot parse date string"})
		return
	}
	comp.HostID = pkg.QuerySession(c, "id").(uint)
	comp.ScoreboardURL = c.PostForm("scoreboardURL")
	comp.Overview = c.PostForm("overview")
	comp.MenRecurve = false
	comp.WomenRecurve = false
	comp.MenCompound = false
	comp.WomenCompound = false
	for _, group := range groups {
		switch group {
			case "MR":
				comp.MenRecurve = true
			case "WR":
				comp.WomenRecurve = true
			case "MC":
				comp.MenCompound = true
			case "WC":
				comp.WomenCompound = true
			default:
				c.JSON(http.StatusBadRequest, gin.H{"result": "unrecognizable group"})
				return
		}
	}
	model.AddCompetition(&comp)
	
	c.JSON(http.StatusOK, gin.H{"result": "success"})
}

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
		c.JSON(http.StatusOK, gin.H{"result": "cannot find the user"})
		return
	}

	if comp, _ := model.CompetitionInfoByID(compID); comp.ID == 0 {
		c.JSON(http.StatusOK, gin.H{"result": "cannot find the competition"})
		return
	}

	if _, err := model.ParticipantInfoBy2ID(userID, compID); err == nil {
		c.JSON(http.StatusOK, gin.H{"result": "participant exists"})
		return
	}
	var par model.Participant
	par.UserID, par.CompetitionID = userID, compID
	
	model.AddParticipant(&par)
	c.JSON(http.StatusOK, gin.H{"result": "success"})
}

func CompetitionInfo(c *gin.Context) {
	
}