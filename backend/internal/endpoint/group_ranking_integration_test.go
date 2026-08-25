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

// GroupRankingIntegrationTestSuite uses MySQL because both stale-order
// detection and SELECT ... FOR UPDATE are database semantics, not mockable
// handler behavior.
type GroupRankingIntegrationTestSuite struct {
	suite.Suite
	router      *gin.Engine
	sessionFile string
}

func TestGroupRankingIntegrationTestSuite(t *testing.T) {
	if os.Getenv("ARCHERY_MYSQL_INTEGRATION") != "1" {
		t.Skip("set ARCHERY_MYSQL_INTEGRATION=1 to run destructive MySQL integration tests")
	}
	suite.Run(t, new(GroupRankingIntegrationTestSuite))
}

func (suite *GroupRankingIntegrationTestSuite) SetupSuite() {
	database.SetupDatabaseByMode("test")
	file, err := os.CreateTemp("", "archery-ranking-session-*.yaml")
	suite.Require().NoError(err)
	suite.sessionFile = file.Name()
	suite.Require().NoError(file.Close())
	suite.Require().NoError(os.WriteFile(suite.sessionFile, []byte("SessionKey: ranking-integration-test-key\n"), 0600))
}

func (suite *GroupRankingIntegrationTestSuite) TearDownSuite() {
	if suite.sessionFile != "" {
		_ = os.Remove(suite.sessionFile)
	}
}

func (suite *GroupRankingIntegrationTestSuite) SetupTest() {
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
		suite.Require().NoError(session.Save())
		context.Status(http.StatusNoContent)
	})
	suite.router.GET("/groupinfo/players/ranking/:groupId", GetGroupPlayerRanking)
	suite.router.PATCH("/groupinfo/players/ranking/:groupId", UpdateGroupPlayerRanking)
	suite.router.PATCH("/competition/refresh/groups/players/rank/:id", RefreshCompetitionRank)
}

