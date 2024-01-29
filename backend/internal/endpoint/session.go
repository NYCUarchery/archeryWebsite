package endpoint

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"backend/internal/database"
	"backend/internal/pkg"
)

// Login godoc
//
//	@Summary		login
//	@Description	get a session
//	@Tags			Session
//	@Accept			json
//	@Produce		json
//	@Param			username	formData	string				true	"user's name"
//	@Param			password	formData	string				true	"password"
//	@Success		200			string	string
//	@Failure		401			string	string
//	@Router			/session [post]
func Login(c *gin.Context) {
	username := c.PostForm("username")
	password := c.PostForm("password")

	if pkg.IsAuthenticated(c) {
		c.JSON(http.StatusOK, gin.H{"result": "has loginned"})
		return
	}

	user := database.FindByUsername(username)

	// No user found
	if user.ID == 0 {
		c.JSON(http.StatusUnauthorized, gin.H{"result": "user not found"})
		return
	}

	// Wrong password
	if err := pkg.Compare(user.Password, password); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"result": "wrong password"})
		return
	}

	pkg.SaveAuthSession(c, user.ID, user.UserName)
	c.JSON(http.StatusOK, gin.H{"result": "success"})
}

// Logout godoc
//
//	@Summary		logout
//	@Description	delete the session
//	@Tags			Session
//	@Produce		json
//	@Success		200	{object}	response.Response	"success"
//	@Router			/session [delete]
func Logout(c *gin.Context) {
	pkg.ClearAuthSession(c)
	c.JSON(http.StatusOK, gin.H{"result": "success"})
}
