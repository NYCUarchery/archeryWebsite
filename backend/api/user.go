package api

import (
	"github.com/gin-gonic/gin"
	"net/http"
	//"fmt"
	"backend/pkg"
	"backend/model"
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

	model.AddUser(&user)

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
	username := c.PostForm("username")
	oriPassword := c.PostForm("oriPassword")
	modPassword := c.PostForm("modPassword")
	modOverview := c.PostForm("overview")
	modOrganization := c.PostForm("organization")

	if username == "" {
		c.JSON(http.StatusBadRequest, gin.H{"result": "username can't be empty"})
		return
	}

	if oriPassword == "" {
		c.JSON(http.StatusBadRequest, gin.H{"result": "original password can't be empty"})
		return
	}

	if pkg.QuerySession(c, "username") != username {
		c.JSON(http.StatusForbidden, gin.H{"result": "cannot change other's info"})
		return
	}

	var err error
	var user model.User
	user, err = model.UserInfoByName(username)
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
			c.JSON(http.StatusOK, gin.H{"result": "original password is the same as the modified one"})
			return 
		}
		user.Password = pkg.EncryptPassword(modPassword)
	}
	user.Overview = modOverview
	user.Organization = modOrganization

	model.SaveUserInfo(&user)

	c.JSON(http.StatusOK, gin.H{"result": "success"})
}