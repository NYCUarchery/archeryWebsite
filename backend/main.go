package main

import (
	"backend/internal/database"
	"backend/internal/endpoint"
	"backend/internal/routers"
	"fmt"

	"github.com/gin-gonic/gin"
)

//	@title			Gin swagger
//	@version		1.0
//	@description	Gin swagger

//	@contact.name	NYCUArchery
//	@contact.url	https://github.com/NYCUarchery

//	@license.name	no license yet

//	@host	localhost:80
//	@BasePath  /api/

//	@tag.name	Session
//	@tag.name	User
//	@tag.name	Institution
//	@tag.name	Competition
//	@tag.name	Participant
//	@tag.name	GroupInfo
//	@tag.name	Qualification
//	@tag.name	Lane
//	@tag.name	Player
//	@tag.name	Elimination
//	@tag.name	PlayerSet
//	@tag.name	MatchResult
//	@tag.name	MatchEnd
//	@tag.name	MatchScore
//	@tag.name	Medal
//	@tag.name	OldLaneInfo
//	@tag.name	docs

// Set the test data into container(server) with FTP clis.
// schemes http
func main() {
	server := gin.Default() // initialize a Gin router
	mode := endpoint.GetConf("config/db.yaml").Mode
	ip := getIpByMode()
	port := "80"

	SetupGinMode(mode)
	database.SetupDatabaseByMode(mode)
	routers.SetUpRouter(server, ip, port)

	server.Run(fmt.Sprintf("%s:%s", ip, port))
}

func getIpByMode() string {
	switch gin.Mode() {
	case "release":
		return "0.0.0.0" // attach the router to an http.Server and start the server
	case "debug":
		return "0.0.0.0" // for localhost test
	case "test":
		return "0.0.0.0"
	default:
		return "0.0.0.0"
	}
}

func SetupGinMode(mode string) {
	switch mode {
	case "release":
		gin.SetMode(gin.ReleaseMode)
	case "debug":
		gin.SetMode(gin.DebugMode)
	case "test":
		gin.SetMode(gin.TestMode)
	default:
		gin.SetMode(gin.DebugMode)
	}
}
