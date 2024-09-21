package endpoint

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"backend/internal/database"
	"backend/internal/pkg"
)

type LoginInfo struct {
	UserName string `json:"user_name"`
	Password string `json:"password"`
}

// Login godoc
//
//	@Summary		login
//	@Description	get a session
//	@Tags			Session
//	@Accept			json
//	@Produce		json
//	@Param			LoginInfo	body		endpoint.LoginInfo						true	"user_name, password"
//	@Success		200			{object}	response.Response						"success"
//	@Success		200			{object}	response.Response						"already loginned"
//	@Failure		400			{object}	response.ErrorReceiveDataFormatResponse	"invalid login info"
//	@Failure		401			{object}	response.ErrorResponse					"user not found"
//	@Failure		401			{object}	response.ErrorResponse					"incorrect password"
//	@Router			/session [post]
func Login(c *gin.Context) {
	var loginInfo LoginInfo
	if err := c.ShouldBindJSON(&loginInfo); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "invalid info"})
		return
	}
	// check if server has session which is logined
	if pkg.IsAuthenticated(c) {
		c.JSON(http.StatusOK, gin.H{"message": "has loginned"})
		return
	}
	user := database.FindByUsername(loginInfo.UserName)

	// No user found
	if user.ID == 0 {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "user not found"})
		return
	}

	// Wrong password
	if err := pkg.Compare(user.Password, loginInfo.Password); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "wrong password"})
		return
	}
	// if all correct, save session
	pkg.SaveAuthSession(c, user.ID, user.UserName)
	c.JSON(http.StatusOK, gin.H{"message": "success"})
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
	c.JSON(http.StatusOK, gin.H{"message": "success"})
}
