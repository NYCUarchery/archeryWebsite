package routers

import (
	"web_server_gin/translate"

	"github.com/gin-gonic/gin"
)

func AddDataRouter(data *gin.RouterGroup) {
	data.GET("/albums", translate.GetAlbums)          // "pass data" action through api(link)
	data.GET("/txt/:dataName", translate.GetHTTPData) // response "name".txt data file with /translate/2JSON method

	data.GET("/eliminationInfo/:gameName", translate.GetEliminationInfo)
	data.GET("/gameInfo/:gameName", translate.GetGameInfo)
	data.GET("/groupInfo/:gameName", translate.GetGroupInfo)
	data.GET("/phaseInfo/:gameName", translate.GetPhaseInfo)
	data.GET("/qualificationInfo/:gameName", translate.GetQualificationInfo)
	data.GET("/teamEliminationInfo/:gameName", translate.GetTeamEliminationInfo)
	data.GET("/userInfo/:userName", translate.GetUserInfo)

	data.GET("/laneinfo/:id", translate.GetLaneInfoByID)
	data.POST("/laneinfo/", translate.PostLaneInfo)
	data.PUT("/laneinfo/whole/:id", translate.UpdateLaneInfo)
	/*
		data.PUT("/l aneinfo/score/:id/:who/:index/:score", translate.UpdataLaneScore)
		data.PUT("/laneinfo/confirm/:id/:who/:confirm", translate.UpdataLaneConfirm)
		data.DELETE("/laneinfo/:id", translate.DeleteLaneInfoByID)
	*/
	data.GET("/", translate.FindAllUsers)
	data.GET("/:id", translate.FindByUserID)
	data.POST("/", translate.PostUser)
	data.DELETE("/:id", translate.DeleteUser)
	data.PUT("/:id", translate.UpdataUser)
}
