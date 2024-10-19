package routers

import (
	database "backend/internal/database"
	endpoint "backend/internal/endpoint"
	"backend/internal/pkg"

	"github.com/gin-gonic/gin"
)

func AddApiRouter(api *gin.RouterGroup) {
	api.GET("/albums", endpoint.GetAlbums)          // "pass data" action through api(link)
	api.GET("/txt/:dataName", endpoint.GetHTTPData) // response "name".txt data file with /translate/2JSON method
	testRelatedRouter(api.Group("test"))

	profileRouter(api)
	playerRouter(api)
	playerSetRouter(api)

	competitionRouter(api)
	groupInfoRouter(api)
	qualificationRouter(api)
	laneRouter(api)

	eliminationRouter(api)
	matchResultRouter(api)
	medalRouter(api)
}

func playerRouter(api *gin.RouterGroup) {
	playerssr := api.Group("/player")
	{
		playerssr.GET("/:id", endpoint.GetOnlyPlayerByID)
		playerssr.GET("/scores/:id", endpoint.GetPlayerWScoresByID)
		playerssr.GET("/playersets/:id/:eliminationid", endpoint.GetPlayerWPlayerSetsByIDEliminationID)

		playerssr.POST("/:participantid", endpoint.PostPlayer)
		playerssr.POST("/roundend", endpoint.PostRoundEnd)
		playerssr.POST("/roundscore", endpoint.PostRoundScore)
		playerssr.PATCH("/group/:id", endpoint.PutPlayerGroupId)
		playerssr.PATCH("/lane/:id", endpoint.PutPlayerLaneId)
		playerssr.PATCH("/order/:id", endpoint.PutPlayerOrder)
		playerssr.PATCH("/lane-order/:id", endpoint.PatchPlayerLaneOrder)
		playerssr.PATCH("/isconfirmed/:roundendid", endpoint.PutPlayerIsConfirmed)
		playerssr.PATCH("/totalscore/:id", endpoint.PutPlayerTotalScoreByplayerId)
		playerssr.PATCH("/roundscore/:roundscoreid", endpoint.PutPlayerScore)
		playerssr.PATCH("/shootoffscore/:id", endpoint.PutPlayerShootoffScore)
		playerssr.PATCH("/all-endscores/:endid", endpoint.PutPlayerAllEndScoresByEndId)

		playerssr.PATCH("/refresh/totalscores/:competitionid", endpoint.RefreshPlayerTotalScoresByCompetitionId)
		playerssr.DELETE("/:id", endpoint.DeletePlayer)

		playerssr.GET("/dummy/:participantid", endpoint.GetDummyPlayerByParticipantId)
		playerssr.POST("/dummy/:playerid", endpoint.PostDummyPlayerByPlayerId)
	}
}

func playerSetRouter(api *gin.RouterGroup) {
	playersetssr := api.Group("/playerset")
	{
		playersetssr.GET("/:id", endpoint.GetPlayerSetWPlayerById)
		playersetssr.GET("/elimination/:eliminationid", endpoint.GetAllPlayerSetsByEliminationId)
		playersetssr.GET("/elimination/medal/:eliminationid", endpoint.GetPlayerSetsByMedalByEliminationId)
		playersetssr.POST("/", endpoint.PostPlayerSet)
		playersetssr.PATCH("/name/:id", endpoint.PutPlayerSetName)
		playersetssr.PATCH("/preranking/:eliminationid", endpoint.PutPlayerSetPreRankingByEliminationId)
		playersetssr.DELETE("/:id", endpoint.DeletePlayerSet)
	}
}

