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

	// router.Run("0.0.0.0:8080") // attach the router to an http.Server and start the server
	router.Run("127.0.0.1:8080") // for localhost test

}

/*
原來
"all_scores": [
        [9, 9, 7, 6, 5, 0],
        [9, 8, 7, 6, 3, 2],
        [8, 7, 4, 4, 2, 2],
        [11, 9, 8, 7, 6, 5]
      ],

應該會做出來這樣
"all_scores": [
        {"player":[{score:9}, {score:9}, {score:7}, {score:6}, {score:5}, {score:0}]},
        {"player":[{score:9}, {score:9}, {score:7}, {score:6}, {score:5}, {score:0}]},
        {"player":[{score:9}, {score:9}, {score:7}, {score:6}, {score:5}, {score:0}]},
        {"player":[{score:9}, {score:9}, {score:7}, {score:6}, {score:5}, {score:0}]}
      ],
*/
