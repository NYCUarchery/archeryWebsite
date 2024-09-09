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

	oldLaneInfoRouter(api)
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
		playerssr.PUT("/lane/:id", endpoint.PutPlayerLaneId)
		playerssr.PUT("/group/:id", endpoint.PutPlayerGroupId)
		playerssr.PUT("/order/:id", endpoint.PutPlayerOrder)
		playerssr.PUT("/isconfirmed/:roundendid", endpoint.PutPlayerIsConfirmed)
		playerssr.PUT("/totalscore/:id", endpoint.PutPlayerTotalScoreByplayerId)
		playerssr.PUT("/roundscore/:roundscoreid", endpoint.PutPlayerScore)
		playerssr.PUT("/shootoffscore/:id", endpoint.PutPlayerShootoffScore)
		playerssr.PUT("/all-endscores/:endid", endpoint.PutPlayerAllEndScoresByEndId)
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
		playersetssr.PUT("/name/:id", endpoint.PutPlayerSetName)
		playersetssr.PUT("/preranking/:eliminationid", endpoint.PutPlayerSetPreRankingByEliminationId)
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
		competitionssr.GET("/groups/quaeli/:id", endpoint.GetCompetitionWGroupsQuaEliByID)
		competitionssr.GET("/current/:head/:tail", endpoint.GetCurrentCompetitions)
		competitionssr.GET("/user/:userid/:head/:tail", endpoint.GetCompetitionsOfUser)
		competitionssr.POST("/", endpoint.PostCompetition)
		competitionssr.PUT("/groups/players/rank/:id", endpoint.PutCompetitionRank)
		competitionssr.PUT("/groups/players/playertotal/:id", endpoint.PutCompetitionRecountPlayerTotalScore) //
		competitionssr.PUT("/whole/:id", endpoint.PutCompetition)
		competitionssr.DELETE("/:id", endpoint.DeleteCompetition)
		competitionssr.PUT("/current-phase/plus/:id", endpoint.PutCompetitionCurrentPhasePlus)
		competitionssr.PUT("/current-phase/minus/:id", endpoint.PutCompetitionCurrentPhaseMinus)
		competitionssr.PUT("/qualification-current-end/plus/:id", endpoint.PutCompetitionQualificationCurrentEndPlus)
		competitionssr.PUT("/qualification-current-end/minus/:id", endpoint.PutCompetitionQualificationCurrentEndMinus)
		competitionssr.PUT("/qualification-isactive/:id", endpoint.PutCompetitionQualificationActive)
		competitionssr.PUT("/elimination-isactive/:id", endpoint.PutCompetitionEliminationActive)
		competitionssr.PUT("/team-elimination-isactive/:id", endpoint.PutCompetitionTeamEliminationActive)
		competitionssr.PUT("/mixed-elimination-isactive/:id", endpoint.PutCompetitionMixedEliminationActive)
	}
}

func groupInfoRouter(api *gin.RouterGroup) {
	groupinfossr := api.Group("/groupinfo")
	{
		groupinfossr.GET("/:id", endpoint.GetGroupInfoByID)
		groupinfossr.GET("/players/:id", endpoint.GetGroupInfoWPlayersByID)
		groupinfossr.POST("/", endpoint.PostGroupInfo)
		groupinfossr.PUT("/whole/:id", endpoint.PutGroupInfo)
		groupinfossr.PUT("/ordering", endpoint.PutGroupInfoOrdering)
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
		qualificationssr.PUT("/whole/:id", endpoint.PutQualificationByID)
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

		eliminationssr.PUT("/currentstage/plus/:id", endpoint.PutEliminationCurrentStagePlusById)
		eliminationssr.PUT("/currentstage/minus/:id", endpoint.PutEliminationCurrentStageMinusById)
		eliminationssr.PUT("/currentend/plus/:id", endpoint.PutEliminationCurrentEndPlusById)
		eliminationssr.PUT("/currentend/minus/:id", endpoint.PutEliminationCurrentEndMinusById)
		eliminationssr.DELETE("/:id", endpoint.DeleteElimination)
	}
}

func matchResultRouter(api *gin.RouterGroup) {
	matchresultssr := api.Group("/matchresult")
	{
		matchresultssr.GET("/:id", endpoint.GetMatchResultById)
		matchresultssr.GET("/scores/:id", endpoint.GetMatchResultWScoresById)
		matchresultssr.POST("/matchend", endpoint.PostMatchEnd)
		matchresultssr.PUT("/totalpoints/:id", endpoint.PutMatchResultTotalPointsById)
		matchresultssr.PUT("/shootoffscore/:id", endpoint.PutMatchResultShootOffScoreById)
		matchresultssr.PUT("/iswinner/:id", endpoint.PutMatchResultIsWinnerById)
		matchresultssr.PUT("/lanenumber/:id", endpoint.PutMatchResultLaneNumberById)
		matchresultssr.PUT("/matchend/totalscore/:id", endpoint.PutMatchEndsTotalScoresById)
		matchresultssr.PUT("/matchend/isconfirmed/:id", endpoint.PutMatchEndsIsConfirmedById)
		matchresultssr.PUT("/matchend/scores/:id", endpoint.PutMatchEndsScoresById)

		matchresultssr.PUT("/matchscore/score/:id", endpoint.PutMatchScoreScoreById)
		matchresultssr.DELETE("/:id", endpoint.DeleteMatchResultById)
	}
}

func medalRouter(api *gin.RouterGroup) {
	medalssr := api.Group("/medal")
	{
		medalssr.GET("/:id", endpoint.GetMedalById)
		medalssr.GET("/elimination/:eliminationid", endpoint.GetMedalInfoByEliminationId)
		medalssr.PUT("/playersetid/:id", endpoint.PutMedalPlayerSetIdById)
	}
}

func oldLaneInfoRouter(api *gin.RouterGroup) {
	oldlaneinfossr := api.Group("/oldlaneinfo")
	{
		oldlaneinfossr.GET("/:id", endpoint.GetOldLaneInfoByID)
		oldlaneinfossr.POST("/", endpoint.PostOldLaneInfo)
		oldlaneinfossr.PUT("/whole/:id", endpoint.PutOldLaneInfo)
		oldlaneinfossr.PUT("/score/:id/:stageindex/:userindex/:arrowindex/:score", endpoint.PutOldLaneScore)
		oldlaneinfossr.PUT("/confirm/:id/:stageindex/:userindex/:confirm", endpoint.PutOldLaneConfirm)
		oldlaneinfossr.DELETE("/:id", endpoint.DeleteOldLaneInfoByID)
	}
}

func profileRouter(api *gin.RouterGroup) {
	userssr := api.Group("/user")
	{
		userssr.POST("/", endpoint.Register)
		userssr.PUT("/:id", pkg.AuthSessionMiddleware(), endpoint.ModifyInfo)
		userssr.PUT("/password/:id", pkg.AuthSessionMiddleware(), endpoint.ModifyPassword)
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
