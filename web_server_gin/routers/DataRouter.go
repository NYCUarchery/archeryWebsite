package routers

import (
	"web_server_gin/translate"

	"github.com/gin-gonic/gin"
)

func AddDataRouter(r *gin.RouterGroup) {
	data := r.Group("/data")
	data.GET("/albums", translate.GetAlbums) // "pass data" action through api(link)
	data.GET("/:dataName", translate.GetHTTPData) // response "name".txt data file with /translate/2JSON method

	data.GET("/eliminationInfo/:gameName", translate.GetEliminationInfo)
	data.GET("/gameInfo/:gameName", translate.GetGameInfo) 
	data.GET("/groupInfo/:gameName", translate.GetGroupInfo) 
	data.GET("/phaseInfo/:gameName", translate.GetPhaseInfo) 
	data.GET("/qualificationInfo/:gameName", translate.GetQualificationInfo) 
	data.GET("/teamEliminationInfo/:gameName", translate.GetTeamEliminationInfo) 
	data.GET("/userInfo/:userName", translate.GetUserInfo) 
	//data.GET("/", translate.FindAllUsers)
	//data.GET("/:id", translate.FindByUserID)
}