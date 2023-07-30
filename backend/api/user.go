package api

import (
	"github.com/gin-gonic/gin"
	"net/http"
	//"fmt"
	"backend/pkg"
	"backend/model"
)

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

	if user.Password == password {
		pkg.SaveAuthSession(c, username)
		c.JSON(http.StatusOK, gin.H{"result": "success"})
		return 
	}

	c.JSON(http.StatusOK, gin.H{"result": "fail"})
}

func Logout(c *gin.Context) {
	pkg.ClearAuthSession(c)
	c.JSON(http.StatusOK, gin.H{"result": "success"})
}

// Authenticate performs the login authentication
func Authenticate(username, password string) bool {
	// Validate the username and password (e.g., check against database, external API, etc.)
	// ...

	// Return true if authentication is successful, false otherwise
	return true
}
