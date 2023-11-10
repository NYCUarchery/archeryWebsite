package routers

import (
	"web_server_gin/internal/translate"
	"web_server_gin/internal/endpoint"
	"web_server_gin/internal/pkg"

	"github.com/gin-gonic/gin"
)

func AddApiRouter(api *gin.RouterGroup) {
	api.GET("/albums", translate.GetAlbums)          // "pass data" action through api(link)
	api.GET("/txt/:dataName", translate.GetHTTPData) // response "name".txt data file with /translate/2JSON method

	api.GET("/eliminationInfo/:gameName", translate.GetEliminationInfo)
	api.GET("/phaseInfo/:gameName", translate.GetPhaseInfo)
	api.GET("/teamEliminationInfo/:gameName", translate.GetTeamEliminationInfo)

	competition := api.Group("competition")
	competitionRouter(competition)

	groupinfo := api.Group("groupinfo")
	groupInfoRouter(groupinfo)

	qualification := api.Group("qualification")
	qualificationRouter(qualification)

	lane := api.Group("lane")
	laneRouter(lane)

	oldlaneinfo := api.Group("oldlaneinfo")
	oldLaneInfoRouter(oldlaneinfo)

	profileRouter(api)
}

func competitionRouter(api *gin.RouterGroup) {
	api.GET("/", translate.GetAllCompetition)
	api.GET("/:id", translate.GetOnlyCompetitionByID)
	api.GET("/groups/:id", translate.GetCompetitionWGroupsByID)
	api.POST("/", translate.PostCompetition)
	api.PUT("/whole/:id", translate.UpdateCompetition)
	api.DELETE("/:id", translate.DeleteCompetition)
}

func groupInfoRouter(api *gin.RouterGroup) {
	api.GET("/:id", translate.GetGroupInfoByID)
	api.POST("/", translate.PostGroupInfo)
	api.PUT("/whole/:id", translate.UpdateGroupInfo)
	api.PUT("/reorder", translate.ReorderGroupInfo)
	api.DELETE("/:id", translate.DeleteGroupInfo)
}

func qualificationRouter(api *gin.RouterGroup) {
	api.GET("/:id", translate.GetOnlyQualificationByID)
	api.GET("/lanes/:id", translate.GetQualificationWLanesByID)
	api.PUT("/whole/:id", translate.UpdateQualificationByID)

}

func laneRouter(api *gin.RouterGroup) {
	api.GET("/:id", translate.GetLaneByID)
	api.GET("/all/:id", translate.GetAllLaneByCompetitionId)
	// api.GET("/players/:id", translate.GetLaneWPlayers)
}

func oldLaneInfoRouter(api *gin.RouterGroup) {
	api.GET("/:id", translate.GetOldLaneInfoByID)
	api.POST("/", translate.PostOldLaneInfo)
	api.PUT("/whole/:id", translate.UpdateOldLaneInfo)
	api.PUT("/score/:id/:stageindex/:userindex/:arrowindex/:score", translate.UpdataOldLaneScore)
	api.PUT("/confirm/:id/:stageindex/:userindex/:confirm", translate.UpdataOldLaneConfirm)
	api.DELETE("/:id", translate.DeleteOldLaneInfoByID)
}

func profileRouter(api *gin.RouterGroup) {
	userssr := api.Group("/user")
	{
		userssr.POST("/", endpoint.Register)
		userssr.PUT("/:id", pkg.AuthSessionMiddleware(), endpoint.ModifyInfo)
		userssr.GET("/me", pkg.AuthSessionMiddleware(), endpoint.GetUserID)
		userssr.GET("/:id", endpoint.UserInfo)
	}

	sessionssr := api.Group("/session")
	{
		sessionssr.POST("/", endpoint.Login)
		sessionssr.DELETE("/", endpoint.Logout)
	}

	parssr := api.Group("/participant")
	{
		parssr.POST("/", pkg.AuthSessionMiddleware(), endpoint.JoinInCompetition)
	}

	insr := api.Group("/institution")
	{
		insr.POST("/", endpoint.CreateInstitution)
		insr.GET("/:id", endpoint.InstitutionInfo)
		insr.GET("/", endpoint.AllInstitutionInfo)
	}
}