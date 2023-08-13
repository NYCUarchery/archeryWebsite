package routers

import (
	"web_server_gin/translate"

	"github.com/gin-gonic/gin"
)

func LoadThree (router *gin.Engine) {
	router.LoadHTMLGlob("views/index.html")
    router.Static("/assets", "./views/assets") //設定靜態資源的讀取
}

func AddViewsRouter (views *gin.RouterGroup, r *gin.Engine) {
	views.GET("/home", translate.GetHTML)
	LoadThree (r)	
}