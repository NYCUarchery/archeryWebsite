package api

import (
	"github.com/gin-gonic/gin"
	"net/http"
	"time"
	"backend/internal/model"
	"backend/internal/pkg"
	"backend/internal/response"
	"strconv"
	"encoding/json"
)

// CreateCompetition godoc
// @Summary      create a competition
// @Description  create a competition and set the person as the host
// @Tags         competition
// @Accept       json
// @Produce      json
// @Param   	 name 	 	 	formData string true "competition name"
// @Param   	 date 		 	formData string true "date"
// @Param   	 groups 	 	formData string true "a list of groups"
// @Param   	 overview 	 	formData string false "overview"
// @Param   	 scoreboardURL 	formData string false "Scoreboard URL"
// @Success      200  {object}  response.CompResponse "success"
// @Failure      400  {object}  response.Response "competition name exists | cannot parse date string | invalid info/groups"
// @Failure      500  {object}  response.Response "DB error"
// @Router       /competition [post]
func CreateCompetition(c *gin.Context) {
	name := c.PostForm("name")
	date := c.PostForm("date")
	groups := c.PostFormArray("groups")
	
	if findComp := model.CompetitionInfoByName(name); findComp.ID != 0 {
		c.JSON(http.StatusBadRequest, gin.H{"result": "competition name exists"})
		return
	}

	var comp model.Competition
	var err error = nil

	comp.Name = name
	if comp.Date, err = time.Parse("2006-01-02T15:04:05+08:00", date); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"result": "cannot parse date string"})
		return
	}
	comp.HostID = pkg.QuerySession(c, "id").(uint)
	comp.ScoreboardURL = c.PostForm("scoreboardURL")
	comp.Overview = c.PostForm("overview")
	
	var compGroups []model.Group
	for _, grstr := range groups {
		gr := struct {
			GroupName 	string `json:"groupName"`
			BowType 	string `json:"bowType"`
			GameRange   int	   `json:"gameRange"`
		}{}
		if err = json.Unmarshal([]byte(grstr), &gr); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"result": "invalid groups"})
			return
		}
		group := model.Group {
			GroupName: gr.GroupName,
			BowType: gr.BowType,
			GameRange: gr.GameRange,
		}
		compGroups = append(compGroups, group)
	}

	err = model.AddCompetition(&comp)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"result": "DB error"})
		return
	}

	for _, group := range compGroups {
		group.CompetitionID = comp.ID
		model.AddGroup(&group)
	}
	
	c.JSON(http.StatusOK, gin.H{
		"result": "success",
		"compID": comp.ID,
	})
}

// CompetitionInfo godoc
// @Summary      get information of the competition
// @Description  get info, groups, participants of the competition
// @Tags         competition
// @Produce      json
// @Param   	 id 	 	 path int true "competition id"
// @Success      200  {object}  response.CompInfoResponse "success"
// @Failure      400  {object}  response.Response "empty/invalid competition id"
// @Failure      404  {object}  response.Response "no competition found"
// @Router       /competition/{id} [get]
func CompetitionInfo(c *gin.Context) {
	cidstr := c.Param("id")
	if cidstr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"result": "empty competition id"})
		return
	}

	cid, err := strconv.Atoi(cidstr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"result": "invalid competition id"})
		return
	}

	comp := model.CompetitionInfoByID(uint(cid))
	if comp.ID == 0 {
		c.JSON(http.StatusNotFound, gin.H{"result": "no competition found"})
		return
	}

	var pars []model.Participant
	pars, err = model.CompetitionParticipants(uint(cid))
	var parids []uint
	for _, par := range pars {
		parids = append(parids, par.UserID)
	}

	var groups []model.Group
	groups, err = model.CompetitionGroups(uint(cid))
	var resGroups []response.Group
	for _, gr := range groups {
		resGroups = append(resGroups, response.Group{
			ID: gr.ID,
			CompetitionID: gr.CompetitionID,
			GroupName: gr.GroupName,
			BowType: gr.BowType,
			GameRange: gr.GameRange,
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"result": "success",
		"name": comp.Name,
		"date": comp.Date,
		"hostID": comp.HostID,
		"scoreboardURL": comp.ScoreboardURL,
		"overview": comp.Overview,
		"groups": resGroups,
		"participants": parids,
	})
}

// AllCompetitionInfo godoc
// @Summary      get information of all the competitions
// @Description  get id, name, date, hostID, scoreboardURL, and overview only
// @Tags         competition
// @Produce      json
// @Success      200  {object}  response.AllCompInfoResponse "success"
// @Router       /competition [get]
func AllCompetitionInfo(c *gin.Context) {
	comps := model.AllCompetitionInfo()

	c.JSON(http.StatusOK, gin.H{
		"result": "success",
		"competitions": comps,
	})
}

