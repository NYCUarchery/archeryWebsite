package routers

import (
	"github.com/gin-gonic/gin"
)

func SetUpRouter(router *gin.Engine, ip string, port string) {
	data := router.Group("/data")
	views := router.Group("/views")

	AddViewsRouter(views, router)
	AddDataRouter(data)
	SwagSetUp(router, ip, port)
}
