package endpoint

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"backend/internal/database"
	"backend/internal/pkg"
	"backend/internal/response"
	"strconv"
)

// for register
type AccountInfo struct {
	UserName      string `json:"user_name"`
	RealName      string `json:"real_name"`
	Password      string `json:"password"`
	Email         string `json:"email"`
	InstitutionID uint   `json:"institution_id"`
	Overview      string `json:"overview"`
}

// for  modify password info
type ModifyAccountPasswordInfo struct {
	OriginalPassword string `json:"original_password"`
	NewPassword      string `json:"new_password"`
}

// Register godoc
//
//	@Summary		Register a user.
//	@Description	Add a user to db.
//	@Description	Username cannot be empty or repeated.
//	@Description	Password cannot be empty.
//	@Description	Email cannot be empty or repeated.
//	@Tags			User
//	@Accept			json
//	@Produce		json
//	@Param			AccountInfo	body		endpoint.AccountInfo	true	"nessary information for register"
//	@Success		200			{object}	database.User			"a user object"
//	@Failure		400			{object}	response.Response		"username/email exists | empty username/password/email/institutionID | invalid info"
//	@Failure		500			{object}	response.Response		"db error"
//	@Router			/user [post]
func Register(c *gin.Context) {
	var registerInfo AccountInfo
	var user database.User
	if err := c.ShouldBindJSON(&registerInfo); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"result": "invalid info"})
		return
	}
	user.UserName = registerInfo.UserName
	user.RealName = registerInfo.RealName
	user.Password = registerInfo.Password
	user.Email = registerInfo.Email
	user.InstitutionID = registerInfo.InstitutionID
	user.Overview = registerInfo.Overview
	// no need to check id(it is auto created), realname, and overview
	// name
	if user.UserName == "" {
		c.JSON(http.StatusBadRequest, gin.H{"result": "empty username"})
		return
	}
	if database.GetUserNameIsExist(user.UserName) {
		c.JSON(http.StatusBadRequest, gin.H{"result": "username exists"})
		return
	}
	// password
	plainPassword := user.Password
	if plainPassword == "" {
		c.JSON(http.StatusBadRequest, gin.H{"result": "empty password"})
		return
	}
	user.Password = pkg.EncryptPassword(plainPassword)
	// email
	if user.Email == "" {
		c.JSON(http.StatusBadRequest, gin.H{"result": "empty email"})
		return
	}
	if database.GetEmailIsExist(user.Email) {
		c.JSON(http.StatusBadRequest, gin.H{"result": "email exists"})
		return
	}

	// institution id
	if response.ErrorIdTest(c, user.InstitutionID, database.GetInstitutionIsExist(user.InstitutionID), "institution id when register") {
		return
	}

	user, err := database.CreateUser(user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"result": "db error"})
		return
	}

	c.JSON(http.StatusOK, user)
}

// ModifyInfo godoc
//
//	@Summary		Modify user's information.
//	@Description	Modify username, realname, email, overview, and institution_id.
//	@Description	Cannot change password.
//	@Description	Username cannot be empty, repeated.
//	@Description	Email cannot be empty, repeated.
//	@Tags			User
//	@Accept			json
//	@Produce		json
//	@Param			id			path		int								true	"user's id"
//	@Param			ModifyInfo	body		endpoint.ModifyInfo.ModifyUser	true	"modified information"
//	@Success		200			{object}	response.Response				"success"
//	@Failure		400			{object}	response.Response				"empty/invalid user id | invalid modified information"
//	@Failure		403			{object}	response.Response				"cannot change other's info"
//	@Failure		500			{object}	response.Response				"internal db error"
//	@Router			/user/{id} [put]
func ModifyInfo(c *gin.Context) {
	type ModifyUser struct {
		UserName      string `json:"user_name"`
		RealName      string `json:"real_name"`
		Email         string `json:"email"`
		InstitutionID uint   `json:"institution_id"`
		Overview      string `json:"overview"`
	}
	_ = ModifyUser{}
	// check id
	userId := Convert2uint(c, "id")
	if response.ErrorIdTest(c, userId, database.GetUserIsExist(userId), "user id when modify") {
		return
	}
	if pkg.QuerySession(c, "id") != userId {
		c.JSON(http.StatusForbidden, gin.H{"result": "cannot change other's info"})
		return
	}
	// ignore password
	// get user
	user, _ := database.FindByUserID(userId)
	var modifyInfo AccountInfo
	if err := c.ShouldBindJSON(&modifyInfo); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"result": "invalid info"})
		return
	}
	// check username
	if modifyInfo.UserName == "" {
		response.ErrorReceiveDataFormat(c, "username cannot be empty")
		return
	}
	if database.GetUserNameIsExistExclude(modifyInfo.UserName, userId) {
		response.ErrorReceiveDataFormat(c, "username already exists")
		return
	}
	// check email
	if modifyInfo.Email == "" {
		c.JSON(http.StatusBadRequest, gin.H{"result": "empty email"})
		return
	}

	if database.CheckEmailExistExclude(modifyInfo.Email, userId) {
		c.JSON(http.StatusBadRequest, gin.H{"result": "email exists"})
		return
	}
	// check institution id
	if response.ErrorIdTest(c, modifyInfo.InstitutionID, database.GetInstitutionIsExist(modifyInfo.InstitutionID), "institution id when modify") {
		return
	}
	// modify
	user.UserName = modifyInfo.UserName
	user.RealName = modifyInfo.RealName
	user.Email = modifyInfo.Email
	user.InstitutionID = modifyInfo.InstitutionID
	user.Overview = modifyInfo.Overview

	database.SaveUserInfo(&user)

	c.JSON(http.StatusOK, gin.H{"result": "success"})
}

