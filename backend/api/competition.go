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

// CreateCompetition godoc
// @Summary      create a competition
// @Description  create a competition and set the person as the host
// @Tags         competition
// @Accept       json
// @Produce      json
// @Param   	 name 	 	 	formData string true "competition name"
// @Param   	 date 		 	formData string true "date"
// @Param   	 categories  	formData string true "a list of categories"
// @Param   	 overview 	 	formData string false "overview"
// @Param   	 organization 	formData string false "organization"
// @Param   	 scoreboardURL 	formData string false "Scoreboard URL"
// @Success      200  {object}  response.CompResponse "success"
// @Failure      400  {object}  response.Response "competition name exists | cannot parse date string | invalid info/categories"
// @Failure      500  {object}  response.Response "DB error"
// @Router       /competition/ [post]
func CreateCompetition(c *gin.Context) {
	name := c.PostForm("name")
	date := c.PostForm("date")
	categories := c.PostFormArray("categories")
	
	if findComp, _ := model.CompetitionInfoByName(name); findComp.ID != 0 {
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

// CompetitionInfo godoc
// @Summary      get information of the competition
// @Description  get info, categories, participants of the competition
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

	comp, _ := model.CompetitionInfoByID(uint(cid))
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

	var cats []model.CompetitionCategory
	cats, err = model.CompetitionCategories(uint(cid))
	var pairs []struct{
		Des string `json:"des"`
		Dis int32 `json:"dis"`
	}
	for _, cat := range cats {
		pairs = append(pairs, struct{
			Des string `json:"des"`
			Dis int32 `json:"dis"`
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

