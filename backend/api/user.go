package api

import (
	"github.com/gin-gonic/gin"
	"net/http"

	"backend/internal/pkg"
	"backend/internal/model"
	"strconv"
)

// Register godoc
// @Summary      register a user
// @Description  add a user to db
// @Tags         user
// @Accept       json
// @Produce      json
// @Param   	 username formData string true "user's name"
// @Param   	 password formData string true "password"
// @Param   	 overview formData string false "overview"
// @Param   	 organization formData string false "organization"
// @Success      200  {object}  model.Response "success"
// @Failure      400  {object}  model.Response "username exists | password & confirmPassword not consistent"
// @Failure 	 500  {object}  model.Response "db error"
// @Router       /user [post]
func Register(c *gin.Context) {
	var user model.User
	user.Name = c.PostForm("username")

	if findUser, _ := model.UserInfoByName(user.Name); findUser.ID != 0 {
		c.JSON(http.StatusOK, gin.H{"result": "username exists"})
		return
	}

	if c.PostForm("password") != c.PostForm("confirmPassword") {
		c.JSON(http.StatusOK, gin.H{"result": "not consistent"})
		return
	}

	user.Password = pkg.EncryptPassword(c.PostForm("password"))
	user.Overview = c.PostForm("overview")
	user.Organization = c.PostForm("organization")

	err := model.AddUser(&user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"result": "db error"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"result": "success"})
}

// Login godoc
// @Summary      login
// @Description  get a session
// @Tags         session
// @Accept       json
// @Produce      json
// @Param   	 username formData string true "user's name"
// @Param   	 password formData string true "password"
// @Success      200  {object}  model.Response "success | has loginned"
// @Failure      404  {object}  model.Response "no user found | wrong password"
// @Router       /session [post]
func Login(c *gin.Context) {
	username := c.PostForm("username")
	password := c.PostForm("password")

	if pkg.IsAuthenticated(c) {
		c.JSON(http.StatusOK, gin.H{"result": "has loginned"})
		return
	}

	var err error
	var user model.User
	user, err = model.UserInfoByName(username)

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"result": "no user found"})
		return
	}

	if err := pkg.Compare(user.Password, password); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"result": "wrong password"})
		return 
	}

	pkg.SaveAuthSession(c, user.ID, user.Name)
	c.JSON(http.StatusOK, gin.H{"result": "success"})
}

// Logout godoc
// @Summary      logout
// @Description  delete the session
// @Tags         session
// @Produce      json
// @Success      200  {object}  model.Response "success"
// @Router       /session [delete]
func Logout(c *gin.Context) {
	pkg.ClearAuthSession(c)
	c.JSON(http.StatusOK, gin.H{"result": "success"})
}

// ModifyInfo godoc
// @Summary      modify user's information
// @Description  modify username, password, overview, and organization
// @Tags         user
// @Accept       json
// @Produce      json
// @Param   	 id 	  	 path 	   string true "user's id"
// @Param   	 username 	 formData string true "modified user's name"
// @Param   	 oriPassword formData string true "original password"
// @Param   	 modPassword formData string false "modified password"
// @Param   	 overview formData string false "modified overview"
// @Param   	 organization formData string false "modified organization"
// @Success      200  {object}  model.Response "success"
// @Failure      400  {object}  model.Response "need user id | invalid modified information"
// @Failure      403  {object}  model.Response "id does not match the one in the session"
// @Router       /user/{id} [post]
func ModifyInfo(c *gin.Context) {
	uidstr := c.Param("id")
	if uidstr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"result": "need user id"})
		return
	}

	uid, err := strconv.Atoi(uidstr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"result": "invalid user id"})
		return
	}

	if pkg.QuerySession(c, "id") != uint(uid) {
		c.JSON(http.StatusForbidden, gin.H{"result": "cannot change other's info"})
		return
	}

	username := c.PostForm("username")
	oriPassword := c.PostForm("oriPassword")
	modPassword := c.PostForm("modPassword")
	modOverview := c.PostForm("overview")
	modOrganization := c.PostForm("organization")

	if username == "" {
		c.JSON(http.StatusBadRequest, gin.H{"result": "username can't be empty"})
		return
	}

	findUser, _ := model.UserInfoByName(username)
	if findUser.ID != 0 && findUser.ID != uint(uid) {
		c.JSON(http.StatusBadRequest, gin.H{"result": "username exists"})
		return
	}

	if oriPassword == "" {
		c.JSON(http.StatusBadRequest, gin.H{"result": "original password can't be empty"})
		return
	}

	var user model.User
	user, err = model.UserInfoByID(uint(uid))
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"result": "fail"})
		return
	}

	if err := pkg.Compare(user.Password, oriPassword); err != nil {
		c.JSON(http.StatusOK, gin.H{"result": "wrong original password"})
		return 
	}

	if modPassword != "" {
		if err := pkg.Compare(user.Password, modPassword); err == nil {
			c.JSON(http.StatusBadRequest, gin.H{"result": "original & modified passwords are the same"})
			return 
		}
		user.Password = pkg.EncryptPassword(modPassword)
	}
	user.Name = username
	user.Overview = modOverview
	user.Organization = modOrganization

	model.SaveUserInfo(&user)

	c.JSON(http.StatusOK, gin.H{"result": "success"})
}

// GetUserID godoc
// @Summary      get my uid
// @Description  get my uid in the session
// @Tags         user
// @Produce      json
// @Success      200  {object}  model.UIDResponse "success"
// @Router       /user/me [get]
func GetUserID(c *gin.Context) {
	id := pkg.QuerySession(c, "id")
	c.JSON(http.StatusOK, gin.H{"uid": id})
}

// UserInfo godoc
// @Summary      modify user's information
// @Description  modify username, password, overview, and organization
// @Tags         user
// @Accept       json
// @Produce      json
// @Param   	 id 	  	 path 	  string true "user's id"
// @Success      200  {object}  model.Response "success"
// @Failure      400  {object}  model.Response "invalid userid"
// @Failure      404  {object}  model.Response "no user found"
// @Router       /user/{id} [get]
func UserInfo(c *gin.Context) {
	uidstr := c.Param("id")
	if uidstr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"result": "need user id"})
		return
	}

	uid, err := strconv.Atoi(uidstr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"result": "invalid user id"})
		return
	}

	user, _ := model.UserInfoByID(uint(uid))
	if user.ID == 0 {
		c.JSON(http.StatusNotFound, gin.H{"result": "no user found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"result": "success",
		"name": user.Name,
		"organization": user.Organization,
		"overview": user.Overview,
	})
}