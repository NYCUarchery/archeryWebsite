package api

import (
	"github.com/gin-gonic/gin"
	"net/http"

	"backend/internal/model"
)

// CreateInstitution godoc
// @Summary      create an institution
// @Description  add an institution to db
// @Tags         institution
// @Accept       json
// @Produce      json
// @Param   	 name 	  	formData string true "institution's name"
// @Success      200  {object}  response.Response "success"
// @Failure      400  {object}  response.Response "empty institution name"
// @Failure 	 500  {object}  response.Response "db error"
// @Router       /institution [post]
func CreateInstitution(c *gin.Context) {
	name := c.PostForm("name")
	if name == "" {
		c.JSON(http.StatusBadRequest, gin.H{"result": "empty institution name"})
		return
	}

	err := model.AddInstitution(&model.Institution{Name: name})

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"result": "DB error"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"result": "success"})
}

// AllInstitutionInfo godoc
// @Summary      get all institution info
// @Description  get all institution info from db
// @Tags         institution
// @Accept       json
// @Produce      json
// @Success      200  {object}  resonse.AllInsResponse
// @Failure 	 500  {object}  response.Response "db error"
// @Router       /institution [get]
func AllInstitutionInfo(c *gin.Context) {
	institutions, err := model.AllInstitutionInfo()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"result": "DB error"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"result": "success",
		"institutions": institutions,
	})
}