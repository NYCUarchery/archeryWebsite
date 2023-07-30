package routers

import (
	"web_server_gin/translate"

	"github.com/gin-gonic/gin"
)

func AddViewsRouter (r *gin.RouterGroup) {
	data := r.Group("/views")
	data.GET("/home", translate.GetHTML)
	
}