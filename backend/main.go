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
		
		userssr := sr.Group("/user")
		{
			userssr.POST("/register", api.Register)
			userssr.POST("/login", api.Login)
			userssr.GET("/logout", api.Logout)
			userssr.PUT("/modifyInfo", pkg.AuthSessionMiddleware(), api.ModifyInfo)
			userssr.GET("/getUserID", pkg.AuthSessionMiddleware(), api.GetUserID)
			userssr.GET("/info/:id", api.UserInfo)
		}

		compssr := sr.Group("/competition")
		{
			compssr.POST("/create", api.CreateCompetition, pkg.AuthSessionMiddleware())
			compssr.POST("/join", api.JoinInCompetition, pkg.AuthSessionMiddleware())
			compssr.GET("/info/:id", api.CompetitionInfo)
		}
	}

	return router
}

func allowCORSMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "http://localhost:3000")
		c.Header("Access-Control-Allow-Credentials", "true")
		c.Next()
	}
}
