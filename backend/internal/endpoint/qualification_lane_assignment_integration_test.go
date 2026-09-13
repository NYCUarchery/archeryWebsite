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

// Qualification lane assignment relies on the legacy contiguous lane-ID
// contract, so verify its release and occupancy behavior against real MySQL.
type QualificationLaneAssignmentIntegrationTestSuite struct {
	suite.Suite
	router      *gin.Engine
	sessionFile string
}

func TestQualificationLaneAssignmentIntegrationTestSuite(t *testing.T) {
	if os.Getenv("ARCHERY_MYSQL_INTEGRATION") != "1" {
		t.Fatal("integration tests require scripts/test.sh go-integration")
	}
	suite.Run(t, new(QualificationLaneAssignmentIntegrationTestSuite))
}

func (suite *QualificationLaneAssignmentIntegrationTestSuite) SetupSuite() {
	file, err := os.CreateTemp("", "archery-qualification-lane-session-*.yaml")
	suite.Require().NoError(err)
	suite.sessionFile = file.Name()
	suite.Require().NoError(file.Close())
	suite.Require().NoError(os.WriteFile(suite.sessionFile, []byte("SessionKey: qualification-lane-integration-test-key\n"), 0600))
}

func (suite *QualificationLaneAssignmentIntegrationTestSuite) TearDownSuite() {
	if suite.sessionFile != "" {
		_ = os.Remove(suite.sessionFile)
	}
}

func (suite *QualificationLaneAssignmentIntegrationTestSuite) SetupTest() {
	suite.Require().NoError(database.ResetTestDatabase("legacy"))
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
		suite.Require().NoError(session.Save())
		context.Status(http.StatusNoContent)
	})
	suite.router.PUT("/qualification/:id", PutQualificationByID)
}

