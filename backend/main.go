package main

import (
	"backend/internal/database"
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
//	@tag.name	Group
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

// schemes http
func main() {
	server := gin.Default() // initialize a Gin router
	ip := getIpByMode()
	port := "80"

	database.DatabaseInitial()
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
