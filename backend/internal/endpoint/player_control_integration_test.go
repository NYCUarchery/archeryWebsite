package endpoint

import (
	"backend/internal/database"
	"backend/internal/pkg"
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"os"
	"strconv"
	"testing"
	"time"

	"github.com/gin-contrib/sessions"
	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/suite"
)

// Player control authorization relies on MySQL row locks and target-derived
// competition ownership, so keep its regression coverage on the real MySQL
// integration path.
type PlayerControlIntegrationTestSuite struct {
	suite.Suite
	router      *gin.Engine
	sessionFile string
}

func TestPlayerControlIntegrationTestSuite(t *testing.T) {
	if os.Getenv("ARCHERY_MYSQL_INTEGRATION") != "1" {
		t.Skip("set ARCHERY_MYSQL_INTEGRATION=1 to run destructive MySQL integration tests")
	}
	suite.Run(t, new(PlayerControlIntegrationTestSuite))
}

func (suite *PlayerControlIntegrationTestSuite) SetupSuite() {
	database.SetupDatabaseByMode("test")
	file, err := os.CreateTemp("", "archery-player-control-session-*.yaml")
	suite.Require().NoError(err)
	suite.sessionFile = file.Name()
	suite.Require().NoError(file.Close())
	suite.Require().NoError(os.WriteFile(suite.sessionFile, []byte("SessionKey: player-control-integration-test-key\n"), 0600))
}

func (suite *PlayerControlIntegrationTestSuite) TearDownSuite() {
	if suite.sessionFile != "" {
		_ = os.Remove(suite.sessionFile)
	}
}

func (suite *PlayerControlIntegrationTestSuite) SetupTest() {
	database.TestDBRestore()
	gin.SetMode(gin.TestMode)
	suite.router = gin.New()
	suite.router.Use(pkg.EnableCookieSessionMiddleware(suite.sessionFile))
	suite.router.POST("/test/session/:userid", func(context *gin.Context) {
		userID, err := strconv.ParseUint(context.Param("userid"), 10, 64)
		if err != nil || userID == 0 {
			context.Status(http.StatusBadRequest)
			return
		}
		session := sessions.Default(context)
		session.Set("userid", uint(userID))
		session.Set("username", "player-control-test")
		suite.Require().NoError(session.Save())
		context.Status(http.StatusNoContent)
	})
	suite.router.PATCH("/player/group/:id", PutPlayerGroupId)
	suite.router.PATCH("/player/lane/:id", PutPlayerLaneId)
	suite.router.PATCH("/player/order/:id", PutPlayerOrder)
	suite.router.PATCH("/player/lane-order/:id", PatchPlayerLaneOrder)
	suite.router.POST("/player/:participantid", PostPlayer)
	suite.router.DELETE("/player/:id", DeletePlayer)
	suite.router.DELETE("/participant/:id", DeleteParticipantById)
	suite.router.POST("/participant", pkg.AuthSessionMiddleware(), PostParticipant)
}

func (suite *PlayerControlIntegrationTestSuite) request(method, path string, body any, cookies []*http.Cookie) *httptest.ResponseRecorder {
	var input *bytes.Reader
	if body == nil {
		input = bytes.NewReader(nil)
	} else {
		encoded, err := json.Marshal(body)
		suite.Require().NoError(err)
		input = bytes.NewReader(encoded)
	}
	req := httptest.NewRequest(method, path, input)
	if body != nil {
		req.Header.Set("Content-Type", "application/json")
	}
	for _, cookie := range cookies {
		req.AddCookie(cookie)
	}
	recorder := httptest.NewRecorder()
	suite.router.ServeHTTP(recorder, req)
	return recorder
}

func (suite *PlayerControlIntegrationTestSuite) login(userID uint) []*http.Cookie {
	recorder := suite.request(http.MethodPost, fmt.Sprintf("/test/session/%d", userID), nil, nil)
	suite.Equal(http.StatusNoContent, recorder.Code)
	return recorder.Result().Cookies()
}

