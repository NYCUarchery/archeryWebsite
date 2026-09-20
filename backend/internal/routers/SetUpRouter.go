package routers

import (
	"github.com/gin-gonic/gin"

	"backend/internal/pkg"
)

func SetUpRouter(router *gin.Engine, ip string, port string, sessionKey string, secure bool) {
	router.Use(pkg.EnableCookieSessionMiddleware(pkg.SessionConfig{Key: sessionKey, Secure: secure}))

	api := router.Group("/api")
	AddApiRouter(api)
	SwagSetUp(router, ip, port)
}