func (suite *QualificationLaneAssignmentIntegrationTestSuite) request(qualificationID uint, start, end int, cookies []*http.Cookie) *httptest.ResponseRecorder {
	body, err := json.Marshal(map[string]int{"start_lane": start, "end_lane": end})
	suite.Require().NoError(err)
	req := httptest.NewRequest(http.MethodPut, fmt.Sprintf("/qualification/%d", qualificationID), bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	for _, cookie := range cookies {
		req.AddCookie(cookie)
	}
	recorder := httptest.NewRecorder()
	suite.router.ServeHTTP(recorder, req)
	return recorder
}

func (suite *QualificationLaneAssignmentIntegrationTestSuite) login(userID uint) []*http.Cookie {
	req := httptest.NewRequest(http.MethodPost, fmt.Sprintf("/test/session/%d", userID), nil)
	recorder := httptest.NewRecorder()
	suite.router.ServeHTTP(recorder, req)
	suite.Require().Equal(http.StatusNoContent, recorder.Code)
	return recorder.Result().Cookies()
}

func (suite *QualificationLaneAssignmentIntegrationTestSuite) fixture() (database.Competition, database.Qualification, database.Qualification, []*http.Cookie, []*http.Cookie, []*http.Cookie, []*http.Cookie) {
	now := time.Now()
	competition, err := database.PostCompetition(database.Competition{Title: "qualification lane assignment", StartTime: now, EndTime: now.Add(time.Hour), LanesNum: 12})
	suite.Require().NoError(err)
	unassigned, err := database.CreateGroupInfo(database.Group{CompetitionId: competition.ID, GroupName: "unassigned", GroupIndex: -1})
	suite.Require().NoError(err)
	suite.True(database.UpdateCompetitionUnassignedGroupId(competition.ID, unassigned.ID))
	suite.Require().NoError(database.DB.Create(&database.Qualification{ID: unassigned.ID}).Error)
	groupA, err := database.CreateGroupInfo(database.Group{CompetitionId: competition.ID, GroupName: "A", GroupIndex: 1})
	suite.Require().NoError(err)
	groupB, err := database.CreateGroupInfo(database.Group{CompetitionId: competition.ID, GroupName: "B", GroupIndex: 2})
	suite.Require().NoError(err)
	qualificationA, err := database.PostQualification(database.Qualification{ID: groupA.ID})
	suite.Require().NoError(err)
	qualificationB, err := database.PostQualification(database.Qualification{ID: groupB.ID})
	suite.Require().NoError(err)
	unassignedLane, err := database.PostLane(database.Lane{CompetitionId: competition.ID, QualificationId: unassigned.ID, LaneNumber: 0})
	suite.Require().NoError(err)
	suite.True(database.UpdateCompetitionUnassignedLaneId(competition.ID, unassignedLane.ID))
	for laneNumber := 1; laneNumber <= 12; laneNumber++ {
		_, err := database.PostLane(database.Lane{CompetitionId: competition.ID, QualificationId: unassigned.ID, LaneNumber: laneNumber})
		suite.Require().NoError(err)
	}
	adminID, judgeID, foreignAdminID, pendingAdminID := uint(99001), uint(99002), uint(99003), uint(99004)
	for _, participant := range []database.Participant{
		{UserID: adminID, CompetitionID: competition.ID, Role: pkg.RoleToString(pkg.RAdmin), Status: "approved"},
		{UserID: judgeID, CompetitionID: competition.ID, Role: pkg.RoleToString(pkg.RJudge), Status: "approved"},
		{UserID: pendingAdminID, CompetitionID: competition.ID, Role: pkg.RoleToString(pkg.RAdmin), Status: "pending"},
	} {
		_, err := database.CreateParticipant(participant)
		suite.Require().NoError(err)
	}
	foreignCompetition, err := database.PostCompetition(database.Competition{Title: "foreign qualification lane", StartTime: now, EndTime: now.Add(time.Hour)})
	suite.Require().NoError(err)
	_, err = database.CreateParticipant(database.Participant{UserID: foreignAdminID, CompetitionID: foreignCompetition.ID, Role: pkg.RoleToString(pkg.RAdmin), Status: "approved"})
	suite.Require().NoError(err)
	return competition, qualificationA, qualificationB, suite.login(adminID), suite.login(judgeID), suite.login(foreignAdminID), suite.login(pendingAdminID)
}

func (suite *QualificationLaneAssignmentIntegrationTestSuite) laneQualifications(competitionID uint) map[int]uint {
	lanes, err := database.GetAllLanesByCompetitionId(competitionID)
	suite.Require().NoError(err)
	assigned := make(map[int]uint, len(lanes))
	for _, lane := range lanes {
		assigned[lane.LaneNumber] = lane.QualificationId
	}
	return assigned
}

func (suite *QualificationLaneAssignmentIntegrationTestSuite) TestAssignmentsKeepOtherNewQualificationRanges() {
	competition, qualificationA, qualificationB, adminCookies, _, _, _ := suite.fixture()
	recorder := suite.request(qualificationA.ID, 1, 6, adminCookies)
	suite.Require().Equal(http.StatusOK, recorder.Code, recorder.Body.String())
	recorder = suite.request(qualificationB.ID, 7, 12, adminCookies)
	suite.Require().Equal(http.StatusOK, recorder.Code, recorder.Body.String())

	assigned := suite.laneQualifications(competition.ID)
	for laneNumber := 1; laneNumber <= 6; laneNumber++ {
		suite.Equal(qualificationA.ID, assigned[laneNumber])
	}
	for laneNumber := 7; laneNumber <= 12; laneNumber++ {
		suite.Equal(qualificationB.ID, assigned[laneNumber])
	}

	beforeRejectedRange := assigned
	recorder = suite.request(qualificationB.ID, 4, 9, adminCookies)
	suite.Equal(http.StatusBadRequest, recorder.Code, recorder.Body.String())
	suite.Equal(beforeRejectedRange, suite.laneQualifications(competition.ID))
	storedA, err := database.GetOnlyQualification(qualificationA.ID)
	suite.Require().NoError(err)
	storedB, err := database.GetOnlyQualification(qualificationB.ID)
	suite.Require().NoError(err)
	suite.Equal(1, storedA.StartLaneNumber)
	suite.Equal(6, storedA.EndLaneNumber)
	suite.Equal(7, storedB.StartLaneNumber)
	suite.Equal(12, storedB.EndLaneNumber)

	recorder = suite.request(qualificationA.ID, 2, 5, adminCookies)
	suite.Require().Equal(http.StatusOK, recorder.Code, recorder.Body.String())
	assigned = suite.laneQualifications(competition.ID)
	competition, err = database.GetOnlyCompetition(competition.ID)
	suite.Require().NoError(err)
	suite.Equal(competition.UnassignedGroupId, assigned[1])
	suite.Equal(qualificationA.ID, assigned[2])
	suite.Equal(qualificationA.ID, assigned[3])
	suite.Equal(qualificationA.ID, assigned[4])
	suite.Equal(qualificationA.ID, assigned[5])
	suite.Equal(competition.UnassignedGroupId, assigned[6])
	for laneNumber := 7; laneNumber <= 12; laneNumber++ {
		suite.Equal(qualificationB.ID, assigned[laneNumber])
	}
}

func (suite *QualificationLaneAssignmentIntegrationTestSuite) TestAssignmentRequiresOwningCompetitionAdmin() {
	competition, qualificationA, qualificationB, adminCookies, judgeCookies, foreignAdminCookies, pendingAdminCookies := suite.fixture()
	beforeLanes := suite.laneQualifications(competition.ID)
	beforeA, err := database.GetOnlyQualification(qualificationA.ID)
	suite.Require().NoError(err)
	beforeB, err := database.GetOnlyQualification(qualificationB.ID)
	suite.Require().NoError(err)
	for name, cookies := range map[string][]*http.Cookie{
		"guest":         nil,
		"judge":         judgeCookies,
		"foreign admin": foreignAdminCookies,
		"pending admin": pendingAdminCookies,
	} {
		suite.Run(name, func() {
			recorder := suite.request(qualificationA.ID, 1, 6, cookies)
			suite.Equal(http.StatusForbidden, recorder.Code, recorder.Body.String())
			suite.Equal(beforeLanes, suite.laneQualifications(competition.ID))
			storedA, err := database.GetOnlyQualification(qualificationA.ID)
			suite.Require().NoError(err)
			storedB, err := database.GetOnlyQualification(qualificationB.ID)
			suite.Require().NoError(err)
			suite.Equal(beforeA, storedA)
			suite.Equal(beforeB, storedB)
		})
	}

	recorder := suite.request(qualificationA.ID, 1, 6, adminCookies)
	suite.Equal(http.StatusOK, recorder.Code, recorder.Body.String())
	for laneNumber := 1; laneNumber <= 6; laneNumber++ {
		suite.Equal(qualificationA.ID, suite.laneQualifications(competition.ID)[laneNumber])
	}
}

func (suite *QualificationLaneAssignmentIntegrationTestSuite) TestAssignmentMissingQualificationKeepsBadRequest() {
	recorder := suite.request(999999, 1, 6, nil)
	suite.Equal(http.StatusBadRequest, recorder.Code, recorder.Body.String())
}
