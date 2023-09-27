package routers

import (
	"fmt"
	_ "web_server_gin/docs"

	"github.com/gin-gonic/gin"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
)

func SwagSetUp(router *gin.Engine, ip string, port string) {
	url := ginSwagger.URL(fmt.Sprintf("http://%s:%s/swagger/doc.json", ip, port))
	router.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler, url))
}
