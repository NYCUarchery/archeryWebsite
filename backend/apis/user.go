package apis

import (
	"github.com/gin-gonic/gin"
	"net/http"
	"fmt"
)

func Login(c *gin.Context) {
	username := c.PostForm("username")
	password := c.PostForm("password")
	if Authenticate(username, password) {
		// Set authentication cookie
		cookie := http.Cookie{
			Name:     "auth",
			Value:    username,
			HttpOnly: true,
		}
		http.SetCookie(c.Writer, &cookie)
		c.JSON(http.StatusOK, gin.H{"result": "success"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"result": "fail"})
}

func Logout(c *gin.Context) {
	// Clear authentication cookie
	cookie := http.Cookie{
		Name:     "auth",
		Value:    "",
		MaxAge:   -1,
		HttpOnly: true,
	}
	http.SetCookie(c.Writer, &cookie)
}

func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		fmt.Println("authmiddleware here")
		if !IsAuthenticated(c) {
			c.JSON(http.StatusUnauthorized, gin.H{"result": "require login"})
			c.Abort()
			
			return
		}
		
		c.Next()
	}
}

// IsAuthenticated checks if the user is authenticated
func IsAuthenticated(c *gin.Context) bool {
	// Check if the authentication cookie exists
	cookie, err := c.Cookie("auth")
	if err != nil || cookie == "" {
		return false
	}

	// Validate the authentication cookie (e.g., check against session store, database, etc.)
	// ...

	// Return true if authenticated, false otherwise
	return true
}

// Authenticate performs the login authentication
func Authenticate(username, password string) bool {
	// Validate the username and password (e.g., check against database, external API, etc.)
	// ...

	// Return true if authentication is successful, false otherwise
	return true
}