func competitionRouter(api *gin.RouterGroup) {
	competitionssr := api.Group("/competition")
	{
		competitionssr.GET("/", endpoint.GetAllCompetition)
		competitionssr.GET("/:id", endpoint.GetOnlyCompetitionByID)
		competitionssr.GET("/participants/:id", endpoint.GetCompetitionWParticipantsByID)
		competitionssr.GET("/groups/:id", endpoint.GetCompetitionWGroupsByID)
		competitionssr.GET("/groups/players/:id", endpoint.GetCompetitionWGroupsPlayersByID)
		competitionssr.GET("/groups/eliminations/:id", endpoint.GetCompetitionWGroupsElimintaionsByID)
		competitionssr.GET("/current/:head/:tail", endpoint.GetCurrentCompetitions)
		competitionssr.GET("/user/:userid/:head/:tail", endpoint.GetCompetitionsOfUser)
		competitionssr.POST("/", endpoint.PostCompetition)
		competitionssr.PATCH("/refresh/groups/players/rank/:id", endpoint.RefreshCompetitionRank)
		competitionssr.PUT("/:id", endpoint.PutCompetition)
		competitionssr.DELETE("/:id", endpoint.DeleteCompetition)
		competitionssr.PATCH("/current-phase/plus/:id", endpoint.PutCompetitionCurrentPhasePlus)
		competitionssr.PATCH("/current-phase/minus/:id", endpoint.PutCompetitionCurrentPhaseMinus)
		competitionssr.PATCH("/qualification-current-end/plus/:id", endpoint.PutCompetitionQualificationCurrentEndPlus)
		competitionssr.PATCH("/qualification-current-end/minus/:id", endpoint.PutCompetitionQualificationCurrentEndMinus)
		competitionssr.PATCH("/qualification-isactive/:id", endpoint.PutCompetitionQualificationActive)
		competitionssr.PATCH("/elimination-isactive/:id", endpoint.PutCompetitionEliminationActive)
		competitionssr.PATCH("/team-elimination-isactive/:id", endpoint.PutCompetitionTeamEliminationActive)
		competitionssr.PATCH("/mixed-elimination-isactive/:id", endpoint.PutCompetitionMixedEliminationActive)
	}
}

func groupInfoRouter(api *gin.RouterGroup) {
	groupinfossr := api.Group("/groupinfo")
	{
		groupinfossr.GET("/:id", endpoint.GetGroupInfoByID)
		groupinfossr.GET("/players/:id", endpoint.GetGroupInfoWPlayersByID)
		groupinfossr.POST("/", endpoint.PostGroupInfo)
		groupinfossr.PUT("/:id", endpoint.PutGroupInfo)
		groupinfossr.PATCH("/ordering", endpoint.PutGroupInfoOrdering)
		groupinfossr.DELETE("/:id", endpoint.DeleteGroupInfo)
	}
}

func qualificationRouter(api *gin.RouterGroup) {
	qualificationssr := api.Group("/qualification")
	{
		qualificationssr.GET("/:id", endpoint.GetOnlyQualificationByID)
		qualificationssr.GET("/lanes/:id", endpoint.GetQualificationWLanesByID)
		qualificationssr.GET("/lanes/players/:id", endpoint.GetQualificationWLanesPlayersByID)
		qualificationssr.GET("/lanes/unassigned/:id", endpoint.GetQualificationWUnassignedLanesByID)
		qualificationssr.PUT("/:id", endpoint.PutQualificationByID)
	}
}

func laneRouter(api *gin.RouterGroup) {
	lanessr := api.Group("/lane")
	{
		lanessr.GET("/:id", endpoint.GetLaneByID)
		lanessr.GET("/all/:competitionid", endpoint.GetAllLaneByCompetitionId)
		lanessr.GET("/scores/:id", endpoint.GetLaneWScoresByID)
	}
}

