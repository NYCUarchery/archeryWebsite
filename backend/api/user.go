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
// @Param   	 username 	  formData string true "user's name"
// @Param   	 password 	  formData string true "password"
// @Param   	 email 	  	  formData string true "email"
// @Param   	 overview 	  formData string false "overview"
// @Param   	 organization formData string false "organization"
// @Success      200  {object}  response.Response "success"
// @Failure      400  {object}  response.Response "username/email exists | empty username/password/email"
// @Failure 	 500  {object}  response.Response "db error"
// @Router       /user [post]
func Register(c *gin.Context) {
	var user model.User
	user.Name = c.PostForm("username")

	if user.Name == "" {
		c.JSON(http.StatusBadRequest, gin.H{"result": "empty username"})
		return
	}

	if findUser := model.UserInfoByName(user.Name); findUser.ID != 0 {
		c.JSON(http.StatusBadRequest, gin.H{"result": "username exists"})
		return
	}

	user.Password = pkg.EncryptPassword(c.PostForm("password"))
	if user.Password == "" {
		c.JSON(http.StatusBadRequest, gin.H{"result": "empty password"})
		return
	}
	user.Email = c.PostForm("email")
	if user.Email == "" {
		c.JSON(http.StatusBadRequest, gin.H{"result": "empty email"})
		return
	}
	if model.CheckEmailExist(user.Email) {
		c.JSON(http.StatusBadRequest, gin.H{"result": "email exists"})
		return
	}
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
// @Success      200  {object}  response.Response "success | has loginned"
// @Failure      401  {object}  response.Response "wrong username or password"
// @Router       /session [post]
func Login(c *gin.Context) {
	username := c.PostForm("username")
	password := c.PostForm("password")

	if pkg.IsAuthenticated(c) {
		c.JSON(http.StatusOK, gin.H{"result": "has loginned"})
		return
	}

	var user model.User
	user = model.UserInfoByName(username)

	// No user found
	if user.ID == 0 {
		c.JSON(http.StatusUnauthorized, gin.H{"result": "wrong username or password"})
		return
	}

	// Wrong password
	if err := pkg.Compare(user.Password, password); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"result": "wrong username or password"})
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
// @Success      200  {object}  response.Response "success"
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
// @Param   	 id 	  	 	path 	   string true "user's id"
// @Param   	 oriPassword 	formData string true "original password"
// @Param   	 modPassword 	formData string false "modified password"
// @Param   	 email		 	formData string false "modified email"
// @Param   	 overview 		formData string false "modified overview"
// @Param   	 organization 	formData string false "modified organization"
// @Success      200  {object}  response.Response "success"
// @Failure      400  {object}  response.Response "empty/invalid user id | invalid modified information"
// @Failure      403  {object}  response.Response "cannot change other's info | wrong original password"
// @Router       /user/{id} [put]
func ModifyInfo(c *gin.Context) {
	uidstr := c.Param("id")
	if uidstr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"result": "empty user id"})
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

	oriPassword := c.PostForm("oriPassword")
	modPassword := c.PostForm("modPassword")
	modEmail := c.PostForm("email")
	modOverview := c.PostForm("overview")
	modOrganization := c.PostForm("organization")

	if oriPassword == "" {
		c.JSON(http.StatusBadRequest, gin.H{"result": "empty original password"})
		return
	}

	if modEmail == "" {
		c.JSON(http.StatusBadRequest, gin.H{"result": "empty email"})
		return
	}

	if model.CheckEmailExist(modEmail) {
		c.JSON(http.StatusBadRequest, gin.H{"result": "email exists"})
		return
	}

	var user model.User
	user = model.UserInfoByID(uint(uid))
	if user.ID == 0 {
		c.JSON(http.StatusNotFound, gin.H{"result": "no user found"})
		return
	}

	if err := pkg.Compare(user.Password, oriPassword); err != nil {
		c.JSON(http.StatusForbidden, gin.H{"result": "wrong original password"})
		return 
	}

	if modPassword != "" {
		if err := pkg.Compare(user.Password, modPassword); err == nil {
			c.JSON(http.StatusBadRequest, gin.H{"result": "original & modified passwords are the same"})
			return 
		}
		user.Password = pkg.EncryptPassword(modPassword)
	}
	
	user.Email = modEmail
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
// @Success      200  {object}  response.UIDResponse "success"
// @Router       /user/me [get]
func GetUserID(c *gin.Context) {
	id := pkg.QuerySession(c, "id")
	c.JSON(http.StatusOK, gin.H{"uid": id})
}

// UserInfo godoc
// @Summary      get a user's information
// @Description  get a user's username, overview, and organization
// @Tags         user
// @Accept       json
// @Produce      json
// @Param   	 id 	  	 path 	  string true "user's id"
// @Success      200  {object}  response.UserInfoResponse "success"
// @Failure      400  {object}  response.Response "empty/invalid user id"
// @Failure      404  {object}  response.Response "no user found"
// @Router       /user/{id} [get]
func UserInfo(c *gin.Context) {
	uidstr := c.Param("id")
	if uidstr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"result": "empty user id"})
		return
	}

	uid, err := strconv.Atoi(uidstr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"result": "invalid user id"})
		return
	}

	user := model.UserInfoByID(uint(uid))
	if user.ID == 0 {
		c.JSON(http.StatusNotFound, gin.H{"result": "no user found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"result": "success",
		"name": user.Name,
		"email": user.Email,
		"organization": user.Organization,
		"overview": user.Overview,
	})
}