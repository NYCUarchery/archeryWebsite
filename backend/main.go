package main

import (
	"backend/internal/config"
	"backend/internal/database"
	"backend/internal/routers"
	"flag"
	"fmt"
	"log"

	"github.com/gin-gonic/gin"
)

//	@title			Gin swagger
//	@version		1.0
//	@description	Gin swagger

//	@contact.name	NYCUArchery
//	@contact.url	https://github.com/NYCUarchery

//	@license.name	no license yet

//	@host	127.0.0.1:80
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
//	@tag.name	docs

// Set the test data into container(server) with FTP clis.
// schemes http
func main() {
	envFile := flag.String("env-file", "", "optional dotenv file")
	flag.Parse()
	app, err := config.Load(*envFile)
	if err != nil {
		log.Fatal(err)
	}
	if err := app.ValidateServer(); err != nil {
		log.Fatal(err)
	}
	SetupGinMode(app.Environment)
	server := gin.Default() // initialize a Gin router after selecting its mode
	ip := getIpByMode()
	port := "80"
	if err := database.DatabaseInitial(app); err != nil {
		log.Fatal(err)
	}
	routers.SetUpRouter(server, ip, port, app.SessionKey)

	server.Run(fmt.Sprintf("%s:%s", ip, port))
}

func getIpByMode() string {
	switch gin.Mode() {
	case gin.ReleaseMode:
		return "0.0.0.0" // attach the router to an http.Server and start the server
	case gin.DebugMode:
		return "0.0.0.0" // for localhost test
	case "test":
		return "0.0.0.0"
	default:
		return "0.0.0.0"
	}
}

func SetupGinMode(mode string) {
	switch mode {
	case "production":
		gin.SetMode(gin.ReleaseMode)
	case "development":
		gin.SetMode(gin.DebugMode)
	case "test":
		gin.SetMode(gin.TestMode)
	default:
		gin.SetMode(gin.DebugMode)
	}
}
