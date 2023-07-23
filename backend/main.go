package main

import (
	"github.com/gin-gonic/gin"
	"net/http"
	"backend/apis"
)

func main() {
	router := routerSetup()
	
	router.Run("127.0.0.1:8080")
}

func routerSetup() *gin.Engine {
	router := gin.Default()

	router.Use(allowCORSMiddleware())

	sr := router.Group("/api")
	{
		sr.GET("/", apis.AuthMiddleware(), func(c *gin.Context) {
			c.JSON(http.StatusOK, gin.H{"result": "ok"});
		})

		sr.POST("/login", apis.Login)

		sr.GET("/logout", apis.Logout)
	}

	return router
}

func allowCORSMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "*")
		c.Next()
	}
}