func (suite *PlayerControlIntegrationTestSuite) fixture() (database.Competition, database.Player, database.Lane, database.Lane, database.Group, database.Participant, database.Participant, []*http.Cookie, []*http.Cookie) {
	now := time.Now()
	competition, err := database.PostCompetition(database.Competition{Title: "player control integration", StartTime: now, EndTime: now.Add(time.Hour)})
	suite.Require().NoError(err)
	unassignedGroup, err := database.CreateGroupInfo(database.Group{CompetitionId: competition.ID, GroupName: "unassigned", GroupIndex: 0})
	suite.Require().NoError(err)
	suite.True(database.UpdateCompetitionUnassignedGroupId(competition.ID, unassignedGroup.ID))
	group, err := database.CreateGroupInfo(database.Group{CompetitionId: competition.ID, GroupName: "target", GroupIndex: 1})
	suite.Require().NoError(err)
	qualification, err := database.PostQualification(database.Qualification{})
	suite.Require().NoError(err)
	unassignedLane, err := database.PostLane(database.Lane{CompetitionId: competition.ID, QualificationId: qualification.ID, LaneNumber: 0})
	suite.Require().NoError(err)
	suite.True(database.UpdateCompetitionUnassignedLaneId(competition.ID, unassignedLane.ID))
	targetLane, err := database.PostLane(database.Lane{CompetitionId: competition.ID, QualificationId: qualification.ID, LaneNumber: 1})
	suite.Require().NoError(err)

	adminUserID, playerUserID := uint(97001), uint(97002)
	adminParticipant, err := database.CreateParticipant(database.Participant{UserID: adminUserID, CompetitionID: competition.ID, Role: pkg.RoleToString(pkg.RAdmin), Status: "approved"})
	suite.Require().NoError(err)
	playerParticipant, err := database.CreateParticipant(database.Participant{UserID: playerUserID, CompetitionID: competition.ID, Role: pkg.RoleToString(pkg.RPlayer), Status: "approved"})
	suite.Require().NoError(err)
	player, err := database.CreatePlayer(database.Player{GroupId: unassignedGroup.ID, LaneId: unassignedLane.ID, ParticipantId: playerParticipant.ID, Name: "target", Order: 1})
	suite.Require().NoError(err)
	return competition, player, unassignedLane, targetLane, group, adminParticipant, playerParticipant, suite.login(adminUserID), suite.login(playerUserID)
}

func (suite *PlayerControlIntegrationTestSuite) TestPlayerLaneAndDeleteRequireTargetCompetitionAdmin() {
	_, player, unassignedLane, targetLane, _, _, _, adminCookies, playerCookies := suite.fixture()
	lanePath := fmt.Sprintf("/player/lane/%d", player.ID)

	recorder := suite.request(http.MethodPatch, lanePath, map[string]uint{"lane_id": targetLane.ID}, nil)
	suite.Equal(http.StatusForbidden, recorder.Code)
	current, err := database.GetOnlyPlayer(player.ID)
	suite.Require().NoError(err)
	suite.Equal(unassignedLane.ID, current.LaneId)

	recorder = suite.request(http.MethodPatch, lanePath, map[string]uint{"lane_id": targetLane.ID}, playerCookies)
	suite.Equal(http.StatusForbidden, recorder.Code)
	current, err = database.GetOnlyPlayer(player.ID)
	suite.Require().NoError(err)
	suite.Equal(unassignedLane.ID, current.LaneId)

	recorder = suite.request(http.MethodPatch, lanePath, map[string]uint{"lane_id": targetLane.ID}, adminCookies)
	suite.Equal(http.StatusOK, recorder.Code)
	current, err = database.GetOnlyPlayer(player.ID)
	suite.Require().NoError(err)
	suite.Equal(targetLane.ID, current.LaneId)

	deletePath := fmt.Sprintf("/player/%d", player.ID)
	recorder = suite.request(http.MethodDelete, deletePath, nil, nil)
	suite.Equal(http.StatusForbidden, recorder.Code)
	suite.True(database.GetPlayerIsExist(player.ID))
	recorder = suite.request(http.MethodDelete, deletePath, nil, playerCookies)
	suite.Equal(http.StatusForbidden, recorder.Code)
	suite.True(database.GetPlayerIsExist(player.ID))
	recorder = suite.request(http.MethodDelete, deletePath, nil, adminCookies)
	suite.Equal(http.StatusOK, recorder.Code)
	suite.False(database.GetPlayerIsExist(player.ID))
}

func (suite *PlayerControlIntegrationTestSuite) TestPlayerDestinationMustBelongToSameCompetition() {
	competition, player, _, _, _, _, _, adminCookies, _ := suite.fixture()
	foreignCompetition, err := database.PostCompetition(database.Competition{Title: "foreign player control", StartTime: time.Now(), EndTime: time.Now().Add(time.Hour)})
	suite.Require().NoError(err)
	qualification, err := database.PostQualification(database.Qualification{})
	suite.Require().NoError(err)
	foreignLane, err := database.PostLane(database.Lane{CompetitionId: foreignCompetition.ID, QualificationId: qualification.ID, LaneNumber: 1})
	suite.Require().NoError(err)

	recorder := suite.request(http.MethodPatch, fmt.Sprintf("/player/lane/%d", player.ID), map[string]uint{"lane_id": foreignLane.ID}, adminCookies)
	suite.Equal(http.StatusBadRequest, recorder.Code)
	updated, err := database.GetOnlyPlayer(player.ID)
	suite.Require().NoError(err)
	suite.NotEqual(foreignLane.ID, updated.LaneId)
	suite.NotZero(competition.ID)
}

