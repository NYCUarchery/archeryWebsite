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
	"sync"
	"testing"
	"time"

	"github.com/gin-contrib/sessions"
	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/suite"
)

// AutoPlayerSetIntegrationTestSuite uses MySQL because the handler's safety
// contract depends on SELECT ... FOR UPDATE and a real transaction.
type AutoPlayerSetIntegrationTestSuite struct {
	suite.Suite
	router      *gin.Engine
	sessionFile string
}

func TestAutoPlayerSetIntegrationTestSuite(t *testing.T) {
	if os.Getenv("ARCHERY_MYSQL_INTEGRATION") != "1" {
		t.Skip("set ARCHERY_MYSQL_INTEGRATION=1 to run destructive MySQL integration tests")
	}
	suite.Run(t, new(AutoPlayerSetIntegrationTestSuite))
}

func (suite *AutoPlayerSetIntegrationTestSuite) SetupSuite() {
	database.SetupDatabaseByMode("test")
	file, err := os.CreateTemp("", "archery-auto-playerset-session-*.yaml")
	suite.Require().NoError(err)
	suite.sessionFile = file.Name()
	suite.Require().NoError(file.Close())
	suite.Require().NoError(os.WriteFile(suite.sessionFile, []byte("SessionKey: auto-playerset-integration-test-key\n"), 0600))
}

func (suite *AutoPlayerSetIntegrationTestSuite) TearDownSuite() {
	if suite.sessionFile != "" {
		_ = os.Remove(suite.sessionFile)
	}
}

func (suite *AutoPlayerSetIntegrationTestSuite) SetupTest() {
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
	suite.router.POST("/playerset/elimination/:eliminationid/auto", AutoCreateIndividualPlayerSets)
}

