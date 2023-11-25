package routers

import (
	endpoint "backend/internal/endpoint"
	"backend/internal/pkg"

	"github.com/gin-gonic/gin"
)

func AddApiRouter(api *gin.RouterGroup) {
	api.GET("/albums", endpoint.GetAlbums)          // "pass data" action through api(link)
	api.GET("/txt/:dataName", endpoint.GetHTTPData) // response "name".txt data file with /translate/2JSON method

	profileRouter(api)
	playerRouter(api.Group("player"))

	competitionRouter(api.Group("competition"))
	groupInfoRouter(api.Group("groupinfo"))
	qualificationRouter(api.Group("qualification"))
	laneRouter(api.Group("lane"))

	eliminationRouter(api.Group("elimination"))
	matchResultRouter(api.Group("matchresult"))
	medalRouter(api.Group("medal"))

	oldLaneInfoRouter(api.Group("oldlaneinfo"))
}

func playerRouter(api *gin.RouterGroup) {
	api.GET("/:id", endpoint.GetOnlyPlayerByID)
	api.GET("/scores/:id", endpoint.GetPlayerWScoresByID)
	api.POST("/:participantid", endpoint.PostPlayer)
	api.POST("/roundend", endpoint.PostRoundEnd)
	api.POST("/roundscore", endpoint.PostRoundScore)
	api.PUT("/lane/:id", endpoint.UpdatePlayerLaneId)
	api.PUT("/group/:id", endpoint.UpdataPlayerGroupId)
	api.PUT("/order/:id", endpoint.UpdatePlayerOrder)
	api.PUT("/isconfirmed/:id", endpoint.UpdatePlayerIsConfirmed)
	api.PUT("/roundscore/:id", endpoint.UpdatePlayerScore)
	api.PUT("/shootoffscore/:id", endpoint.UpdatePlayerShootoffScore)
	api.DELETE("/:id", endpoint.DeletePlayer)
}

func competitionRouter(api *gin.RouterGroup) {
	api.GET("/:id", endpoint.GetOnlyCompetitionByID)
	api.GET("/participants/:id", endpoint.GetCompetitionWParticipantsByID)
	api.GET("/groups/:id", endpoint.GetCompetitionWGroupsByID)
	api.GET("/groups/players/:id", endpoint.GetCompetitionWGroupsPlayersByID)
	api.GET("groups/quaeli/:id", endpoint.GetCompetitionWGroupsQuaEliByID)

	api.POST("/", endpoint.PostCompetition)
	api.PUT("/groups/players/rank/:id", endpoint.UpdateCompetitionRank)
	api.PUT("/whole/:id", endpoint.UpdateCompetition)
	api.DELETE("/:id", endpoint.DeleteCompetition)

	api.PUT("/currentphaseplus/:id", endpoint.PutCompetitionCurrentPhasePlus)
	api.PUT("/currentphaseminus/:id", endpoint.PutCompetitionCurrentPhaseMinus)
	api.PUT("/qualificationcurrentend/plus/:id", endpoint.PutCompetitionQualificationCurrentEndPlus)
	api.PUT("/qualificationcurrentend/minus/:id", endpoint.PutCompetitionQualificationCurrentEndMinus)

	api.PUT("/qualificationisactive/:id", endpoint.PutCompetitionQualificationActive)
	api.PUT("/eliminationisactive/:id", endpoint.PutCompetitionEliminationActive)
	api.PUT("/teameliminationisactive/:id", endpoint.PutCompetitionTeamEliminationActive)
	api.PUT("/mixedeliminationisactive/:id", endpoint.PutCompetitionMixedEliminationActive)
}

func groupInfoRouter(api *gin.RouterGroup) {
	api.GET("/:id", endpoint.GetGroupInfoByID)
	api.GET("/players/:id", endpoint.GetGroupInfoWPlayersByID)
	api.POST("/", endpoint.PostGroupInfo)
	api.PUT("/whole/:id", endpoint.UpdateGroupInfo)
	api.PUT("/reorder", endpoint.ReorderGroupInfo)
	api.DELETE("/:id", endpoint.DeleteGroupInfo)
}

