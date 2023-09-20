package api

import (
	"github.com/gin-gonic/gin"
	"net/http"

	"backend/internal/pkg"
	"backend/internal/model"
	"strconv"
)

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
	user.Overview = c.PostForm("Overview")
	user.Organization = c.PostForm("Organization")

	err := model.AddUser(&user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"result": "db error"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"result": "success"})
}

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
		c.JSON(http.StatusOK, gin.H{"result": "fail"})
		return
	}

	if err := pkg.Compare(user.Password, password); err != nil {
		c.JSON(http.StatusOK, gin.H{"result": "wrong password"})
		return 
	}

	pkg.SaveAuthSession(c, user.ID, user.Name)
	c.JSON(http.StatusOK, gin.H{"result": "success"})
}

func Logout(c *gin.Context) {
	pkg.ClearAuthSession(c)
	c.JSON(http.StatusOK, gin.H{"result": "success"})
}

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
	if findUser.ID != 0 {
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

func GetUserID(c *gin.Context) {
	name := pkg.QuerySession(c, "id")
	c.JSON(http.StatusOK, gin.H{"uid": name})
}

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
		c.JSON(http.StatusOK, gin.H{"result": "no user found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"result": "success",
		"name": user.Name,
		"organization": user.Organization,
		"overview": user.Overview,
	})
}