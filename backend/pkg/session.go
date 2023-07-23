package pkg

import (
	"github.com/gin-contrib/sessions"
	"github.com/gin-contrib/sessions/cookie"
	"github.com/gin-gonic/gin"
	"net/http"
)

const KEY = "secret555555"

func EnableCookieSessionMiddleware() gin.HandlerFunc {
    store := cookie.NewStore([]byte(KEY))
    return sessions.Sessions("mysession", store)
}

func AuthSessionMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
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
	session := sessions.Default(c)

	username := session.Get("username")

	return username != nil
}

func SaveAuthSession(c *gin.Context, username string) {
    session := sessions.Default(c)
    session.Set("username", username)
    session.Save()
}

func ClearAuthSession(c *gin.Context) {
	session := sessions.Default(c)
    session.Clear()
    session.Save()
}