func eliminationRouter(api *gin.RouterGroup) {
	eliminationssr := api.Group("/elimination")
	{
		eliminationssr.GET("/:id", endpoint.GetOnlyEliminationById)
		eliminationssr.GET("/stages/scores/medals/:id", endpoint.GetEliminationById)
		eliminationssr.GET("/playersets/:id", endpoint.GetEliminationWPlayerSetsById)
		eliminationssr.GET("/stages/matches/:id", endpoint.GetEliminationWStagesMatchesById)
		eliminationssr.GET("/scores/:id", endpoint.GetEliminationWScoresById)
		eliminationssr.GET("/match/scores/:matchid", endpoint.GetMatchWScoresById)

		eliminationssr.POST("/", endpoint.PostElimination)
		eliminationssr.POST("/stage", endpoint.PostStage)
		eliminationssr.POST("/match", endpoint.PostMatch)

		eliminationssr.PATCH("/currentstage/plus/:id", endpoint.PutEliminationCurrentStagePlusById)
		eliminationssr.PATCH("/currentstage/minus/:id", endpoint.PutEliminationCurrentStageMinusById)
		eliminationssr.PATCH("/currentend/plus/:id", endpoint.PutEliminationCurrentEndPlusById)
		eliminationssr.PATCH("/currentend/minus/:id", endpoint.PutEliminationCurrentEndMinusById)
		eliminationssr.DELETE("/:id", endpoint.DeleteElimination)
	}
}

func matchResultRouter(api *gin.RouterGroup) {
	matchresultssr := api.Group("/matchresult")
	{
		matchresultssr.GET("/:id", endpoint.GetMatchResultById)
		matchresultssr.GET("/scores/:id", endpoint.GetMatchResultWScoresById)
		matchresultssr.POST("/matchend", endpoint.PostMatchEnd)
		matchresultssr.PATCH("/totalpoints/:id", endpoint.PutMatchResultTotalPointsById)
		matchresultssr.PATCH("/shootoffscore/:id", endpoint.PutMatchResultShootOffScoreById)
		matchresultssr.PATCH("/iswinner/:id", endpoint.PutMatchResultIsWinnerById)
		matchresultssr.PATCH("/lanenumber/:id", endpoint.PutMatchResultLaneNumberById)
		matchresultssr.PATCH("/matchend/totalscore/:id", endpoint.PutMatchEndsTotalScoresById)
		matchresultssr.PATCH("/matchend/isconfirmed/:id", endpoint.PutMatchEndsIsConfirmedById)
		matchresultssr.PATCH("/matchend/scores/:id", endpoint.PutMatchEndsScoresById)

		matchresultssr.PATCH("/matchscore/score/:id", endpoint.PutMatchScoreScoreById)
		matchresultssr.DELETE("/:id", endpoint.DeleteMatchResultById)
	}
}

func medalRouter(api *gin.RouterGroup) {
	medalssr := api.Group("/medal")
	{
		medalssr.GET("/:id", endpoint.GetMedalById)
		medalssr.GET("/elimination/:eliminationid", endpoint.GetMedalInfoByEliminationId)
		medalssr.PATCH("/playersetid/:id", endpoint.PutMedalPlayerSetIdById)
	}
}

func profileRouter(api *gin.RouterGroup) {
	userssr := api.Group("/user")
	{
		userssr.POST("/", endpoint.Register)
		userssr.PUT("/:id", pkg.AuthSessionMiddleware(), endpoint.ModifyInfo)
		userssr.PATCH("/password/:id", pkg.AuthSessionMiddleware(), endpoint.ModifyPassword)
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
		parssr.GET("/:id", endpoint.GetParticipantById)
		parssr.GET("/user/:userid", endpoint.GetParticipantByUserId)
		parssr.GET("/competition/:competitionid", endpoint.GetParticipantByCompetitionId)
		parssr.GET("/competition/user/:competitionid/:userid", endpoint.GetParticipantByCompetitionIdUserId)
		parssr.PUT("/:id", endpoint.PutParticipant)
		parssr.DELETE("/:id", endpoint.DeleteParticipantById)

	}

	insr := api.Group("/institution")
	{
		insr.POST("/", endpoint.CreateInstitution)
		insr.GET("/:id", endpoint.InstitutionInfo)
		insr.GET("/", endpoint.AllInstitutionInfo)
		insr.DELETE("/:id", endpoint.DeleteInstitution)
	}
}

func testRelatedRouter(api *gin.RouterGroup) {
	api.PUT("/restore", func(c *gin.Context) {
		database.TestDBRestore()
		c.JSON(200, gin.H{"message": "Dummy database is restored"})
	})
}
