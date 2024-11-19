package routers

import (
	"github.com/gin-gonic/gin"

	"backend/internal/pkg"
)

func SetUpRouter(router *gin.Engine, ip string, port string) {
	session_file := "config/session.yaml"
	router.Use(pkg.EnableCookieSessionMiddleware(session_file))

	api := router.Group("/api")
	AddApiRouter(api)
	SwagSetUp(router, ip, port)
}