// ModifyPassword godoc
//
//	@Summary		Modify user's password.
//	@Description	Modify user's password.
//	@Description	Original/New password cannot be empty.
//	@Description	Original password must be correct.
//	@Description	New password cannot be the same as original password.
//	@Tags			User
//	@Accept			json
//	@Produce		json
//	@Param			id			path		int									true	"user's id"
//	@Param			ModifyInfo	body		endpoint.ModifyAccountPasswordInfo	true	"modified password information"
//	@Success		200			{object}	response.Response					"success"
//	@Failure		400			{object}	response.Response					"empty/invalid user id | invalid modified information"
//	@Failure		403			{object}	response.Response					"cannot change other's password | wrong original password | original & modified passwords are the same"
//	@Failure		500			{object}	response.Response					"internal db error"
//	@Router			/user/password/{id} [patch]
func ModifyPassword(c *gin.Context) {
	// check id
	userId := Convert2uint(c, "id")
	if response.ErrorIdTest(c, userId, database.GetUserIsExist(userId), "user id when modify password") {
		return
	}
	if pkg.QuerySession(c, "id") != userId {
		c.JSON(http.StatusForbidden, gin.H{"result": "cannot change other's password"})
		return
	}
	// get user
	user, _ := database.FindByUserID(userId)
	var modifyInfo ModifyAccountPasswordInfo
	if err := c.ShouldBindJSON(&modifyInfo); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"result": "invalid info"})
		return
	}
	// check original password
	if modifyInfo.OriginalPassword == "" {
		c.JSON(http.StatusBadRequest, gin.H{"result": "empty original password"})
		return
	}
	if err := pkg.Compare(user.Password, modifyInfo.OriginalPassword); err != nil {
		c.JSON(http.StatusForbidden, gin.H{"result": "wrong original password"})
		return
	}
	// check new password
	if modifyInfo.NewPassword == "" {
		c.JSON(http.StatusBadRequest, gin.H{"result": "empty new password"})
		return
	}
	if err := pkg.Compare(user.Password, modifyInfo.NewPassword); err == nil {
		c.JSON(http.StatusBadRequest, gin.H{"result": "original & modified passwords are the same"})
		return
	}
	// modify
	user.Password = pkg.EncryptPassword(modifyInfo.NewPassword)

	database.SaveUserInfo(&user)

	c.JSON(http.StatusOK, gin.H{"result": "success"})
}

// GetUserID godoc
//
//	@Summary		Get my uid.
//	@Description	Get my uid in the session.
//	@Tags			User
//	@Produce		json
//	@Success		200	{object}	endpoint.GetUserID.ID	"success, return my uid"
//	@Failure		401	{object}	response.Response		"require login"
//	@Router			/user/me [get]
func GetUserID(c *gin.Context) {
	type ID struct {
		ID uint `json:"id"`
	}
	_ = ID{}
	id := pkg.QuerySession(c, "id")
	c.JSON(http.StatusOK, gin.H{"id": id})
}

// UserInfo godoc
//
//	@Summary		Get a user's information.
//	@Description	Get a user's username, overview, and institution id.
//	@Tags			User
//	@Accept			json
//	@Produce		json
//	@Param			id	path		int					true	"user's id"
//	@Success		200	{object}	database.User		"success, return user's info"
//	@Failure		400	{object}	response.Response	"invalid user id"
//	@Failure		404	{object}	response.Response	"no user found"
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

	c.JSON(http.StatusOK, user)
}