func (suite *PlayerControlIntegrationTestSuite) TestParticipantDeleteRequiresTargetCompetitionAdminAndKeepsLastAdmin() {
	competition, _, _, _, _, adminParticipant, _, adminCookies, playerCookies := suite.fixture()
	deletable, err := database.CreateParticipant(database.Participant{UserID: 97003, CompetitionID: competition.ID, Role: pkg.RoleToString(pkg.RPlayer), Status: "approved"})
	suite.Require().NoError(err)
	path := fmt.Sprintf("/participant/%d", deletable.ID)

	recorder := suite.request(http.MethodDelete, path, nil, nil)
	suite.Equal(http.StatusForbidden, recorder.Code)
	suite.True(database.GetParticipantIsExist(deletable.ID))
	recorder = suite.request(http.MethodDelete, path, nil, playerCookies)
	suite.Equal(http.StatusForbidden, recorder.Code)
	suite.True(database.GetParticipantIsExist(deletable.ID))
	recorder = suite.request(http.MethodDelete, path, nil, adminCookies)
	suite.Equal(http.StatusOK, recorder.Code)
	suite.False(database.GetParticipantIsExist(deletable.ID))

	recorder = suite.request(http.MethodDelete, fmt.Sprintf("/participant/%d", adminParticipant.ID), nil, adminCookies)
	suite.Equal(http.StatusConflict, recorder.Code)
	suite.True(database.GetParticipantIsExist(adminParticipant.ID))
}

func (suite *PlayerControlIntegrationTestSuite) TestParticipantApplicationUsesSessionUserAndDoesNotCreatePlayer() {
	now := time.Now()
	competition, err := database.PostCompetition(database.Competition{Title: "participant application integration", StartTime: now, EndTime: now.Add(time.Hour)})
	suite.Require().NoError(err)
	applicant, err := database.CreateUser(database.User{Role: pkg.RoleToString(pkg.RUser), UserName: "applicant", RealName: "Applicant", Password: "password", Email: "applicant@example.test"})
	suite.Require().NoError(err)
	other, err := database.CreateUser(database.User{Role: pkg.RoleToString(pkg.RUser), UserName: "other-applicant", RealName: "Other", Password: "password", Email: "other-applicant@example.test"})
	suite.Require().NoError(err)
	cookies := suite.login(applicant.ID)
	body := map[string]any{"user_id": applicant.ID, "competition_id": competition.ID, "role": pkg.RoleToString(pkg.RJudge)}

	recorder := suite.request(http.MethodPost, "/participant", body, cookies)
	suite.Equal(http.StatusOK, recorder.Code)
	participants, err := database.GetParticipantByCompetitionIdUserId(competition.ID, applicant.ID)
	suite.Require().NoError(err)
	suite.Len(participants, 1)
	suite.Equal("pending", participants[0].Status)
	suite.Require().NoError(database.DB.Model(&database.Participant{}).Where("id = ?", participants[0].ID).Update("status", "approved").Error)
	_, err = database.CreateParticipant(database.Participant{UserID: other.ID, CompetitionID: competition.ID, Role: pkg.RoleToString(pkg.RAdmin), Status: "approved"})
	suite.Require().NoError(err)
	recorder = suite.request(http.MethodPost, fmt.Sprintf("/player/%d", participants[0].ID), nil, suite.login(other.ID))
	suite.Equal(http.StatusForbidden, recorder.Code, recorder.Body.String())
	var players int64
	suite.Require().NoError(database.DB.Model(&database.Player{}).Where("participant_id = ?", participants[0].ID).Count(&players).Error)
	suite.Zero(players)

	recorder = suite.request(http.MethodPost, "/participant", body, cookies)
	suite.Equal(http.StatusBadRequest, recorder.Code)
	recorder = suite.request(http.MethodPost, "/participant", map[string]any{"user_id": other.ID, "competition_id": competition.ID, "role": pkg.RoleToString(pkg.RJudge)}, cookies)
	suite.Equal(http.StatusForbidden, recorder.Code)
}
