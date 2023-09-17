package main

import (
	"github.com/gin-gonic/gin"
	"net/http"
	"backend/api"
	"backend/internal/pkg"
)

func main() {

	router := routerSetup()
	
	router.Run("127.0.0.1:8080")
}

func routerSetup() *gin.Engine {
	router := gin.Default()

	router.Use(allowCORSMiddleware())
	router.Use(pkg.EnableCookieSessionMiddleware())

	sr := router.Group("/api")
	{
		sr.GET("/", pkg.AuthSessionMiddleware(), func(c *gin.Context) {
			c.JSON(http.StatusOK, gin.H{"result": "ok"});
		})

		sr.POST("/register", api.Register)
		sr.POST("/login", api.Login)
		sr.GET("/logout", api.Logout)
		sr.POST("/modifyInfo", pkg.AuthSessionMiddleware(), api.ModifyInfo)
		sr.GET("/getUserID", pkg.AuthSessionMiddleware(), api.GetUserID)
		sr.GET("/user/:id", api.UserInfo)

		ssr := sr.Group("/competition", pkg.AuthSessionMiddleware())
		{
			ssr.POST("/create", api.CreateCompetition)
			ssr.POST("/join", api.JoinInCompetition)
		}
	}

	return router
}

func allowCORSMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "*")
		c.Next()
	}
}