func (suite *GroupRankingIntegrationTestSuite) request(method, path string, body any, cookies []*http.Cookie) *httptest.ResponseRecorder {
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

func (suite *GroupRankingIntegrationTestSuite) login(userID uint) []*http.Cookie {
	recorder := suite.request(http.MethodPost, fmt.Sprintf("/test/session/%d", userID), nil, nil)
	suite.Equal(http.StatusNoContent, recorder.Code)
	return recorder.Result().Cookies()
}

func (suite *GroupRankingIntegrationTestSuite) addScores(playerID uint, scores ...int) {
	round, err := database.CreateRound(database.Round{PlayerId: playerID})
	suite.Require().NoError(err)
	end, err := database.CreateRoundEnd(database.RoundEnd{RoundId: round.ID})
	suite.Require().NoError(err)
	for _, score := range scores {
		_, err := database.CreateRoundScore(database.RoundScore{RoundEndId: end.ID, Score: score})
		suite.Require().NoError(err)
	}
}

func (suite *GroupRankingIntegrationTestSuite) fixture() (database.Competition, database.Group, database.Group, []database.Player, uint, []*http.Cookie, []*http.Cookie) {
	now := time.Now()
	competition, err := database.PostCompetition(database.Competition{Title: "ranking integration", StartTime: now, EndTime: now.Add(time.Hour)})
	suite.Require().NoError(err)
	unassigned, err := database.CreateGroupInfo(database.Group{CompetitionId: competition.ID, GroupName: "unassigned", GroupIndex: 0})
	suite.Require().NoError(err)
	suite.True(database.UpdateCompetitionUnassignedGroupId(competition.ID, unassigned.ID))
	group, err := database.CreateGroupInfo(database.Group{CompetitionId: competition.ID, GroupName: "formal", GroupIndex: 1})
	suite.Require().NoError(err)
	unassignedQualification, err := database.PostQualification(database.Qualification{})
	suite.Require().NoError(err)
	qualification, err := database.PostQualification(database.Qualification{})
	suite.Require().NoError(err)
	unassignedLane, err := database.PostLane(database.Lane{CompetitionId: competition.ID, QualificationId: unassignedQualification.ID, LaneNumber: 0})
	suite.Require().NoError(err)
	suite.True(database.UpdateCompetitionUnassignedLaneId(competition.ID, unassignedLane.ID))
	lane, err := database.PostLane(database.Lane{CompetitionId: competition.ID, QualificationId: qualification.ID, LaneNumber: 1})
	suite.Require().NoError(err)
	adminID, playerID := uint(93001), uint(93002)
	_, err = database.CreateParticipant(database.Participant{UserID: adminID, CompetitionID: competition.ID, Role: pkg.RoleToString(pkg.RAdmin), Status: "approved"})
	suite.Require().NoError(err)
	playerParticipant, err := database.CreateParticipant(database.Participant{UserID: playerID, CompetitionID: competition.ID, Role: pkg.RoleToString(pkg.RPlayer), Status: "approved"})
	suite.Require().NoError(err)

	players := make([]database.Player, 0, 5)
	for _, value := range []struct {
		name, score string
		shoot, rank int
	}{
		{"x-first", "", 0, 5}, {"tens-only", "", 0, 4}, {"pure-ten", "", 0, 3}, {"shoot-off", "", 2, 2}, {"id-tiebreak", "", 1, 1},
	} {
		player, err := database.CreatePlayer(database.Player{GroupId: group.ID, LaneId: lane.ID, ParticipantId: playerParticipant.ID, Name: value.name, TotalScore: 100, ShootOffScore: value.shoot, Rank: value.rank})
		suite.Require().NoError(err)
		players = append(players, player)
	}
	// x-first loses under the former X+10 rule (1 versus 3), but wins under
	// the required X-first rule. pure-ten verifies the next pure-ten tiebreak.
	suite.addScores(players[0].ID, 11)
	suite.addScores(players[1].ID, 10, 10, 10)
	suite.addScores(players[2].ID, 10, 10)
	_, err = database.CreatePlayer(database.Player{GroupId: group.ID, LaneId: lane.ID, ParticipantId: playerParticipant.ID, Name: "excluded", TotalScore: 999, Rank: -1})
	suite.Require().NoError(err)
	foreignPlayer, err := database.CreatePlayer(database.Player{GroupId: unassigned.ID, LaneId: unassignedLane.ID, ParticipantId: playerParticipant.ID, Name: "unassigned", TotalScore: 999, Rank: 9})
	suite.Require().NoError(err)
	return competition, group, unassigned, players, foreignPlayer.ID, suite.login(adminID), suite.login(playerID)
}

func (suite *GroupRankingIntegrationTestSuite) TestAutoAndManualRanking() {
	competition, group, unassigned, players, foreignPlayerID, adminCookies, nonAdminCookies := suite.fixture()

	recorder := suite.request(http.MethodPatch, fmt.Sprintf("/competition/refresh/groups/players/rank/%d", competition.ID), nil, nonAdminCookies)
	suite.Equal(http.StatusForbidden, recorder.Code)
	recorder = suite.request(http.MethodPatch, fmt.Sprintf("/competition/refresh/groups/players/rank/%d", competition.ID), nil, adminCookies)
	suite.Equal(http.StatusOK, recorder.Code)
	recorder = suite.request(http.MethodGet, fmt.Sprintf("/groupinfo/players/ranking/%d", group.ID), nil, nil)
	suite.Equal(http.StatusOK, recorder.Code)
	var ranking GroupRankingResponse
	suite.Require().NoError(json.Unmarshal(recorder.Body.Bytes(), &ranking))
	suite.Len(ranking.Players, 5) // excluded and unassigned players are absent.
	suite.Equal(1, ranking.Players[0].XCount)
	suite.Equal(0, ranking.Players[0].TenCount)
	suite.Equal(0, ranking.Players[1].XCount)
	suite.Equal(3, ranking.Players[1].TenCount)

	var ranked []database.Player
	suite.Require().NoError(database.DB.Where("group_id = ? AND `rank` != -1", group.ID).Order("`rank` ASC").Find(&ranked).Error)
	suite.Equal([]uint{players[0].ID, players[1].ID, players[2].ID, players[3].ID, players[4].ID}, []uint{ranked[0].ID, ranked[1].ID, ranked[2].ID, ranked[3].ID, ranked[4].ID})

	oldOrder := []uint{players[0].ID, players[1].ID, players[2].ID, players[3].ID, players[4].ID}
	newOrder := []uint{players[4].ID, players[3].ID, players[2].ID, players[1].ID, players[0].ID}
	recorder = suite.request(http.MethodPatch, fmt.Sprintf("/groupinfo/players/ranking/%d", group.ID), UpdateGroupRankingRequest{ExpectedPlayerIDs: oldOrder, PlayerIDs: newOrder}, nonAdminCookies)
	suite.Equal(http.StatusForbidden, recorder.Code)
	recorder = suite.request(http.MethodPatch, fmt.Sprintf("/groupinfo/players/ranking/%d", group.ID), UpdateGroupRankingRequest{ExpectedPlayerIDs: oldOrder, PlayerIDs: newOrder}, adminCookies)
	suite.Equal(http.StatusOK, recorder.Code)

	// Moving a player after the client GET has completed changes the locked
	// membership. The stale request must neither compact nor rewrite ranks.
	suite.Require().NoError(database.UpdatePlayerGroupId(players[0].ID, unassigned.ID))
	recorder = suite.request(http.MethodPatch, fmt.Sprintf("/groupinfo/players/ranking/%d", group.ID), UpdateGroupRankingRequest{ExpectedPlayerIDs: newOrder, PlayerIDs: newOrder}, adminCookies)
	suite.Equal(http.StatusConflict, recorder.Code)
	suite.Require().NoError(database.DB.Where("group_id = ? AND `rank` != -1", group.ID).Order("`rank` ASC").Find(&ranked).Error)
	suite.Equal(newOrder[:4], []uint{ranked[0].ID, ranked[1].ID, ranked[2].ID, ranked[3].ID})
	recorder = suite.request(http.MethodPatch, fmt.Sprintf("/groupinfo/players/ranking/%d", group.ID), UpdateGroupRankingRequest{ExpectedPlayerIDs: newOrder, PlayerIDs: []uint{players[4].ID, players[4].ID, players[2].ID, players[1].ID, players[0].ID}}, adminCookies)
	suite.Equal(http.StatusBadRequest, recorder.Code)
	recorder = suite.request(http.MethodPatch, fmt.Sprintf("/groupinfo/players/ranking/%d", group.ID), UpdateGroupRankingRequest{ExpectedPlayerIDs: newOrder, PlayerIDs: []uint{players[4].ID, players[3].ID, players[2].ID, players[1].ID, foreignPlayerID}}, adminCookies)
	suite.Equal(http.StatusBadRequest, recorder.Code)

	tieOne, err := database.CreatePlayer(database.Player{GroupId: group.ID, LaneId: players[0].LaneId, ParticipantId: players[0].ParticipantId, Name: "id-tie-one", TotalScore: 100, Rank: 9})
	suite.Require().NoError(err)
	tieTwo, err := database.CreatePlayer(database.Player{GroupId: group.ID, LaneId: players[0].LaneId, ParticipantId: players[0].ParticipantId, Name: "id-tie-two", TotalScore: 100, Rank: 9})
	suite.Require().NoError(err)
	recorder = suite.request(http.MethodPatch, fmt.Sprintf("/competition/refresh/groups/players/rank/%d", competition.ID), nil, adminCookies)
	suite.Equal(http.StatusOK, recorder.Code)
	autoOrder, err := database.GetGroupPlayerIdRankOrderById(group.ID)
	suite.Require().NoError(err)
	suite.Equal([]uint{tieOne.ID, tieTwo.ID}, []uint{autoOrder[len(autoOrder)-2].ID, autoOrder[len(autoOrder)-1].ID})
}

func (suite *GroupRankingIntegrationTestSuite) TestManualRankingRejectsMissingOrNullArrays() {
	_, group, _, _, _, adminCookies, _ := suite.fixture()
	path := fmt.Sprintf("/groupinfo/players/ranking/%d", group.ID)

	for name, body := range map[string]any{
		"missing both":  map[string]any{},
		"null expected": map[string]any{"expected_player_ids": nil, "player_ids": []uint{}},
		"null desired":  map[string]any{"expected_player_ids": []uint{}, "player_ids": nil},
	} {
		suite.Run(name, func() {
			recorder := suite.request(http.MethodPatch, path, body, adminCookies)
			suite.Equal(http.StatusBadRequest, recorder.Code)
		})
	}
}
