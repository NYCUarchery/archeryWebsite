package routers

import (
	"web_server_gin/translate"

	"github.com/gin-gonic/gin"
)

func AddDataRouter(data *gin.RouterGroup) {
	data.GET("/albums", translate.GetAlbums)          // "pass data" action through api(link)
	data.GET("/txt/:dataName", translate.GetHTTPData) // response "name".txt data file with /translate/2JSON method

	data.GET("/eliminationInfo/:gameName", translate.GetEliminationInfo)
	data.GET("/phaseInfo/:gameName", translate.GetPhaseInfo)
	data.GET("/qualificationInfo/:gameName", translate.GetQualificationInfo)
	data.GET("/teamEliminationInfo/:gameName", translate.GetTeamEliminationInfo)
	data.GET("/userInfo/:userName", translate.GetUserInfo)

	gameinfo := data.Group("gameinfo")
	gameInfoRouter(gameinfo)

	groupinfo := data.Group("groupinfo")
	groupInfoRouter(groupinfo)

	laneinfo := data.Group("laneinfo")
	laneInfoRouter(laneinfo)

	data.GET("/", translate.FindAllUsers)
	data.GET("/:id", translate.FindByUserID)
	data.POST("/", translate.PostUser)
	data.DELETE("/:id", translate.DeleteUser)
	data.PUT("/:id", translate.UpdataUser)
}

func gameInfoRouter(data *gin.RouterGroup) {
	data.GET("/:id", translate.GetOnlyGameInfoByID)
	data.GET("/groups/:id", translate.GetGameInfoWGroupsByID)
	data.POST("/", translate.PostGameInfo)
	data.PUT("/whole/:id", translate.UpdateGameInfo)
	data.DELETE("/:id", translate.DeleteGameInfo)
}

func groupInfoRouter(data *gin.RouterGroup) {
	data.GET("/:id", translate.GetGroupInfoByID)
	data.POST("/", translate.PostGroupInfo)
	data.PUT("/whole/:id", translate.UpdateGroupInfo)
	data.PUT("/reorder", translate.ReorderGroupInfo)
	data.DELETE("/:id", translate.DeleteGroupInfo)
}

func laneInfoRouter(data *gin.RouterGroup) {
	data.GET("/:id", translate.GetLaneInfoByID)
	data.POST("/", translate.PostLaneInfo)
	data.PUT("/whole/:id", translate.UpdateLaneInfo)
	data.PUT("/score/:id/:stageindex/:userindex/:arrowindex/:score", translate.UpdataLaneScore)
	data.PUT("/confirm/:id/:stageindex/:userindex/:confirm", translate.UpdataLaneConfirm)
	data.DELETE("/:id", translate.DeleteLaneInfoByID)
}
