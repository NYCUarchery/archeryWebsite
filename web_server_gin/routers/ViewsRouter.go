package routers

import (
	"web_server_gin/translate"

	"github.com/gin-gonic/gin"
)

func loadThree(router *gin.Engine) {
	router.LoadHTMLGlob("../archery_game_scoring/dist/index.html")
	router.Static("/assets", "../archery_game_scoring/dist/assets") //設定靜態資源的讀取
}

func AddViewsRouter(views *gin.RouterGroup, r *gin.Engine) {
	views.GET("/home", translate.GetHTML)
	loadThree(r)
}
