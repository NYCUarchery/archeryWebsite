package routers

import (
	"backend/internal/endpoint"
	"backend/internal/pkg"
	"backend/internal/translate"

	"github.com/gin-gonic/gin"
)

func AddApiRouter(api *gin.RouterGroup) {
	api.GET("/albums", translate.GetAlbums)          // "pass data" action through api(link)
	api.GET("/txt/:dataName", translate.GetHTTPData) // response "name".txt data file with /translate/2JSON method

	// user := api.Group("user")
	// userRouter(user)

	// participant := api.Group("participant")
	// participantRouter(participant)

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

// func userRouter(data *gin.RouterGroup) {
// 	data.GET("/:id", translate.GetOnlyUserById)
// 	data.GET("/participants/:id", translate.GetUserWParticipantsById)
// 	data.POST("/", translate.PostUser)
// 	data.PUT("/whole/:id", translate.PutUser)
// 	data.DELETE("/:id", translate.DeleteUser)
// }

// func participantRouter(data *gin.RouterGroup) {
// 	data.GET("/:id", translate.GetParticipant)
// 	data.POST("/", translate.PostParticipant)
// 	data.PUT("/whole/:id", translate.UpdateParticipant)
// 	data.DELETE("/:id", translate.DeleteParticipantById)
// }

func playerRouter(data *gin.RouterGroup) {
	data.GET("/:id", translate.GetOnlyPlayerByID)
	data.GET("/scores/:id", translate.GetPlayerWScoresByID)
	data.POST("/:participantid", translate.PostPlayer)
	data.POST("/roundend", translate.PostRoundEnd)
	data.POST("/roundscore", translate.PostRoundScore)
	data.PUT("/lane/:id", translate.UpdatePlayerLaneId)
	data.PUT("/group/:id", translate.UpdataPlayerGroupId)
	data.PUT("/order/:id", translate.UpdatePlayerOrder)
	data.PUT("/isconfirmed/:id", translate.UpdatePlayerIsConfirmed)
	data.PUT("/roundscore/:id", translate.UpdatePlayerScore)
	data.PUT("/shootoffscore/:id", translate.UpdatePlayerShootoffScore)
	data.DELETE("/:id", translate.DeletePlayer)
}

func competitionRouter(data *gin.RouterGroup) {
	data.GET("/:id", translate.GetOnlyCompetitionByID)
	data.GET("/participants/:id", translate.GetCompetitionWParticipantsByID)
	data.GET("/groups/:id", translate.GetCompetitionWGroupsByID)
	data.GET("/groups/players/:id", translate.GetCompetitionWGroupsPlayersByID)
	data.POST("/", translate.PostCompetition)
	data.PUT("/groups/players/rank/:id", translate.UpdateCompetitionRank)
	data.PUT("/whole/:id", translate.UpdateCompetition)
	data.DELETE("/:id", translate.DeleteCompetition)
}

func groupInfoRouter(data *gin.RouterGroup) {
	data.GET("/:id", translate.GetGroupInfoByID)
	data.GET("/players/:id", translate.GetGroupInfoWPlayersByID)
	data.POST("/", translate.PostGroupInfo)
	data.PUT("/whole/:id", translate.UpdateGroupInfo)
	data.PUT("/reorder", translate.ReorderGroupInfo)
	data.DELETE("/:id", translate.DeleteGroupInfo)
}

func qualificationRouter(data *gin.RouterGroup) {
	data.GET("/:id", translate.GetOnlyQualificationByID)
	data.GET("/lanes/:id", translate.GetQualificationWLanesByID)
	data.GET("/lanes/players/:id", translate.GetQualificationWLanesPlayersByID)
	data.GET("/lanes/unassigned/:id", translate.GetQualificationWUnassignedLanesByID)
	data.PUT("/whole/:id", translate.UpdateQualificationByID)

}

func laneRouter(data *gin.RouterGroup) {
	data.GET("/:id", translate.GetLaneByID)
	data.GET("/all/:id", translate.GetAllLaneByCompetitionId)
	data.GET("/scores/:id", translate.GetLaneWScoresByID)
}

func oldLaneInfoRouter(data *gin.RouterGroup) {
	data.GET("/:id", translate.GetOldLaneInfoByID)
	data.POST("/", translate.PostOldLaneInfo)
	data.PUT("/whole/:id", translate.UpdateOldLaneInfo)
	data.PUT("/score/:id/:stageindex/:userindex/:arrowindex/:score", translate.UpdataOldLaneScore)
	data.PUT("/confirm/:id/:stageindex/:userindex/:confirm", translate.UpdataOldLaneConfirm)
	data.DELETE("/:id", translate.DeleteOldLaneInfoByID)
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
