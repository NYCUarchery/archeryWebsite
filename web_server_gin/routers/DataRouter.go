package routers

import (
	"web_server_gin/translate"

	"github.com/gin-gonic/gin"
)

func AddDataRouter(data *gin.RouterGroup) {
	data.GET("/albums", translate.GetAlbums) // "pass data" action through api(link)
	data.GET("/txt/:dataName", translate.GetHTTPData) // response "name".txt data file with /translate/2JSON method

	data.GET("/eliminationInfo/:gameName", translate.GetEliminationInfo)
	data.GET("/gameInfo/:gameName", translate.GetGameInfo) 
	data.GET("/groupInfo/:gameName", translate.GetGroupInfo) 
	data.GET("/phaseInfo/:gameName", translate.GetPhaseInfo) 
	data.GET("/qualificationInfo/:gameName", translate.GetQualificationInfo) 
	data.GET("/teamEliminationInfo/:gameName", translate.GetTeamEliminationInfo) 
	data.GET("/userInfo/:userName", translate.GetUserInfo) 

	data.GET("/LaneInfo/:id", translate.GetLaneInfoByID)
	data.POST("/LaneInfo/", translate.PostLaneInfo)
	//data.DELETE("/LaneInfo/:id", translate.DeleteLane)
	//data.PUT("/LaneInfo/:id", translate.UpdataLane)
	//data.PUT("/LaneInfo/:id/score/:position/:score", translate.UpdataLaneScore)
	//data.PUT("/LaneInfo/:id/confirm/:stage", translate.UpdataLaneConfirm)
	
	data.GET("/", translate.FindAllUsers)
	data.GET("/:id", translate.FindByUserID)
	data.POST("/", translate.PostUser)
	data.DELETE("/:id", translate.DeleteUser)
	data.PUT("/:id", translate.UpdataUser)
}