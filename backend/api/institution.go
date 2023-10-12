package api

import (
	"github.com/gin-gonic/gin"
	"net/http"
	"strconv"

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

// InstitutionInfoByID godoc
// @Summary      get institution info by id
// @Description  get institution info from db by id
// @Tags         institution
// @Accept       json
// @Produce      json
// @Param   	 id 	  	path string true "institution's id"
// @Success      200  {object}  response.Response
// @Failure      400  {object}  response.Response "invalid id"
// @Failure      404  {object}  response.Response "no institution found"
// @Router       /institution/{id} [get]
func InstitutionInfo(c *gin.Context) {
	idstr := c.Param("id")
	id, err := strconv.Atoi(idstr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"result": "invalid id"})
		return
	}

	institution, err := model.InstitutionInfoByID(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"result": "no institution found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"result": "success",
		"data": institution,
	})
}

// AllInstitutionInfo godoc
// @Summary      get all institution info
// @Description  get all institution info from db
// @Tags         institution
// @Accept       json
// @Produce      json
// @Success      200  {object}  response.Response{data=[]model.Institution} "success"
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
		"data": institutions,
	})
}