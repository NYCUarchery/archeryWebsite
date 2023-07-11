package main

import (
    "net/http"

    "github.com/gin-gonic/gin"
)

// 'json:"name"' specify what a field’s name should be when the struct’s contents are serialized into JSON
type album struct {
	Name string `json:"name"`
	Ranking int64 `json:"rank"`
	Target int64 `json:"target"`
	Institution string `json:"institution"`
	Score int64 `json:"score"`
}

// back side dummy data 
var albums = []album {
	{Name:"A", Ranking:1, Target:360, Institution:"NYCU", Score:340}, 
	{Name:"B", Ranking:2, Target:260, Institution:"NTHU", Score:240}, 
	{Name:"C", Ranking:3, Target:160, Institution:"NUU?", Score:140}, 

}

// response dummy data in JSON
func getAlbums (context *gin.Context) {
	context.IndentedJSON(http.StatusOK, albums)
	// the output 20 indicates OK in net/http package.
	// "constent.IdentedJSON is more easier to debug and size is smaller than content.JSON"
}

func main() {
	router := gin.Default() // initialize a Gin router
	router.GET("/albums", getAlbums) // "pass data" action through api(link)

	router.Run("localhost:8080") // attach the router to an http.Server and start the server
}
