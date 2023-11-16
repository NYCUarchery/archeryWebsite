package routers

import (
	"backend/internal/endpoint"
	"backend/internal/pkg"

	"github.com/gin-gonic/gin"
)

func AddApiRouter(api *gin.RouterGroup) {
	api.GET("/albums", endpoint.GetAlbums)          // "pass data" action through api(link)
	api.GET("/txt/:dataName", endpoint.GetHTTPData) // response "name".txt data file with /translate/2JSON method

	player := api.Group("player")
	playerRouter(player)

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

func playerRouter(data *gin.RouterGroup) {
	data.GET("/:id", endpoint.GetOnlyPlayerByID)
	data.GET("/scores/:id", endpoint.GetPlayerWScoresByID)
	data.POST("/:participantid", endpoint.PostPlayer)
	data.POST("/roundend", endpoint.PostRoundEnd)
	data.POST("/roundscore", endpoint.PostRoundScore)
	data.PUT("/lane/:id", endpoint.UpdatePlayerLaneId)
	data.PUT("/group/:id", endpoint.UpdataPlayerGroupId)
	data.PUT("/order/:id", endpoint.UpdatePlayerOrder)
	data.PUT("/isconfirmed/:id", endpoint.UpdatePlayerIsConfirmed)
	data.PUT("/roundscore/:id", endpoint.UpdatePlayerScore)
	data.PUT("/shootoffscore/:id", endpoint.UpdatePlayerShootoffScore)
	data.DELETE("/:id", endpoint.DeletePlayer)
}

func competitionRouter(data *gin.RouterGroup) {
	data.GET("/:id", endpoint.GetOnlyCompetitionByID)
	data.GET("/participants/:id", endpoint.GetCompetitionWParticipantsByID)
	data.GET("/groups/:id", endpoint.GetCompetitionWGroupsByID)
	data.GET("/groups/players/:id", endpoint.GetCompetitionWGroupsPlayersByID)
	data.POST("/", endpoint.PostCompetition)
	data.PUT("/groups/players/rank/:id", endpoint.UpdateCompetitionRank)
	data.PUT("/whole/:id", endpoint.UpdateCompetition)
	data.DELETE("/:id", endpoint.DeleteCompetition)
}

func groupInfoRouter(data *gin.RouterGroup) {
	data.GET("/:id", endpoint.GetGroupInfoByID)
	data.GET("/players/:id", endpoint.GetGroupInfoWPlayersByID)
	data.POST("/", endpoint.PostGroupInfo)
	data.PUT("/whole/:id", endpoint.UpdateGroupInfo)
	data.PUT("/reorder", endpoint.ReorderGroupInfo)
	data.DELETE("/:id", endpoint.DeleteGroupInfo)
}

func qualificationRouter(data *gin.RouterGroup) {
	data.GET("/:id", endpoint.GetOnlyQualificationByID)
	data.GET("/lanes/:id", endpoint.GetQualificationWLanesByID)
	data.GET("/lanes/players/:id", endpoint.GetQualificationWLanesPlayersByID)
	data.GET("/lanes/unassigned/:id", endpoint.GetQualificationWUnassignedLanesByID)
	data.PUT("/whole/:id", endpoint.UpdateQualificationByID)

}

func laneRouter(data *gin.RouterGroup) {
	data.GET("/:id", endpoint.GetLaneByID)
	data.GET("/all/:id", endpoint.GetAllLaneByCompetitionId)
	data.GET("/scores/:id", endpoint.GetLaneWScoresByID)
}

func oldLaneInfoRouter(data *gin.RouterGroup) {
	data.GET("/:id", endpoint.GetOldLaneInfoByID)
	data.POST("/", endpoint.PostOldLaneInfo)
	data.PUT("/whole/:id", endpoint.UpdateOldLaneInfo)
	data.PUT("/score/:id/:stageindex/:userindex/:arrowindex/:score", endpoint.UpdataOldLaneScore)
	data.PUT("/confirm/:id/:stageindex/:userindex/:confirm", endpoint.UpdataOldLaneConfirm)
	data.DELETE("/:id", endpoint.DeleteOldLaneInfoByID)
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
		// hope be edited by JSON
		//
		parssr.GET("/:id", endpoint.GetParticipantById)
		parssr.GET("/user", endpoint.GetParticipantByUserId)
		parssr.GET("/competition", endpoint.GetParticipantByCompetitionId)
		parssr.GET("/competition/user", endpoint.GetParticipantByCompetitionIdUserId)
		parssr.PUT("/:id", endpoint.UpdateParticipant)
		parssr.DELETE("/:id", endpoint.DeleteParticipantById)

	}

	insr := api.Group("/institution")
	{
		insr.POST("/", endpoint.CreateInstitution)
		insr.GET("/:id", endpoint.InstitutionInfo)
		insr.GET("/", endpoint.AllInstitutionInfo)
	}
}
