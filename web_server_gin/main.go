package main

import (
	"fmt"
	"web_server_gin/database"
	routers "web_server_gin/routers"

	"github.com/gin-gonic/gin"
)

// @title Gin swagger
// @version 1.0
// @description Gin swagger

// @contact.name NYCUArchery
// @contact.url https://github.com/NYCUarchery

// @license.name ??

// @host localhost:8080
// schemes http
func main() {
	server := gin.Default() // initialize a Gin router
	ip := getIpByMode()
	port := "8080"

	database.DatabaseInitial()
	routers.SetUpRouter(server, ip, port)

	server.Run(fmt.Sprintf("%s:%s", ip, port))
}

func getIpByMode() string {
	switch gin.Mode() {
	case "release":
		return "0.0.0.0" // attach the router to an http.Server and start the server
	case "debug":
		return "127.0.0.1" // for localhost test
	default:
		return "127.0.0.1"
	}
}
