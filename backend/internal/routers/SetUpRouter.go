package routers

import (
	"github.com/gin-gonic/gin"

	"web_server_gin/internal/pkg"
)

func SetUpRouter(router *gin.Engine, ip string, port string) {
	router.Use(pkg.EnableCookieSessionMiddleware())

	api := router.Group("/api")
	AddApiRouter(api)
	SwagSetUp(router, ip, port)
}
