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
	data.GET("/teamEliminationInfo/:gameName", translate.GetTeamEliminationInfo)
	data.GET("/userInfo/:userName", translate.GetUserInfo)

	user := data.Group("user")
	userRouter(user)

	participant := data.Group("participant")
	participantRouter(participant)

	player := data.Group("player")
	playerRouter(player)

	competition := data.Group("competition")
	competitionRouter(competition)

	groupinfo := data.Group("groupinfo")
	groupInfoRouter(groupinfo)

	qualification := data.Group("qualification")
	qualificationRouter(qualification)

	lane := data.Group("lane")
	laneRouter(lane)

	oldlaneinfo := data.Group("oldlaneinfo")
	oldLaneInfoRouter(oldlaneinfo)
}

func userRouter(data *gin.RouterGroup) {
	data.GET("/:id", translate.GetOnlyUserById)
	data.GET("/participants/:id", translate.GetUserWParticipantsById)
	data.POST("/", translate.PostUser)
	data.PUT("/whole/:id", translate.PutUser)
	data.DELETE("/:id", translate.DeleteUser)
}

func participantRouter(data *gin.RouterGroup) {
	data.GET("/:id", translate.GetParticipant)
	data.POST("/", translate.PostParticipant)
	data.PUT("/whole/:id", translate.UpdateParticipant)
	data.DELETE("/:id", translate.DeleteParticipant)
}

func playerRouter(data *gin.RouterGroup) {
	data.GET("/:id", translate.GetOnlyPlayerByID)
	data.GET("/scores/:id", translate.GetPlayerWScoresByID)
	data.POST("/:participantid", translate.PostPlayer)
	data.POST("/roundend", translate.PostRoundEnd)
	data.POST("/roundscore", translate.PostRoundScore)
	//data.PUT("/lane/:id", translate.PutPlayerLane)
	//data.PUT("/group/:id", translate.PutPlayerGroup)
	//data.PUT("shootoffscore/:id", translate.PutPlayerShootoffScore)
	data.DELETE("/:id", translate.DeletePlayer)
}

func competitionRouter(data *gin.RouterGroup) {
	data.GET("/:id", translate.GetOnlyCompetitionByID)
	data.GET("/participants/:id", translate.GetCompetitionWParticipantsByID)
	data.GET("/groups/:id", translate.GetCompetitionWGroupsByID)
	data.GET("/groups/players/:id", translate.GetCompetitionWGroupsPlayersByID)
	data.POST("/", translate.PostCompetition)
	data.PUT("/whole/:id", translate.UpdateCompetition)
	data.DELETE("/:id", translate.DeleteCompetition)
}

func groupInfoRouter(data *gin.RouterGroup) {
	data.GET("/:id", translate.GetGroupInfoByID)
	data.POST("/", translate.PostGroupInfo)
	data.PUT("/whole/:id", translate.UpdateGroupInfo)
	data.PUT("/reorder", translate.ReorderGroupInfo)
	data.DELETE("/:id", translate.DeleteGroupInfo)
}

func qualificationRouter(data *gin.RouterGroup) {
	data.GET("/:id", translate.GetOnlyQualificationByID)
	data.GET("/lanes/:id", translate.GetQualificationWLanesByID)
	data.GET("/lanes/players/:id", translate.GetQualificationWLanesPlayersByID)
	data.PUT("/whole/:id", translate.UpdateQualificationByID)

}

func laneRouter(data *gin.RouterGroup) {
	data.GET("/:id", translate.GetLaneByID)
	data.GET("/all/:id", translate.GetAllLaneByCompetitionId)
	// data.GET("/players/:id", translate.GetLaneWPlayers)
}

func oldLaneInfoRouter(data *gin.RouterGroup) {
	data.GET("/:id", translate.GetOldLaneInfoByID)
	data.POST("/", translate.PostOldLaneInfo)
	data.PUT("/whole/:id", translate.UpdateOldLaneInfo)
	data.PUT("/score/:id/:stageindex/:userindex/:arrowindex/:score", translate.UpdataOldLaneScore)
	data.PUT("/confirm/:id/:stageindex/:userindex/:confirm", translate.UpdataOldLaneConfirm)
	data.DELETE("/:id", translate.DeleteOldLaneInfoByID)
}
