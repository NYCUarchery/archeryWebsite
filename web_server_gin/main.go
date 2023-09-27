package main

import (
	"fmt"
	routers "web_server_gin/Routers"
	"web_server_gin/database"

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
	// ip := "0.0.0.0" // attach the router to an http.Server and start the server
	ip := "127.0.0.1" // for localhost test
	port := "8080"

	database.DatabaseInitial()
	routers.SetUpRouter(server, ip, port)

	server.Run(fmt.Sprintf("%s:%s", ip, port))

}
