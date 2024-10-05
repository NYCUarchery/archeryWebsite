package endpoint

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"

	"backend/internal/database"
)

type NewInstitutionInfo struct {
	Name string `json:"name"`
}

// CreateInstitution godoc
//
//	@Summary		Create an institution.
//	@Description	Add an institution to db.
//	@Description	Cannot repeat institution name.
//	@Description	Institution name cannot be empty.
//	@Tags			Institution
//	@Accept			json
//	@Produce		json
//	@Param			NewInstitutionInfo	body		NewInstitutionInfo	true	"institution's information"
//	@Success		200					{object}	response.Response	"success"
//	@Failure		400					{object}	response.Response	"empty institution name / institution name already exists"
//	@Failure		500					{object}	response.Response	"db error / get institution / add institution"
//	@Router			/institution [post]
func CreateInstitution(c *gin.Context) {
	var newInstitutionInfo NewInstitutionInfo
	if err := c.ShouldBindJSON(&newInstitutionInfo); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"result": "invalid info"})
		return
	}
	name := newInstitutionInfo.Name
	if name == "" {
		c.JSON(http.StatusBadRequest, gin.H{"result": "empty institution name"})
		return
	}

	if database.GetInstitutionIsExistByName(name) {
		c.JSON(http.StatusBadRequest, gin.H{"result": "institution already exists"})
		return
	}

	err := database.AddInstitution(&database.Institution{Name: name})

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"result": "DB error"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"result": "success"})
}

// InstitutionInfo godoc
//
//	@Summary		Get institution info by id.
//	@Description	Get institution info from db by id.
//	@Tags			Institution
//	@Accept			json
//	@Produce		json
//	@Param			id	path		int						true	"institution's id"
//	@Success		200	{object}	database.Institution	"success, return institution info"
//	@Failure		400	{object}	response.Response		"invalid institution id"
//	@Failure		404	{object}	response.Response		"no institution found"
//	@Router			/institution/{id} [get]
func InstitutionInfo(c *gin.Context) {
	idstr := c.Param("id")
	id, err := strconv.Atoi(idstr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"result": "invalid id"})
		return
	}

	institution := database.InstitutionInfoByID(uint(id))
	if institution.ID == 0 {
		c.JSON(http.StatusNotFound, gin.H{"result": "no institution found"})
		return
	}

	c.JSON(http.StatusOK, institution)
}

// AllInstitutionInfo godoc
//
//	@Summary		Get all institution info.
//	@Description	Get all institution info from db.
//	@Tags			Institution
//	@Produce		json
//	@Success		200	{object}	[]database.Institution	"success, return all institution info"
//	@Failure		500	{object}	response.Response		"DB error"
//	@Router			/institution [get]
func AllInstitutionInfo(c *gin.Context) {
	institutions, err := database.AllInstitutionInfo()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"result": "DB error"})
		return
	}

	c.JSON(http.StatusOK, institutions)
}

// DeleteInstitution godoc
//
//	@Summary		Delete an institution.
//	@Description	Delete an institution from db.
//	@Tags			Institution
//	@Accept			json
//	@Produce		json
//	@Param			id	path		int					true	"institution's id"
//	@Success		200	{object}	response.Response	"success"
//	@Failure		400	{object}	response.Response	"invalid id"
//	@Failure		404	{object}	response.Response	"institution not found"
//	@Router			/institution/{id} [delete]
func DeleteInstitution(c *gin.Context) {
	idstr := c.Param("id")
	id, err := strconv.Atoi(idstr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"result": "invalid id"})
		return
	}

	if !database.GetInstitutionIsExist(uint(id)) {
		c.JSON(http.StatusNotFound, gin.H{"result": "institution not found"})
		return
	}

	err = database.DeleteInstitutionByID(uint(id))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"result": "DB error"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"result": "success"})
}
