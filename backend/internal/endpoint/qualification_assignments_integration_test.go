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

type QualificationAssignmentsIntegrationSuite struct {
	suite.Suite
	router *gin.Engine
}

func TestQualificationAssignmentsIntegrationSuite(t *testing.T) {
	if os.Getenv("ARCHERY_MYSQL_INTEGRATION") != "1" {
		t.Fatal("integration tests require scripts/test.sh go-integration")
	}
	suite.Run(t, new(QualificationAssignmentsIntegrationSuite))
}
func (s *QualificationAssignmentsIntegrationSuite) SetupTest() {
	s.Require().NoError(database.ResetTestDatabase("legacy"))
	gin.SetMode(gin.TestMode)
	s.router = gin.New()
	s.router.Use(pkg.EnableCookieSessionMiddleware(pkg.SessionConfig{Key: "qualification-assignments-test"}))
	s.router.POST("/test/session/:userid", func(c *gin.Context) {
		id, e := strconv.ParseUint(c.Param("userid"), 10, 64)
		if e != nil || id == 0 {
			c.Status(400)
			return
		}
		session := sessions.Default(c)
		session.Set("userid", uint(id))
		s.Require().NoError(session.Save())
		c.Status(204)
	})
	s.router.POST("/competition/:id/qualification-assignments/preview", PreviewQualificationAssignments)
	s.router.POST("/competition/:id/qualification-assignments", ImportQualificationAssignments)
}
func (s *QualificationAssignmentsIntegrationSuite) login(id uint) []*http.Cookie {
	r := httptest.NewRecorder()
	s.router.ServeHTTP(r, httptest.NewRequest(http.MethodPost, fmt.Sprintf("/test/session/%d", id), nil))
	s.Equal(204, r.Code)
	return r.Result().Cookies()
}
func (s *QualificationAssignmentsIntegrationSuite) preview(id uint, csv string, cookies []*http.Cookie) *httptest.ResponseRecorder {
	body, e := json.Marshal(map[string]string{"csv": csv})
	s.Require().NoError(e)
	req := httptest.NewRequest(http.MethodPost, fmt.Sprintf("/competition/%d/qualification-assignments/preview", id), bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	for _, cookie := range cookies {
		req.AddCookie(cookie)
	}
	r := httptest.NewRecorder()
	s.router.ServeHTTP(r, req)
	return r
}
func (s *QualificationAssignmentsIntegrationSuite) request(method string, id uint, csv string, cookies []*http.Cookie) *httptest.ResponseRecorder {
	body, e := json.Marshal(map[string]string{"csv": csv})
	s.Require().NoError(e)
	req := httptest.NewRequest(method, fmt.Sprintf("/competition/%d/qualification-assignments", id), bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	for _, cookie := range cookies {
		req.AddCookie(cookie)
	}
	r := httptest.NewRecorder()
	s.router.ServeHTTP(r, req)
	return r
}
func (s *QualificationAssignmentsIntegrationSuite) fixture() (database.Competition, database.Group, database.Group, database.Lane, database.Lane, []database.Player, []*http.Cookie, []*http.Cookie, []*http.Cookie) {
	now := time.Now()
	comp, e := database.PostCompetition(database.Competition{Title: "csv assignments", StartTime: now, EndTime: now.Add(time.Hour)})
	s.Require().NoError(e)
	unassigned, e := database.CreateGroupInfo(database.Group{CompetitionId: comp.ID, GroupName: "unassigned", GroupIndex: -1})
	s.Require().NoError(e)
	s.True(database.UpdateCompetitionUnassignedGroupId(comp.ID, unassigned.ID))
	s.Require().NoError(database.DB.Create(&database.Qualification{ID: unassigned.ID}).Error)
	a, e := database.CreateGroupInfo(database.Group{CompetitionId: comp.ID, GroupName: "A", GroupIndex: 1})
	s.Require().NoError(e)
	b, e := database.CreateGroupInfo(database.Group{CompetitionId: comp.ID, GroupName: "B", GroupIndex: 2})
	s.Require().NoError(e)
	s.Require().NoError(database.DB.Create(&database.Qualification{ID: a.ID}).Error)
	s.Require().NoError(database.DB.Create(&database.Qualification{ID: b.ID}).Error)
	zero, e := database.PostLane(database.Lane{CompetitionId: comp.ID, QualificationId: unassigned.ID, LaneNumber: 0})
	s.Require().NoError(e)
	s.True(database.UpdateCompetitionUnassignedLaneId(comp.ID, zero.ID))
	laneA, e := database.PostLane(database.Lane{CompetitionId: comp.ID, QualificationId: a.ID, LaneNumber: 1})
	s.Require().NoError(e)
	laneB, e := database.PostLane(database.Lane{CompetitionId: comp.ID, QualificationId: b.ID, LaneNumber: 2})
	s.Require().NoError(e)
	admin, player, foreign := uint(75101), uint(75102), uint(75103)
	for _, p := range []database.Participant{{UserID: admin, CompetitionID: comp.ID, Role: pkg.RoleToString(pkg.RAdmin), Status: "approved"}, {UserID: player, CompetitionID: comp.ID, Role: pkg.RoleToString(pkg.RPlayer), Status: "approved"}} {
		_, e = database.CreateParticipant(p)
		s.Require().NoError(e)
	}
	other, e := database.PostCompetition(database.Competition{Title: "foreign", StartTime: now, EndTime: now.Add(time.Hour)})
	s.Require().NoError(e)
	_, e = database.CreateParticipant(database.Participant{UserID: foreign, CompetitionID: other.ID, Role: pkg.RoleToString(pkg.RAdmin), Status: "approved"})
	s.Require().NoError(e)
	participants, e := database.GetParticipantByCompetitionId(comp.ID)
	s.Require().NoError(e)
	var playerParticipant database.Participant
	for _, candidate := range participants {
		if candidate.UserID == player {
			playerParticipant = candidate
			break
		}
	}
	s.Require().NotZero(playerParticipant.ID)
	var ps []database.Player
	for i, name := range []string{"Alice", "Bob", "Cara"} {
		participant := playerParticipant
		if i > 0 {
			participant, e = database.CreateParticipant(database.Participant{UserID: uint(75200 + i), CompetitionID: comp.ID, Role: pkg.RoleToString(pkg.RPlayer), Status: "approved"})
			s.Require().NoError(e)
		}
		p, e := database.CreatePlayer(database.Player{ParticipantId: participant.ID, GroupId: unassigned.ID, LaneId: zero.ID, Name: name, TotalScore: 0, ShootOffScore: -1})
		s.Require().NoError(e)
		ps = append(ps, p)
	}
	return comp, a, b, laneA, laneB, ps, s.login(admin), s.login(player), s.login(foreign)
}
func (s *QualificationAssignmentsIntegrationSuite) TestImportSuccessSwapAndRollback() {
	comp, a, b, laneA, laneB, players, admin, _, _ := s.fixture()
	csv := "player_name,group_name,position\nAlice,A,1A\nBob,B,2A\n"
	r := s.request(http.MethodPost, comp.ID, csv, admin)
	s.Equal(200, r.Code, r.Body.String())
	var stored []database.Player
	s.Require().NoError(database.DB.Where("id IN ?", []uint{players[0].ID, players[1].ID}).Order("id").Find(&stored).Error)
	s.Equal(a.ID, stored[0].GroupId)
	s.Equal(laneA.ID, stored[0].LaneId)
	s.Equal(1, stored[0].Order)
	s.Equal(b.ID, stored[1].GroupId)
	s.Equal(laneB.ID, stored[1].LaneId)
	r = s.request(http.MethodPost, comp.ID, "player_name,group_name,position\nAlice,B,2A\nBob,A,1A\n", admin)
	s.Equal(200, r.Code, r.Body.String())
	s.Require().NoError(database.DB.Where("id IN ?", []uint{players[0].ID, players[1].ID}).Order("id").Find(&stored).Error)
	s.Equal(laneB.ID, stored[0].LaneId)
	s.Equal(laneA.ID, stored[1].LaneId)
	s.Require().NoError(database.DB.Where("id IN ?", []uint{players[0].ID, players[1].ID, players[2].ID}).Order("id").Find(&stored).Error)
	before := append([]database.Player(nil), stored...)
	r = s.request(http.MethodPost, comp.ID, "player_name,group_name,position\nAlice,A,1A\nCara,A,2A\n", admin)
	s.Equal(422, r.Code)
	s.Require().NoError(database.DB.Where("id IN ?", []uint{players[0].ID, players[1].ID, players[2].ID}).Order("id").Find(&stored).Error)
	s.Equal(before, stored)
}
func (s *QualificationAssignmentsIntegrationSuite) TestImportRejectsOccupiedAmbiguousAndUnauthorized() {
	comp, a, _, laneA, _, players, admin, player, foreign := s.fixture()
	occupied, e := database.CreatePlayer(database.Player{ParticipantId: players[2].ParticipantId, GroupId: a.ID, LaneId: laneA.ID, Name: "Occupied", TotalScore: 0, Order: 1})
	s.Require().NoError(e)
	_ = occupied
	r := s.request(http.MethodPost, comp.ID, "player_name,group_name,position\nAlice,A,1A\n", admin)
	s.Equal(422, r.Code)
	for _, cookies := range [][]*http.Cookie{nil, player, foreign} {
		r = s.request(http.MethodPost, comp.ID, "player_name,group_name,position\nAlice,A,1B\n", cookies)
		s.Equal(403, r.Code)
	}
	duplicate, e := database.CreatePlayer(database.Player{ParticipantId: players[2].ParticipantId, GroupId: a.ID, LaneId: laneA.ID, Name: "Alice", TotalScore: 0})
	s.Require().NoError(e)
	_ = duplicate
	r = s.request(http.MethodPost, comp.ID, "player_name,group_name,position\nAlice,A,1B\n", admin)
	s.Equal(422, r.Code)
}
func (s *QualificationAssignmentsIntegrationSuite) TestPreviewIsReadOnlyAndRequiresAdmin() {
	comp, a, _, laneA, _, players, admin, player, _ := s.fixture()
	before := []database.Player{}
	s.Require().NoError(database.DB.Where("id IN ?", []uint{players[0].ID, players[1].ID, players[2].ID}).Order("id").Find(&before).Error)
	r := s.preview(comp.ID, "player_name,group_name,position\nAlice,A,1A\n", admin)
	s.Equal(http.StatusOK, r.Code, r.Body.String())
	var after []database.Player
	s.Require().NoError(database.DB.Where("id IN ?", []uint{players[0].ID, players[1].ID, players[2].ID}).Order("id").Find(&after).Error)
	s.Equal(before, after)
	r = s.preview(comp.ID, "player_name,group_name,position\nAlice,A,1A\n", player)
	s.Equal(http.StatusForbidden, r.Code)
	duplicate, err := database.CreateGroupInfo(database.Group{CompetitionId: comp.ID, GroupName: "A", GroupIndex: 3})
	s.Require().NoError(err)
	s.Require().NoError(database.DB.Create(&database.Qualification{ID: duplicate.ID}).Error)
	_ = a
	_ = laneA
	r = s.preview(comp.ID, "player_name,group_name,position\nAlice,A,1A\n", admin)
	s.Equal(http.StatusOK, r.Code)
	s.Contains(r.Body.String(), "組別名稱不唯一")
}
