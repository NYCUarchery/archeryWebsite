package endpoint

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"backend/internal/database"
	"backend/internal/pkg"
	"strconv"
)

// Register godoc
//
//	@Summary		register a user
//	@Description	add a user to db
//	@Tags			User
//	@Accept			json
//	@Produce		json
//	@Param			user_name		path	string				true	"user's name"
//	@Param			real_name		path	string				false	"real name"
//	@Param			password		path	string				true	"password"
//	@Param			email			path	string				true	"email"
//	@Param			overview		path	string				false	"overview"
//	@Param			institutionID	path	string				true	"institution ID"
//	@Success		200				{object}	database.User		"a user object"
//	@Failure		400				{object}	response.Response	"username/email exists | empty username/password/email/institutionID | invalid info"
//	@Failure		500				{object}	response.Response	"db error"
//	@Router			/user [post]
func Register(c *gin.Context) {
	var user database.User
	user.UserName = c.PostForm("username")

	if user.UserName == "" {
		c.JSON(http.StatusBadRequest, gin.H{"result": "empty username"})
		return
	}

	if findUser := database.FindByUsername(user.UserName); findUser.ID != 0 {
		c.JSON(http.StatusBadRequest, gin.H{"result": "username exists"})
		return
	}

	plainPassword := c.PostForm("password")
	if plainPassword == "" {
		c.JSON(http.StatusBadRequest, gin.H{"result": "empty password"})
		return
	}
	user.Password = pkg.EncryptPassword(plainPassword)

	user.RealName = c.PostForm("realName")

	user.Email = c.PostForm("email")
	if user.Email == "" {
		c.JSON(http.StatusBadRequest, gin.H{"result": "empty email"})
		return
	}
	if database.CheckEmailExistExclude(user.Email, 0) {
		c.JSON(http.StatusBadRequest, gin.H{"result": "email exists"})
		return
	}

	user.Overview = c.PostForm("overview")

	insIDStr := c.PostForm("institutionID")
	if insIDStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"result": "empty institution ID"})
		return
	}

	insID, err := strconv.Atoi(insIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"result": "invalid institution ID"})
		return
	}
	ins := database.InstitutionInfoByID(uint(insID))

	if ins.ID == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"result": "no institution found"})
		return
	}
	user.InstitutionID = uint(insID)

	user, err = database.CreateUser(user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"result": "db error"})
		return
	}

	c.JSON(http.StatusOK, user)
}

// ModifyInfo godoc
//
//	@Summary		modify user's information
//	@Description	modify username, password, overview, and institution_id
//	@Tags			User
//	@Accept			json
//	@Produce		json
//	@Param			id				path		string				true	"user's id"
//	@Param			oriPassword		formData	string				true	"original password"
//	@Param			modPassword		formData	string				false	"modified password"
//	@Param			email			formData	string				false	"modified email"
//	@Param			overview		formData	string				false	"modified overview"
//	@Param			institutionID	formData	string				false	"modified institution ID"
//	@Success		200				{object}	response.Response	"success"
//	@Failure		400				{object}	response.Response	"empty/invalid user id | invalid modified information"
//	@Failure		403				{object}	response.Response	"cannot change other's info | wrong original password"
//	@Failure		500				{object}	response.Response	"internal db error"
//	@Router			/user/{id} [put]
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

	modInstitutionID := uint(1)
	insIDStr := c.PostForm("institutionID")
	if insIDStr != "" {
		insID, err := strconv.Atoi(insIDStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"result": "invalid institution ID"})
			return
		}
		modInstitutionID = uint(insID)
	}

	if oriPassword == "" {
		c.JSON(http.StatusBadRequest, gin.H{"result": "empty original password"})
		return
	}

	if modEmail == "" {
		c.JSON(http.StatusBadRequest, gin.H{"result": "empty email"})
		return
	}

	if database.CheckEmailExistExclude(modEmail, uint(uid)) {
		c.JSON(http.StatusBadRequest, gin.H{"result": "email exists"})
		return
	}

	var user database.User
	user, err = database.FindByUserID(uint(uid))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"result": "internal db error"})
		return
	}
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
	user.InstitutionID = modInstitutionID

	database.SaveUserInfo(&user)

	c.JSON(http.StatusOK, gin.H{"result": "success"})
}

// GetUserID godoc
//
//	@Summary		get my uid
//	@Description	get my uid in the session
//	@Tags			User
//	@Produce		json
//	@Success		200	{object}	response.Response{id=uint}	"success"
//	@Router			/user/me [get]
func GetUserID(c *gin.Context) {
	id := pkg.QuerySession(c, "id")
	c.JSON(http.StatusOK, gin.H{"id": id})
}

// UserInfo godoc
//
//	@Summary		get a user's information
//	@Description	get a user's username, overview, and institution id
//	@Tags			User
//	@Accept			json
//	@Produce		json
//	@Param			id	path		string									true	"user's id"
//	@Success		200	{object}	response.Response{data=database.User}	"success"
//	@Failure		400	{object}	response.Response						"empty/invalid user id"
//	@Failure		404	{object}	response.Response						"no user found"
//	@Router			/user/{id} [get]
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

	user, _ := database.FindByUserID(uint(uid))
	if user.ID == 0 {
		c.JSON(http.StatusNotFound, gin.H{"result": "no user found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"result": "success",
		"data":   user,
	})
}
