package main

import (
	"web_server_gin/data"

    "github.com/gin-gonic/gin"
)

func main() {
	router := gin.Default() // initialize a Gin router
	router.GET("/data/albums", data.GetAlbums) // "pass data" action through api(link)
	router.GET("/data/:dataName", data.GetHTTPData) // response "name" data file with /data/2JSON method

	router.Run("localhost:8080") // attach the router to an http.Server and start the server
}
