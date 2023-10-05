package main

import (
	"backend/internal/router"
	_ "backend/docs"
)

// @title           Archery backend API
// @version         1.0
// @description     A gin server

// @contact.name   NYCU archery
// @contact.url    https://github.com/NYCUarchery
// @contact.email  ???

// @license.name  Apache 2.0
// @license.url   http://www.apache.org/licenses/LICENSE-2.0.html

// @host      localhost:8080
// @BasePath  /api/
func main() {

	router := router.RouterSetup()
	
	router.Run("0.0.0.0:8080")
}
