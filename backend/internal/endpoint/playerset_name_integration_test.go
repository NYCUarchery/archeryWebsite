//go:build integration

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

// PlayerSet name changes cross the same competition boundary as every other
// roster mutation, so exercise the handler with real MySQL fixtures.
type PlayerSetNameIntegrationTestSuite struct {
	suite.Suite
	router *gin.Engine
}

func TestPlayerSetNameIntegrationTestSuite(t *testing.T) {
	if os.Getenv("ARCHERY_MYSQL_INTEGRATION") != "1" {
		t.Fatal("integration tests require scripts/test.sh go-integration")
	}
	suite.Run(t, new(PlayerSetNameIntegrationTestSuite))
}

func (suite *PlayerSetNameIntegrationTestSuite) SetupSuite() {
	suite.Require().NoError(database.ResetTestDatabase("legacy"))
}

func (suite *PlayerSetNameIntegrationTestSuite) SetupTest() {
	suite.Require().NoError(database.ResetTestDatabase("legacy"))
	gin.SetMode(gin.TestMode)
	suite.router = gin.New()
	suite.router.Use(pkg.EnableCookieSessionMiddleware(pkg.SessionConfig{Key: "playerset-name-integration-test-key"}))
	suite.router.POST("/test/session/:userid", func(context *gin.Context) {
		userID, err := strconv.ParseUint(context.Param("userid"), 10, 64)
		if err != nil || userID == 0 {
			context.Status(http.StatusBadRequest)
			return
		}
		session := sessions.Default(context)
		session.Set("userid", uint(userID))
		suite.Require().NoError(session.Save())
		context.Status(http.StatusNoContent)
	})
	suite.router.PATCH("/playerset/name/:id", PutPlayerSetName)
}

func (suite *PlayerSetNameIntegrationTestSuite) request(method, path string, body any, cookies []*http.Cookie) *httptest.ResponseRecorder {
	encoded, err := json.Marshal(body)
	suite.Require().NoError(err)
	req := httptest.NewRequest(method, path, bytes.NewReader(encoded))
	req.Header.Set("Content-Type", "application/json")
	for _, cookie := range cookies {
		req.AddCookie(cookie)
	}
	recorder := httptest.NewRecorder()
	suite.router.ServeHTTP(recorder, req)
	return recorder
}

func (suite *PlayerSetNameIntegrationTestSuite) login(userID uint) []*http.Cookie {
	recorder := suite.request(http.MethodPost, fmt.Sprintf("/test/session/%d", userID), map[string]any{}, nil)
	suite.Require().Equal(http.StatusNoContent, recorder.Code)
	return recorder.Result().Cookies()
}

func (suite *PlayerSetNameIntegrationTestSuite) fixture() (database.PlayerSet, []*http.Cookie, []*http.Cookie, []*http.Cookie, []*http.Cookie, []*http.Cookie) {
	now := time.Now()
	competition, err := database.PostCompetition(database.Competition{Title: "playerset name integration", StartTime: now, EndTime: now.Add(time.Hour)})
	suite.Require().NoError(err)
	group, err := database.CreateGroupInfo(database.Group{CompetitionId: competition.ID, GroupName: "team", GroupIndex: 1})
	suite.Require().NoError(err)
	elimination, err := database.CreateElimination(database.Elimination{GroupId: group.ID, TeamSize: 3})
	suite.Require().NoError(err)
	playerSet, err := database.CreatePlayerSet(database.PlayerSet{EliminationId: elimination.ID, SetName: "original team"})
	suite.Require().NoError(err)

	adminID, playerID, judgeID, foreignAdminID, pendingAdminID := uint(98001), uint(98002), uint(98003), uint(98004), uint(98005)
	for _, participant := range []database.Participant{
		{UserID: adminID, CompetitionID: competition.ID, Role: pkg.RoleToString(pkg.RAdmin), Status: "approved"},
		{UserID: playerID, CompetitionID: competition.ID, Role: pkg.RoleToString(pkg.RPlayer), Status: "approved"},
		{UserID: judgeID, CompetitionID: competition.ID, Role: pkg.RoleToString(pkg.RJudge), Status: "approved"},
		{UserID: pendingAdminID, CompetitionID: competition.ID, Role: pkg.RoleToString(pkg.RAdmin), Status: "pending"},
	} {
		_, err := database.CreateParticipant(participant)
		suite.Require().NoError(err)
	}
	foreignCompetition, err := database.PostCompetition(database.Competition{Title: "foreign playerset name", StartTime: now, EndTime: now.Add(time.Hour)})
	suite.Require().NoError(err)
	_, err = database.CreateParticipant(database.Participant{UserID: foreignAdminID, CompetitionID: foreignCompetition.ID, Role: pkg.RoleToString(pkg.RAdmin), Status: "approved"})
	suite.Require().NoError(err)

	return playerSet, suite.login(adminID), suite.login(playerID), suite.login(judgeID), suite.login(foreignAdminID), suite.login(pendingAdminID)
}

func (suite *PlayerSetNameIntegrationTestSuite) TestRenameRequiresOwningCompetitionAdmin() {
	playerSet, adminCookies, playerCookies, judgeCookies, foreignAdminCookies, pendingAdminCookies := suite.fixture()
	path := fmt.Sprintf("/playerset/name/%d", playerSet.ID)
	for name, cookies := range map[string][]*http.Cookie{
		"guest":         nil,
		"player":        playerCookies,
		"judge":         judgeCookies,
		"foreign admin": foreignAdminCookies,
		"pending admin": pendingAdminCookies,
	} {
		suite.Run(name, func() {
			recorder := suite.request(http.MethodPatch, path, map[string]string{"set_name": "blocked rename"}, cookies)
			suite.Equal(http.StatusForbidden, recorder.Code, recorder.Body.String())
			stored, err := database.GetPlayerSetById(playerSet.ID)
			suite.Require().NoError(err)
			suite.Equal("original team", stored.SetName)
		})
	}

	recorder := suite.request(http.MethodPatch, path, map[string]string{"set_name": "approved rename"}, adminCookies)
	suite.Equal(http.StatusOK, recorder.Code, recorder.Body.String())
	stored, err := database.GetPlayerSetById(playerSet.ID)
	suite.Require().NoError(err)
	suite.Equal("approved rename", stored.SetName)
}

func (suite *PlayerSetNameIntegrationTestSuite) TestRenameMissingPlayerSetKeepsExistingBadRequest() {
	recorder := suite.request(http.MethodPatch, "/playerset/name/999999", map[string]string{"set_name": "missing"}, nil)
	suite.Equal(http.StatusBadRequest, recorder.Code, recorder.Body.String())
}
