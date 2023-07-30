package main

import (
	"web_server_gin/routers"
	"web_server_gin/database"
	"web_server_gin/translate"

    "github.com/gin-gonic/gin"
)

func main() {
	router := gin.Default() // initialize a Gin router
	api := router.Group("/api")
	database.Database_Initial()
	router.LoadHTMLGlob("views/index.html")
	router.Static("/assets", "./views/assets") //設定靜態資源的讀取
	router.GET("/home", translate.GetHTML)

	routers.AddViewsRouter(api)
	routers.AddDataRouter(api)

	router.Run("localhost:8080") // attach the router to an http.Server and start the server
}
