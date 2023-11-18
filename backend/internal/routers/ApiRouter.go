package routers

import (
	endpoint "backend/internal/endpoint"
	"backend/internal/pkg"

	"github.com/gin-gonic/gin"
)

func AddApiRouter(api *gin.RouterGroup) {
	api.GET("/albums", endpoint.GetAlbums)          // "pass data" action through api(link)
	api.GET("/txt/:dataName", endpoint.GetHTTPData) // response "name".txt data file with /translate/2JSON method

	competition := api.Group("competition")
	competitionRouter(competition)

	groupinfo := api.Group("groupinfo")
	groupInfoRouter(groupinfo)

	qualification := api.Group("qualification")
	qualificationRouter(qualification)

	lane := api.Group("lane")
	laneRouter(lane)

	elimination := api.Group("elimination")
	eliminationRouter(elimination)

	matchResult := api.Group("matchresult")
	matchResultRouter(matchResult)

	medal := api.Group("medal")
	medalRouter(medal)

	oldlaneinfo := api.Group("oldlaneinfo")
	oldLaneInfoRouter(oldlaneinfo)

	profileRouter(api)
}

func competitionRouter(api *gin.RouterGroup) {
	api.GET("/", endpoint.GetAllCompetition)
	api.GET("/:id", endpoint.GetOnlyCompetitionByID)
	api.GET("/groups/:id", endpoint.GetCompetitionWGroupsByID)
	api.POST("/", endpoint.PostCompetition)
	api.PUT("/whole/:id", endpoint.UpdateCompetition)
	api.DELETE("/:id", endpoint.DeleteCompetition)
}

func groupInfoRouter(api *gin.RouterGroup) {
	api.GET("/:id", endpoint.GetGroupInfoByID)
	api.POST("/", endpoint.PostGroupInfo)
	api.PUT("/whole/:id", endpoint.UpdateGroupInfo)
	api.PUT("/reorder", endpoint.ReorderGroupInfo)
	api.DELETE("/:id", endpoint.DeleteGroupInfo)
}

func qualificationRouter(api *gin.RouterGroup) {
	api.GET("/:id", endpoint.GetOnlyQualificationByID)
	api.GET("/lanes/:id", endpoint.GetQualificationWLanesByID)
	api.PUT("/whole/:id", endpoint.UpdateQualificationByID)

}

func laneRouter(api *gin.RouterGroup) {
	api.GET("/:id", endpoint.GetLaneByID)
	api.GET("/all/:id", endpoint.GetAllLaneByCompetitionId)
	// api.GET("/players/:id", translate.GetLaneWPlayers)
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
		parssr.POST("/", pkg.AuthSessionMiddleware(), endpoint.JoinInCompetition)
	}

	insr := api.Group("/institution")
	{
		insr.POST("/", endpoint.CreateInstitution)
		insr.GET("/:id", endpoint.InstitutionInfo)
		insr.GET("/", endpoint.AllInstitutionInfo)
	}
}