func (suite *AutoPlayerSetIntegrationTestSuite) request(method, path string, body any, cookies []*http.Cookie) *httptest.ResponseRecorder {
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

func (suite *AutoPlayerSetIntegrationTestSuite) login(userID uint) []*http.Cookie {
	recorder := suite.request(http.MethodPost, fmt.Sprintf("/test/session/%d", userID), nil, nil)
	suite.Equal(http.StatusNoContent, recorder.Code)
	return recorder.Result().Cookies()
}

func (suite *AutoPlayerSetIntegrationTestSuite) fixture(teamSize, advancing int, ranks []int) (database.Elimination, []database.Player, []*http.Cookie, []*http.Cookie) {
	now := time.Now()
	competition, err := database.PostCompetition(database.Competition{Title: "auto player set integration", StartTime: now, EndTime: now.Add(time.Hour)})
	suite.Require().NoError(err)
	group, err := database.CreateGroupInfo(database.Group{CompetitionId: competition.ID, GroupName: "individual", GroupIndex: 1})
	suite.Require().NoError(err)
	// Qualification IDs intentionally match their Group IDs throughout this
	// application. Use the explicit ID in this fixture to preserve that model.
	suite.Require().NoError(database.DB.Create(&database.Qualification{ID: group.ID, AdvancingNum: advancing}).Error)
	lane, err := database.PostLane(database.Lane{CompetitionId: competition.ID, QualificationId: group.ID, LaneNumber: 1})
	suite.Require().NoError(err)
	elimination, err := database.CreateElimination(database.Elimination{GroupId: group.ID, TeamSize: teamSize})
	suite.Require().NoError(err)

	adminUserID, nonAdminUserID := uint(95001), uint(95002)
	adminParticipant, err := database.CreateParticipant(database.Participant{UserID: adminUserID, CompetitionID: competition.ID, Role: pkg.RoleToString(pkg.RAdmin), Status: "approved"})
	suite.Require().NoError(err)
	_, err = database.CreateParticipant(database.Participant{UserID: nonAdminUserID, CompetitionID: competition.ID, Role: pkg.RoleToString(pkg.RPlayer), Status: "approved"})
	suite.Require().NoError(err)

	players := make([]database.Player, len(ranks))
	for index, rank := range ranks {
		player, err := database.CreatePlayer(database.Player{GroupId: group.ID, LaneId: lane.ID, ParticipantId: adminParticipant.ID, Name: fmt.Sprintf("player-%d", index+1), TotalScore: 1000 - index, Rank: rank})
		suite.Require().NoError(err)
		players[index] = player
	}
	return elimination, players, suite.login(adminUserID), suite.login(nonAdminUserID)
}

func (suite *AutoPlayerSetIntegrationTestSuite) auto(eliminationID uint, body any, cookies []*http.Cookie) (*httptest.ResponseRecorder, AutoCreatePlayerSetsResponse) {
	recorder := suite.request(http.MethodPost, fmt.Sprintf("/playerset/elimination/%d/auto", eliminationID), body, cookies)
	var response AutoCreatePlayerSetsResponse
	if recorder.Code == http.StatusOK {
		suite.Require().NoError(json.Unmarshal(recorder.Body.Bytes(), &response))
	}
	return recorder, response
}

func (suite *AutoPlayerSetIntegrationTestSuite) errorMessage(recorder *httptest.ResponseRecorder) string {
	var response struct {
		Error string `json:"error"`
	}
	suite.Require().NoError(json.Unmarshal(recorder.Body.Bytes(), &response))
	return response.Error
}

func (suite *AutoPlayerSetIntegrationTestSuite) TestAutoCreatesRanksAndSafelyReusesExistingSets() {
	elimination, players, adminCookies, _ := suite.fixture(1, 4, []int{1, 2, 3, 4, 5, -1})
	recorder, created := suite.auto(elimination.ID, nil, adminCookies)
	suite.Equal(http.StatusOK, recorder.Code, recorder.Body.String())
	suite.Equal(4, created.RequestedCount)
	suite.Equal(4, created.CreatedCount)
	suite.Zero(created.ReusedCount)
	suite.Len(created.PlayerSets, 4)
	for index, playerSet := range created.PlayerSets {
		suite.Equal(players[index].ID, suite.playerID(playerSet.ID))
		suite.Equal(index+1, playerSet.Rank)
		suite.Equal(players[index].Name, playerSet.SetName)
		suite.Equal(players[index].TotalScore, playerSet.TotalScore)
	}

	// A retry is idempotent and refreshes derived display fields in place.
	suite.Require().NoError(database.DB.Model(&database.Player{}).Where("id = ?", players[0].ID).Updates(map[string]interface{}{"name": "renamed", "total_score": 42}).Error)
	recorder, reused := suite.auto(elimination.ID, nil, adminCookies)
	suite.Equal(http.StatusOK, recorder.Code, recorder.Body.String())
	suite.Zero(reused.CreatedCount)
	suite.Equal(4, reused.ReusedCount)
	suite.Equal("renamed", reused.PlayerSets[0].SetName)
	suite.Equal(42, reused.PlayerSets[0].TotalScore)

	// Expanding the selection adds only the newly included fifth player.
	recorder, expanded := suite.auto(elimination.ID, map[string]int{"count": 5}, adminCookies)
	suite.Equal(http.StatusOK, recorder.Code, recorder.Body.String())
	suite.Equal(1, expanded.CreatedCount)
	suite.Equal(4, expanded.ReusedCount)
}

func (suite *AutoPlayerSetIntegrationTestSuite) TestAutoRejectsUnauthorizedInvalidAndConflictingState() {
	elimination, players, adminCookies, nonAdminCookies := suite.fixture(1, 4, []int{1, 2, 3, 4, 5})
	recorder, _ := suite.auto(elimination.ID, nil, nil)
	suite.Equal(http.StatusForbidden, recorder.Code)
	recorder, _ = suite.auto(elimination.ID, nil, nonAdminCookies)
	suite.Equal(http.StatusForbidden, recorder.Code)
	recorder, _ = suite.auto(elimination.ID, map[string]int{"count": 3}, adminCookies)
	suite.Equal(http.StatusBadRequest, recorder.Code)
	suite.Equal(errAutoPlayerSetsInvalidCount.Error(), suite.errorMessage(recorder))
	recorder, _ = suite.auto(elimination.ID, map[string]int{"count": 6}, adminCookies)
	suite.Equal(http.StatusBadRequest, recorder.Code)
	suite.Equal(errAutoPlayerSetsInvalidCount.Error(), suite.errorMessage(recorder))

	// A set for a player outside the requested top four must not be silently
	// discarded, and the rejected transaction must not create any new sets.
	outside, err := database.CreatePlayerSet(database.PlayerSet{EliminationId: elimination.ID, Rank: 5, SetName: "outside"})
	suite.Require().NoError(err)
	_, err = database.CreatePlayerSetMatchTable(database.PlayerSetMatchTable{PlayerSetId: outside.ID, PlayerId: players[4].ID})
	suite.Require().NoError(err)
	recorder, _ = suite.auto(elimination.ID, nil, adminCookies)
	suite.Equal(http.StatusConflict, recorder.Code)
	var setCount int64
	suite.Require().NoError(database.DB.Model(&database.PlayerSet{}).Where("elimination_id = ?", elimination.ID).Count(&setCount).Error)
	suite.EqualValues(1, setCount)

	staged, _, stagedAdmin, _ := suite.fixture(1, 4, []int{1, 2, 3, 4})
	_, err = database.CreateStage(database.Stage{EliminationId: staged.ID})
	suite.Require().NoError(err)
	recorder, _ = suite.auto(staged.ID, nil, stagedAdmin)
	suite.Equal(http.StatusConflict, recorder.Code)

	team, _, teamAdmin, _ := suite.fixture(2, 4, []int{1, 2, 3, 4})
	recorder, _ = suite.auto(team.ID, nil, teamAdmin)
	suite.Equal(http.StatusBadRequest, recorder.Code)
	suite.Equal(errAutoPlayerSetsTeamSize.Error(), suite.errorMessage(recorder))
}

func (suite *AutoPlayerSetIntegrationTestSuite) TestAutoValidatesQualificationAndSavedRanks() {
	rankGap, _, rankGapAdmin, _ := suite.fixture(1, 4, []int{1, 2, 4, 5})
	recorder, _ := suite.auto(rankGap.ID, nil, rankGapAdmin)
	suite.Equal(http.StatusBadRequest, recorder.Code)
	suite.Equal(errAutoPlayerSetsInvalidRanks.Error(), suite.errorMessage(recorder))
	suite.assertPlayerSetCount(rankGap.ID, 0)

	invalidAdvancing, _, invalidAdvancingAdmin, _ := suite.fixture(1, 3, []int{1, 2, 3, 4})
	recorder, _ = suite.auto(invalidAdvancing.ID, nil, invalidAdvancingAdmin)
	suite.Equal(http.StatusBadRequest, recorder.Code)
	suite.Equal(errAutoPlayerSetsInvalidAdvancingNum.Error(), suite.errorMessage(recorder))
	suite.assertPlayerSetCount(invalidAdvancing.ID, 0)
	// Explicit Count deliberately overrides an invalid qualification default.
	recorder, overridden := suite.auto(invalidAdvancing.ID, map[string]int{"count": 4}, invalidAdvancingAdmin)
	suite.Equal(http.StatusOK, recorder.Code, recorder.Body.String())
	suite.Equal(4, overridden.CreatedCount)

	missingQualification, _, missingQualificationAdmin, _ := suite.fixture(1, 4, []int{1, 2, 3, 4})
	// The production schema enforces Qualification -> Lane -> Player foreign
	// keys, so remove the dependent fixture rows before exercising the missing
	// qualification validation path.
	suite.Require().NoError(database.DB.Where("group_id = ?", missingQualification.GroupId).Delete(&database.Player{}).Error)
	suite.Require().NoError(database.DB.Where("qualification_id = ?", missingQualification.GroupId).Delete(&database.Lane{}).Error)
	suite.Require().NoError(database.DB.Delete(&database.Qualification{}, missingQualification.GroupId).Error)
	recorder, _ = suite.auto(missingQualification.ID, nil, missingQualificationAdmin)
	suite.Equal(http.StatusBadRequest, recorder.Code)
	suite.Equal(errAutoPlayerSetsQualificationMissing.Error(), suite.errorMessage(recorder))
}

func (suite *AutoPlayerSetIntegrationTestSuite) TestAutoCompletesValidSubsetAndRollsBackMalformedSets() {
	elimination, players, adminCookies, _ := suite.fixture(1, 4, []int{1, 2, 3, 4})
	first, err := database.CreatePlayerSet(database.PlayerSet{EliminationId: elimination.ID, Rank: 99, SetName: "stale", TotalScore: -1})
	suite.Require().NoError(err)
	_, err = database.CreatePlayerSetMatchTable(database.PlayerSetMatchTable{PlayerSetId: first.ID, PlayerId: players[0].ID})
	suite.Require().NoError(err)
	recorder, result := suite.auto(elimination.ID, nil, adminCookies)
	suite.Equal(http.StatusOK, recorder.Code, recorder.Body.String())
	suite.Equal(3, result.CreatedCount)
	suite.Equal(1, result.ReusedCount)
	suite.Equal(first.ID, result.PlayerSets[0].ID)
	suite.Equal(1, result.PlayerSets[0].Rank)
	suite.Equal(players[0].Name, result.PlayerSets[0].SetName)
	suite.Equal(players[0].TotalScore, result.PlayerSets[0].TotalScore)

	for _, malformed := range []struct {
		name  string
		links []int
	}{
		{name: "empty", links: nil},
		{name: "multiple players", links: []int{0, 1}},
		{name: "duplicate player", links: []int{0}},
	} {
		suite.Run(malformed.name, func() {
			conflict, conflictPlayers, conflictAdmin, _ := suite.fixture(1, 4, []int{1, 2, 3, 4})
			firstSet, err := database.CreatePlayerSet(database.PlayerSet{EliminationId: conflict.ID, SetName: "malformed-1"})
			suite.Require().NoError(err)
			for _, playerIndex := range malformed.links {
				_, err = database.CreatePlayerSetMatchTable(database.PlayerSetMatchTable{PlayerSetId: firstSet.ID, PlayerId: conflictPlayers[playerIndex].ID})
				suite.Require().NoError(err)
			}
			if malformed.name == "duplicate player" {
				secondSet, err := database.CreatePlayerSet(database.PlayerSet{EliminationId: conflict.ID, SetName: "malformed-2"})
				suite.Require().NoError(err)
				_, err = database.CreatePlayerSetMatchTable(database.PlayerSetMatchTable{PlayerSetId: secondSet.ID, PlayerId: conflictPlayers[0].ID})
				suite.Require().NoError(err)
			}

			recorder, _ := suite.auto(conflict.ID, nil, conflictAdmin)
			suite.Equal(http.StatusConflict, recorder.Code)
			suite.Equal(errAutoPlayerSetsConflict.Error(), suite.errorMessage(recorder))
			// The handler must not add the missing three or four valid sets once
			// it has detected malformed existing state.
			wantSets := int64(1)
			if malformed.name == "duplicate player" {
				wantSets = 2
			}
			suite.assertPlayerSetCount(conflict.ID, wantSets)
		})
	}
}

func (suite *AutoPlayerSetIntegrationTestSuite) TestAutoConcurrentRequestsDoNotDuplicateSets() {
	elimination, _, adminCookies, _ := suite.fixture(1, 4, []int{1, 2, 3, 4})
	start := make(chan struct{})
	responses := make(chan *httptest.ResponseRecorder, 2)
	var waitGroup sync.WaitGroup
	for index := 0; index < 2; index++ {
		waitGroup.Add(1)
		go func() {
			defer waitGroup.Done()
			<-start
			responses <- suite.request(http.MethodPost, fmt.Sprintf("/playerset/elimination/%d/auto", elimination.ID), nil, adminCookies)
		}()
	}
	close(start)
	waitGroup.Wait()
	close(responses)

	created := 0
	for recorder := range responses {
		suite.Equal(http.StatusOK, recorder.Code, recorder.Body.String())
		var response AutoCreatePlayerSetsResponse
		suite.Require().NoError(json.Unmarshal(recorder.Body.Bytes(), &response))
		created += response.CreatedCount
	}
	suite.Equal(4, created)
	var setCount, linkCount int64
	suite.Require().NoError(database.DB.Model(&database.PlayerSet{}).Where("elimination_id = ?", elimination.ID).Count(&setCount).Error)
	suite.Require().NoError(database.DB.Model(&database.PlayerSetMatchTable{}).
		Joins("JOIN player_sets ON player_sets.id = player_set_match_tables.player_set_id").
		Where("player_sets.elimination_id = ?", elimination.ID).Count(&linkCount).Error)
	suite.EqualValues(4, setCount)
	suite.EqualValues(4, linkCount)
}

func (suite *AutoPlayerSetIntegrationTestSuite) playerID(playerSetID uint) uint {
	var link database.PlayerSetMatchTable
	suite.Require().NoError(database.DB.Where("player_set_id = ?", playerSetID).Take(&link).Error)
	return link.PlayerId
}

func (suite *AutoPlayerSetIntegrationTestSuite) assertPlayerSetCount(eliminationID uint, want int64) {
	var count int64
	suite.Require().NoError(database.DB.Model(&database.PlayerSet{}).Where("elimination_id = ?", eliminationID).Count(&count).Error)
	suite.Equal(want, count)
}
