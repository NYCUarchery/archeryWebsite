//go:build integration

package endpoint

import (
	"backend/internal/database"
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/suite"
)

// Qualification lane assignment relies on the legacy contiguous lane-ID
// contract, so verify its release and occupancy behavior against real MySQL.
type QualificationLaneAssignmentIntegrationTestSuite struct {
	suite.Suite
	router *gin.Engine
}

func TestQualificationLaneAssignmentIntegrationTestSuite(t *testing.T) {
	if os.Getenv("ARCHERY_MYSQL_INTEGRATION") != "1" {
		t.Fatal("integration tests require scripts/test.sh go-integration")
	}
	suite.Run(t, new(QualificationLaneAssignmentIntegrationTestSuite))
}

func (suite *QualificationLaneAssignmentIntegrationTestSuite) SetupTest() {
	suite.Require().NoError(database.ResetTestDatabase("legacy"))
	gin.SetMode(gin.TestMode)
	suite.router = gin.New()
	suite.router.PUT("/qualification/:id", PutQualificationByID)
}

func (suite *QualificationLaneAssignmentIntegrationTestSuite) request(qualificationID uint, start, end int) *httptest.ResponseRecorder {
	body, err := json.Marshal(map[string]int{"start_lane": start, "end_lane": end})
	suite.Require().NoError(err)
	req := httptest.NewRequest(http.MethodPut, fmt.Sprintf("/qualification/%d", qualificationID), bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	recorder := httptest.NewRecorder()
	suite.router.ServeHTTP(recorder, req)
	return recorder
}

func (suite *QualificationLaneAssignmentIntegrationTestSuite) fixture() (database.Competition, database.Qualification, database.Qualification) {
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
	return competition, qualificationA, qualificationB
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
	competition, qualificationA, qualificationB := suite.fixture()
	recorder := suite.request(qualificationA.ID, 1, 6)
	suite.Require().Equal(http.StatusOK, recorder.Code, recorder.Body.String())
	recorder = suite.request(qualificationB.ID, 7, 12)
	suite.Require().Equal(http.StatusOK, recorder.Code, recorder.Body.String())

	assigned := suite.laneQualifications(competition.ID)
	for laneNumber := 1; laneNumber <= 6; laneNumber++ {
		suite.Equal(qualificationA.ID, assigned[laneNumber])
	}
	for laneNumber := 7; laneNumber <= 12; laneNumber++ {
		suite.Equal(qualificationB.ID, assigned[laneNumber])
	}

	beforeRejectedRange := assigned
	recorder = suite.request(qualificationB.ID, 4, 9)
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

	recorder = suite.request(qualificationA.ID, 2, 5)
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
