package routers

import (
	"github.com/gin-gonic/gin"

	"backend/internal/pkg"
)

func SetUpRouter(router *gin.Engine, ip string, port string) {
	router.Use(pkg.EnableCookieSessionMiddleware())

	api := router.Group("/api")
	AddApiRouter(api)
	SwagSetUp(router, ip, port)
}
