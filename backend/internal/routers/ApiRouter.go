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

	api.POST("/:participantid", endpoint.PostPlayer)
	api.POST("/roundend", endpoint.PostRoundEnd)
	api.POST("/roundscore", endpoint.PostRoundScore)
	api.PUT("/lane/:id", endpoint.PutPlayerLaneId)
	api.PUT("/group/:id", endpoint.PutPlayerGroupId)
	api.PUT("/order/:id", endpoint.PutPlayerOrder)
	api.PUT("/isconfirmed/:id", endpoint.PutPlayerIsConfirmed)

	api.PUT("/totalscore/:id", endpoint.PutPlayerTotalScoreByplayerId)
	api.PUT("/roundscore/:id", endpoint.PutPlayerScore)

	api.PUT("/shootoffscore/:id", endpoint.PutPlayerShootoffScore)
	api.PUT("/all-endscores/:id", endpoint.PutPlayerAllEndScoresByEndId)
	api.DELETE("/:id", endpoint.DeletePlayer)

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
	api.GET("/", endpoint.GetAllCompetition)
	api.GET("/:id", endpoint.GetOnlyCompetitionByID)
	api.GET("/participants/:id", endpoint.GetCompetitionWParticipantsByID)
	api.GET("/groups/:id", endpoint.GetCompetitionWGroupsByID)
	api.GET("/groups/players/:id", endpoint.GetCompetitionWGroupsPlayersByID)
	api.GET("/groups/quaeli/:id", endpoint.GetCompetitionWGroupsQuaEliByID)

		competitionssr.GET("/current/:head/:tail", endpoint.GetCurrentCompetitions)
		competitionssr.GET("/user/:userid/:head/:tail", endpoint.GetCompetitionsOfUser)

	api.POST("/", endpoint.PostCompetition)
	api.PUT("/groups/players/rank/:id", endpoint.PutCompetitionRank)
	api.PUT("/groups/players/playertotal/:id", endpoint.PutCompetitionRecountPlayerTotalScore) //
	api.PUT("/whole/:id", endpoint.PutCompetition)
	api.DELETE("/:id", endpoint.DeleteCompetition)

	api.PUT("/current-phase/plus/:id", endpoint.PutCompetitionCurrentPhasePlus)
	api.PUT("/current-phase/minus/:id", endpoint.PutCompetitionCurrentPhaseMinus)
	api.PUT("/qualification-current-end/plus/:id", endpoint.PutCompetitionQualificationCurrentEndPlus)
	api.PUT("/qualification-current-end/minus/:id", endpoint.PutCompetitionQualificationCurrentEndMinus)

	api.PUT("/qualification-isactive/:id", endpoint.PutCompetitionQualificationActive)
	api.PUT("/elimination-isactive/:id", endpoint.PutCompetitionEliminationActive)
	api.PUT("/team-elimination-isactive/:id", endpoint.PutCompetitionTeamEliminationActive)
	api.PUT("/mixed-elimination-isactive/:id", endpoint.PutCompetitionMixedEliminationActive)
}

func groupInfoRouter(api *gin.RouterGroup) {
	api.GET("/:id", endpoint.GetGroupInfoByID)
	api.GET("/players/:id", endpoint.GetGroupInfoWPlayersByID)
	api.POST("/", endpoint.PostGroupInfo)
	api.PUT("/whole/:id", endpoint.PutGroupInfo)
	api.PUT("/ordering", endpoint.PutGroupInfoOrdering)
	api.DELETE("/:id", endpoint.DeleteGroupInfo)
}

func qualificationRouter(api *gin.RouterGroup) {
	api.GET("/:id", endpoint.GetOnlyQualificationByID)
	api.GET("/lanes/:id", endpoint.GetQualificationWLanesByID)
	api.GET("/lanes/players/:id", endpoint.GetQualificationWLanesPlayersByID)
	api.GET("/lanes/unassigned/:id", endpoint.GetQualificationWUnassignedLanesByID)
	api.PUT("/whole/:id", endpoint.PutQualificationByID)
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
	api.GET("/:id", endpoint.GetMatchResultById)
	api.GET("/scores/:id", endpoint.GetMatchResultWScoresById)
	api.POST("/matchend", endpoint.PostMatchEnd)

	api.PUT("/totalpoints/:id", endpoint.PutMatchResultTotalPointsById)
	api.PUT("/shootoffscore/:id", endpoint.PutMatchResultShootOffScoreById)
	api.PUT("/iswinner/:id", endpoint.PutMatchResultIsWinnerById)
	api.PUT("/lanenumber/:id", endpoint.PutMatchResultLaneNumberById)

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
	api.GET("/:id", endpoint.GetOldLaneInfoByID)
	api.POST("/", endpoint.PostOldLaneInfo)
	api.PUT("/whole/:id", endpoint.PutOldLaneInfo)
	api.PUT("/score/:id/:stageindex/:userindex/:arrowindex/:score", endpoint.PutOldLaneScore)
	api.PUT("/confirm/:id/:stageindex/:userindex/:confirm", endpoint.PutOldLaneConfirm)
	api.DELETE("/:id", endpoint.DeleteOldLaneInfoByID)
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
