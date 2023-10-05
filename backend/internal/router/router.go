package router

import (
	"net/http"
	"github.com/gin-gonic/gin"

	"backend/api"
	"backend/internal/pkg"

	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
)

func RouterSetup() *gin.Engine {
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
			userssr.POST("/", api.Register)
			userssr.PUT("/:id", pkg.AuthSessionMiddleware(), api.ModifyInfo)
			userssr.GET("/me", pkg.AuthSessionMiddleware(), api.GetUserID)
			userssr.GET("/:id", api.UserInfo)
		}

		sessionssr := sr.Group("/session")
		{
			sessionssr.POST("/", api.Login)
			sessionssr.DELETE("/", api.Logout)
		}

		compssr := sr.Group("/competition")
		{
			compssr.POST("/", pkg.AuthSessionMiddleware(), api.CreateCompetition)
			compssr.GET("/", api.AllCompetitionInfo)
			compssr.GET("/:id", api.CompetitionInfo)
		}

		parssr := sr.Group("/participant")
		{
			parssr.POST("/", pkg.AuthSessionMiddleware(), api.JoinInCompetition)
		}
	}

	router.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	return router
}

func allowCORSMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "http://localhost:3000")
		c.Header("Access-Control-Allow-Credentials", "true")
		c.Next()
	}
}