func qualificationRouter(api *gin.RouterGroup) {
	api.GET("/:id", endpoint.GetOnlyQualificationByID)
	api.GET("/lanes/:id", endpoint.GetQualificationWLanesByID)
	api.GET("/lanes/players/:id", endpoint.GetQualificationWLanesPlayersByID)
	api.GET("/lanes/unassigned/:id", endpoint.GetQualificationWUnassignedLanesByID)
	api.PUT("/whole/:id", endpoint.UpdateQualificationByID)

}

func laneRouter(api *gin.RouterGroup) {
	api.GET("/:id", endpoint.GetLaneByID)
	api.GET("/all/:id", endpoint.GetAllLaneByCompetitionId)
	api.GET("/scores/:id", endpoint.GetLaneWScoresByID)
}

func eliminationRouter(api *gin.RouterGroup) {
	api.GET("/:id", endpoint.GetOnlyEliminationById)
	api.GET("/stages/:id", endpoint.GetEliminationWStagesById)
	api.GET("/scores/:id", endpoint.GetEliminationWScoresById)

	api.POST("/", endpoint.PostElimination)
	api.POST("/stage", endpoint.PostStage)
	api.POST("/match", endpoint.PostMatch)

	api.PUT("/currentstage/plus/:id", endpoint.PutEliminationCurrentStagePlusById)
	api.PUT("/currentstage/minus/:id", endpoint.PutEliminationCurrentStageMinusById)
	api.PUT("/currentend/plus/:id", endpoint.PutEliminationCurrentEndPlusById)
	api.PUT("/currentend/minus/:id", endpoint.PutEliminationCurrentEndMinusById)
	api.DELETE("/:id", endpoint.DeleteElimination)
}

func matchResultRouter(api *gin.RouterGroup) {
	api.GET("/:id", endpoint.GetMatchResultById)
	api.GET("/scores/:id", endpoint.GetMatchResultWScoresById)
	api.POST("/", endpoint.PostMatchResult)
	api.POST("/matchend/", endpoint.PostMatchEnd)

	api.PUT("/totalpoints/:id", endpoint.PutMatchResultTotalPointsById)
	api.PUT("/shootoffscore/:id", endpoint.PutMatchResultShootOffScoreById)
	api.PUT("/iswinner/:id", endpoint.PutMatchResultIsWinnerById)
	api.PUT("lanenumber/:id", endpoint.PutMatchResultLaneNumberById)

	api.PUT("/matchend/totalscore/:id", endpoint.PutMatchEndsTotalScoresById)
	api.PUT("/matchend/isconfirmed/:id", endpoint.PutMatchEndsIsConfirmedById)
	api.PUT("/matchend/scores/:id", endpoint.PutMatchEndsScoresById)

	api.PUT("/matchscore/score/:id", endpoint.PutMatchScoreScoreById)
	api.DELETE("/:id", endpoint.DeleteMatchResultById)
}

func medalRouter(api *gin.RouterGroup) {
	api.GET("/:id", endpoint.GetMedalById)
	api.GET("/elimination/:id", endpoint.GetMedalInfoByEliminationId)
	// api.PUT("/playersetid/:id", translate.PutMedalPlayerSetIdById)
}

func oldLaneInfoRouter(api *gin.RouterGroup) {
	api.GET("/:id", endpoint.GetOldLaneInfoByID)
	api.POST("/", endpoint.PostOldLaneInfo)
	api.PUT("/whole/:id", endpoint.UpdateOldLaneInfo)
	api.PUT("/score/:id/:stageindex/:userindex/:arrowindex/:score", endpoint.UpdataOldLaneScore)
	api.PUT("/confirm/:id/:stageindex/:userindex/:confirm", endpoint.UpdataOldLaneConfirm)
	api.DELETE("/:id", endpoint.DeleteOldLaneInfoByID)
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
		parssr.POST("/", pkg.AuthSessionMiddleware(), endpoint.PostParticipant)
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
