package pkg

import (
	"github.com/gin-contrib/sessions"
	"github.com/gin-contrib/sessions/cookie"
	"github.com/gin-gonic/gin"
	"net/http"
)

func EnableCookieSessionMiddleware() gin.HandlerFunc {
    store := cookie.NewStore([]byte(SessionKey))
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

func IsAuthenticated(c *gin.Context) bool {
	session := sessions.Default(c)

	username := session.Get("username")

	return username != nil
}

func SaveAuthSession(c *gin.Context, id uint, username string) {
    session := sessions.Default(c)
    session.Set("username", username)
	session.Set("id", id)
    session.Save()
}

func ClearAuthSession(c *gin.Context) {
	session := sessions.Default(c)
    session.Clear()
    session.Save()
}

func QuerySession(c *gin.Context, item string) interface{}{
	session := sessions.Default(c)
	return session.Get(item)
}