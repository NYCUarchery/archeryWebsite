package api

import (
	"github.com/gin-gonic/gin"
	"net/http"
	//"fmt"
	"time"
	"backend/model"
	"backend/pkg"
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