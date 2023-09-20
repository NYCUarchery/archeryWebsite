package main

import (
	"backend/internal/router"
)

func main() {

	router := router.RouterSetup()
	
	router.Run("127.0.0.1:8080")
}
