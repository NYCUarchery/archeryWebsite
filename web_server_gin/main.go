package main

import (
	"web_server_gin/database"
	"web_server_gin/routers"

	"github.com/gin-gonic/gin"
)

func main() {
	router := gin.Default() // initialize a Gin router
	data := router.Group("/data")
	views := router.Group("/views")

	go func() { database.Database_Initial() }()

	routers.AddViewsRouter(views, router)
	routers.AddDataRouter(data)

	router.Run("0.0.0.0:8080") // attach the router to an http.Server and start the server
	// router.Run("127.0.0.1:8080") // for localhost test

}
