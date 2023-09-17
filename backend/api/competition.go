package api

import (
	"github.com/gin-gonic/gin"
	"net/http"
	"time"
	"backend/internal/model"
	"backend/internal/pkg"
	"strconv"
	"encoding/json"
)

func CreateCompetition(c *gin.Context) {
	name := c.PostForm("name")
	date := c.PostForm("date")
	categories := c.PostFormArray("categories")
	
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

	err = model.AddCompetition(&comp)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"result": "DB error"})
		return
	}
	
	for _, catstr := range categories {
		cat := struct {
			Des string `json:"des"`
			Dis int32 `json:"dis"`
		}{}
		if err = json.Unmarshal([]byte(catstr), &cat); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"result": "invalid categories"})
			return
		}
		var compcat model.CompetitionCategory
		compcat.CompetitionID = comp.ID
		compcat.Description = cat.Des
		compcat.Distance = cat.Dis
		model.AddCompCategory(&compcat)
	}
	
	c.JSON(http.StatusOK, gin.H{
		"result": "success",
		"compID": comp.ID,
	})
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

	if model.CheckParticipantExist(userID, compID) {
		c.JSON(http.StatusOK, gin.H{"result": "participant exists"})
		return
	}
	var par model.Participant
	par.UserID, par.CompetitionID = userID, compID
	
	model.AddParticipant(&par)
	c.JSON(http.StatusOK, gin.H{"result": "success"})
}

func CompetitionInfo(c *gin.Context) {
	cidstr := c.Param("id")
	if cidstr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"result": "need competition id"})
		return
	}

	cid, err := strconv.Atoi(cidstr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"result": "invalid competition id"})
		return
	}

	comp, _ := model.CompetitionInfoByID(uint(cid))
	if comp.ID == 0 {
		c.JSON(http.StatusOK, gin.H{"result": "no competition found"})
		return
	}

	var pars []model.Participant
	pars, err = model.CompetitionParticipants(uint(cid))
	var parids []uint
	for _, par := range pars {
		parids = append(parids, par.UserID)
	}

	var cats []model.CompetitionCategory
	cats, err = model.CompetitionCategories(uint(cid))
	var pairs []struct{
		Des string
		Dis int32
	}
	for _, cat := range cats {
		pairs = append(pairs, struct{
			Des string
			Dis int32
		}{
			Des: cat.Description,
			Dis: cat.Distance,
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"result": "success",
		"name": comp.Name,
		"date": comp.Date,
		"hostID": comp.HostID,
		"scoreboardURL": comp.ScoreboardURL,
		"overview": comp.Overview,
		"categories": pairs,
		"participants": parids,
	})
}