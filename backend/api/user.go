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
	user.Username = c.PostForm("username")

	if findUser, _ := model.UserInfo(user.Username); findUser.ID != 0 {
		c.JSON(http.StatusOK, gin.H{"result": "username exists"})
		return
	}

	if c.PostForm("password") != c.PostForm("confirmPassword") {
		c.JSON(http.StatusOK, gin.H{"result": "not consistent"})
		return
	}

	user.Password = pkg.EncryptPassword(c.PostForm("password"))

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
	user, err = model.UserInfo(username)

	if err != nil {
		c.JSON(http.StatusOK, gin.H{"result": "fail"})
		return
	}

	if err := pkg.Compare(user.Password, password); err != nil {
		c.JSON(http.StatusOK, gin.H{"result": "wrong password"})
		return 
	}

	pkg.SaveAuthSession(c, username)
	c.JSON(http.StatusOK, gin.H{"result": "success"})
}

func Logout(c *gin.Context) {
	pkg.ClearAuthSession(c)
	c.JSON(http.StatusOK, gin.H{"result": "success"})
}

