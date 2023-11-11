package routers

import (
	"fmt"
	_ "web_server_gin/docs"

	"github.com/gin-gonic/gin"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
)

// ShowApiDocs godoc
//	@Summary		Show Api Docs in json
//	@Description	get Api docs in json
//	@Tags			docs
//	@Produce		json
//	@Success		200	string	string
//	@Router			/swagger/doc.json [get]
func SwagSetUp(router *gin.Engine, ip string, port string) {
	url := ginSwagger.URL(fmt.Sprintf("http://%s:%s/swagger/doc.json", ip, port))
	router.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler, url))
}
