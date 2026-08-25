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
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

// PlayerSetRankingIntegrationTestSuite uses MySQL because the ranking
// projection is a real SQL aggregation (member scores must be summed per
// player before being joined into the team total) and because staleness
// detection, the bracket-mutation lock, and the concurrent-init race below
// all depend on SELECT ... FOR UPDATE and real transactions.
type PlayerSetRankingIntegrationTestSuite struct {
	suite.Suite
	router        *gin.Engine
	sessionFile   string
	userIDCounter uint
}

func TestPlayerSetRankingIntegrationTestSuite(t *testing.T) {
	if os.Getenv("ARCHERY_MYSQL_INTEGRATION") != "1" {
		t.Skip("set ARCHERY_MYSQL_INTEGRATION=1 to run destructive MySQL integration tests")
	}
	suite.Run(t, new(PlayerSetRankingIntegrationTestSuite))
}

func (suite *PlayerSetRankingIntegrationTestSuite) SetupSuite() {
	database.SetupDatabaseByMode("test")
	file, err := os.CreateTemp("", "archery-playerset-ranking-session-*.yaml")
	suite.Require().NoError(err)
	suite.sessionFile = file.Name()
	suite.Require().NoError(file.Close())
	suite.Require().NoError(os.WriteFile(suite.sessionFile, []byte("SessionKey: playerset-ranking-integration-test-key\n"), 0600))
}

func (suite *PlayerSetRankingIntegrationTestSuite) TearDownSuite() {
	if suite.sessionFile != "" {
		_ = os.Remove(suite.sessionFile)
	}
}

func (suite *PlayerSetRankingIntegrationTestSuite) SetupTest() {
	database.TestDBRestore()
	suite.userIDCounter = 96000
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
	suite.router.GET("/playerset/elimination/:eliminationid/ranking", GetPlayerSetRanking)
	suite.router.PATCH("/playerset/elimination/:eliminationid/ranking/auto", AutoRankPlayerSetsByEliminationId)
	suite.router.PATCH("/playerset/elimination/:eliminationid/ranking", UpdatePlayerSetRankingByEliminationId)
	suite.router.PATCH("/playerset/preranking/:eliminationid", PutPlayerSetPreRankingByEliminationId)
}

func (suite *PlayerSetRankingIntegrationTestSuite) request(method, path string, body any, cookies []*http.Cookie) *httptest.ResponseRecorder {
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

func (suite *PlayerSetRankingIntegrationTestSuite) login(userID uint) []*http.Cookie {
	recorder := suite.request(http.MethodPost, fmt.Sprintf("/test/session/%d", userID), nil, nil)
	suite.Equal(http.StatusNoContent, recorder.Code)
	return recorder.Result().Cookies()
}

func (suite *PlayerSetRankingIntegrationTestSuite) nextUserID() uint {
	suite.userIDCounter++
	return suite.userIDCounter
}

// newElimination builds a fresh competition, group/qualification, lane, and
// individual (team_size 1) elimination, plus a competition Admin and a
// non-admin Player participant. Callers needing team_size 2 or 3 pass it
// explicitly.
func (suite *PlayerSetRankingIntegrationTestSuite) newElimination(teamSize int) (database.Elimination, database.Group, database.Lane, uint, []*http.Cookie, []*http.Cookie) {
	now := time.Now()
	competition, err := database.PostCompetition(database.Competition{Title: "playerset ranking integration", StartTime: now, EndTime: now.Add(time.Hour)})
	suite.Require().NoError(err)
	group, err := database.CreateGroupInfo(database.Group{CompetitionId: competition.ID, GroupName: "ranking", GroupIndex: 1})
	suite.Require().NoError(err)
	// Qualification IDs intentionally match their Group IDs throughout this
	// application; see playerset_auto_integration_test.go.
	suite.Require().NoError(database.DB.Create(&database.Qualification{ID: group.ID}).Error)
	lane, err := database.PostLane(database.Lane{CompetitionId: competition.ID, QualificationId: group.ID, LaneNumber: 1})
	suite.Require().NoError(err)
	elimination, err := database.CreateElimination(database.Elimination{GroupId: group.ID, TeamSize: teamSize})
	suite.Require().NoError(err)

	adminUserID := suite.nextUserID()
	nonAdminUserID := suite.nextUserID()
	adminParticipant, err := database.CreateParticipant(database.Participant{UserID: adminUserID, CompetitionID: competition.ID, Role: pkg.RoleToString(pkg.RAdmin), Status: "approved"})
	suite.Require().NoError(err)
	_, err = database.CreateParticipant(database.Participant{UserID: nonAdminUserID, CompetitionID: competition.ID, Role: pkg.RoleToString(pkg.RPlayer), Status: "approved"})
	suite.Require().NoError(err)

	return elimination, group, lane, adminParticipant.ID, suite.login(adminUserID), suite.login(nonAdminUserID)
}

func (suite *PlayerSetRankingIntegrationTestSuite) createPlayer(groupID, laneID, participantID uint, totalScore int) database.Player {
	player, err := database.CreatePlayer(database.Player{GroupId: groupID, LaneId: laneID, ParticipantId: participantID, Name: fmt.Sprintf("player-%d", suite.nextUserID()), TotalScore: totalScore})
	suite.Require().NoError(err)
	return player
}

func (suite *PlayerSetRankingIntegrationTestSuite) createSet(eliminationID uint, rank int, setName string, playerIDs ...uint) database.PlayerSet {
	playerSet, err := database.CreatePlayerSet(database.PlayerSet{EliminationId: eliminationID, Rank: rank, SetName: setName})
	suite.Require().NoError(err)
	for _, playerID := range playerIDs {
		_, err := database.CreatePlayerSetMatchTable(database.PlayerSetMatchTable{PlayerSetId: playerSet.ID, PlayerId: playerID})
		suite.Require().NoError(err)
	}
	return playerSet
}

// singlePlayerSet creates one player with the given total_score and RoundEnd
// data (each entry of ends is one RoundEnd's arrow scores; every end belongs
// to the same Round), then wraps it in a one-player PlayerSet.
func (suite *PlayerSetRankingIntegrationTestSuite) singlePlayerSet(eliminationID, groupID, laneID, participantID uint, name string, totalScore int, ends [][]int) database.PlayerSet {
	player := suite.createPlayer(groupID, laneID, participantID, totalScore)
	if len(ends) > 0 {
		suite.addRound(player.ID, ends...)
	}
	return suite.createSet(eliminationID, 0, name, player.ID)
}

// addRound creates one new Round for playerID with one RoundEnd (and its
// RoundScore rows) per entry of ends. Calling this more than once per player
// creates multiple Rounds, which is deliberately used to prove the ranking
// aggregation does not inflate players.total_score via the round_scores join.
func (suite *PlayerSetRankingIntegrationTestSuite) addRound(playerID uint, ends ...[]int) {
	round, err := database.CreateRound(database.Round{PlayerId: playerID})
	suite.Require().NoError(err)
	for _, scores := range ends {
		end, err := database.CreateRoundEnd(database.RoundEnd{RoundId: round.ID})
		suite.Require().NoError(err)
		for _, score := range scores {
			_, err := database.CreateRoundScore(database.RoundScore{RoundEndId: end.ID, Score: score})
			suite.Require().NoError(err)
		}
	}
}

func (suite *PlayerSetRankingIntegrationTestSuite) getRanking(eliminationID uint, cookies []*http.Cookie) (*httptest.ResponseRecorder, PlayerSetRankingResponse) {
	recorder := suite.request(http.MethodGet, fmt.Sprintf("/playerset/elimination/%d/ranking", eliminationID), nil, cookies)
	var response PlayerSetRankingResponse
	if recorder.Code == http.StatusOK {
		suite.Require().NoError(json.Unmarshal(recorder.Body.Bytes(), &response))
	}
	return recorder, response
}

func (suite *PlayerSetRankingIntegrationTestSuite) autoRank(eliminationID uint, cookies []*http.Cookie) (*httptest.ResponseRecorder, PlayerSetRankingResponse) {
	recorder := suite.request(http.MethodPatch, fmt.Sprintf("/playerset/elimination/%d/ranking/auto", eliminationID), nil, cookies)
	var response PlayerSetRankingResponse
	if recorder.Code == http.StatusOK {
		suite.Require().NoError(json.Unmarshal(recorder.Body.Bytes(), &response))
	}
	return recorder, response
}

func (suite *PlayerSetRankingIntegrationTestSuite) reorder(eliminationID uint, body UpdatePlayerSetRankingRequest, cookies []*http.Cookie) (*httptest.ResponseRecorder, PlayerSetRankingResponse) {
	recorder := suite.request(http.MethodPatch, fmt.Sprintf("/playerset/elimination/%d/ranking", eliminationID), body, cookies)
	var response PlayerSetRankingResponse
	if recorder.Code == http.StatusOK {
		suite.Require().NoError(json.Unmarshal(recorder.Body.Bytes(), &response))
	}
	return recorder, response
}

func (suite *PlayerSetRankingIntegrationTestSuite) preranking(eliminationID uint, cookies []*http.Cookie) *httptest.ResponseRecorder {
	return suite.request(http.MethodPatch, fmt.Sprintf("/playerset/preranking/%d", eliminationID), nil, cookies)
}

func (suite *PlayerSetRankingIntegrationTestSuite) currentRanks(eliminationID uint) map[uint]int {
	var sets []database.PlayerSet
	suite.Require().NoError(database.DB.Where("elimination_id = ?", eliminationID).Find(&sets).Error)
	ranks := make(map[uint]int, len(sets))
	for _, set := range sets {
		ranks[set.ID] = set.Rank
	}
	return ranks
}

func rankingByID(rankings []database.PlayerSetRanking, id uint) database.PlayerSetRanking {
	for _, ranking := range rankings {
		if ranking.ID == id {
			return ranking
		}
	}
	return database.PlayerSetRanking{}
}

// TestGetRankingAggregatesTeamsAndSeparatesXFromTen covers cases 1, 2 and 3:
// team totals/X/ten counts for team_size 1, 2 and 3, a player with multiple
// Rounds proving the aggregation is not inflated by a naive join, X excluded
// from ten_count, and PlayerSets with no scores or no linked player at all
// still appearing with zeroed counts.
func (suite *PlayerSetRankingIntegrationTestSuite) TestGetRankingAggregatesTeamsAndSeparatesXFromTen() {
	elimination1, group1, lane1, participant1, admin1, _ := suite.newElimination(1)
	soloPlayer := suite.createPlayer(group1.ID, lane1.ID, participant1, 155)
	// Two separate Rounds (5 RoundEnds, 9 RoundScore rows total) linked to a
	// single PlayerSet: a naive join would multiply players.total_score by the
	// number of round_scores rows instead of summing it once per player.
	suite.addRound(soloPlayer.ID, []int{11, 10, 9}, []int{10, 10, 8})
	suite.addRound(soloPlayer.ID, []int{11, 11, 7})
	soloSet := suite.createSet(elimination1.ID, 1, "solo", soloPlayer.ID)
	noRoundsPlayer := suite.createPlayer(group1.ID, lane1.ID, participant1, 42)
	emptyMemberSet := suite.createSet(elimination1.ID, 2, "no-rounds", noRoundsPlayer.ID)
	noPlayerSet := suite.createSet(elimination1.ID, 3, "no-player")

	recorder, response := suite.getRanking(elimination1.ID, admin1)
	suite.Equal(http.StatusOK, recorder.Code, recorder.Body.String())
	suite.Len(response.PlayerSets, 3)

	solo := rankingByID(response.PlayerSets, soloSet.ID)
	suite.Equal(155, solo.TotalScore) // not inflated by the 9 round_scores rows
	suite.Equal(3, solo.XCount)       // 1 (round 1) + 2 (round 2)
	suite.Equal(3, solo.TenCount)     // 1 + 2, and none of the 3 Xs counted here

	noRounds := rankingByID(response.PlayerSets, emptyMemberSet.ID)
	suite.Equal(42, noRounds.TotalScore)
	suite.Zero(noRounds.XCount)
	suite.Zero(noRounds.TenCount)

	noPlayer := rankingByID(response.PlayerSets, noPlayerSet.ID)
	suite.Zero(noPlayer.TotalScore)
	suite.Zero(noPlayer.XCount)
	suite.Zero(noPlayer.TenCount)

	// Team size 2: the team total is the SUM of each member's players.total_score.
	elimination2, group2, lane2, participant2, admin2, _ := suite.newElimination(2)
	memberA := suite.createPlayer(group2.ID, lane2.ID, participant2, 120)
	suite.addRound(memberA.ID, []int{11, 9, 8})
	memberB := suite.createPlayer(group2.ID, lane2.ID, participant2, 130)
	suite.addRound(memberB.ID, []int{11, 11, 10})
	teamSet2 := suite.createSet(elimination2.ID, 1, "duo", memberA.ID, memberB.ID)

	recorder, response = suite.getRanking(elimination2.ID, admin2)
	suite.Equal(http.StatusOK, recorder.Code, recorder.Body.String())
	duo := rankingByID(response.PlayerSets, teamSet2.ID)
	suite.Equal(250, duo.TotalScore)
	suite.Equal(3, duo.XCount)
	suite.Equal(1, duo.TenCount)

	// Team size 3.
	elimination3, group3, lane3, participant3, admin3, _ := suite.newElimination(3)
	trioA := suite.createPlayer(group3.ID, lane3.ID, participant3, 50)
	suite.addRound(trioA.ID, []int{11})
	trioB := suite.createPlayer(group3.ID, lane3.ID, participant3, 60)
	suite.addRound(trioB.ID, []int{10})
	trioC := suite.createPlayer(group3.ID, lane3.ID, participant3, 70)
	suite.addRound(trioC.ID, []int{11, 10})
	teamSet3 := suite.createSet(elimination3.ID, 1, "trio", trioA.ID, trioB.ID, trioC.ID)

	recorder, response = suite.getRanking(elimination3.ID, admin3)
	suite.Equal(http.StatusOK, recorder.Code, recorder.Body.String())
	trio := rankingByID(response.PlayerSets, teamSet3.ID)
	suite.Equal(180, trio.TotalScore)
	suite.Equal(2, trio.XCount)
	suite.Equal(2, trio.TenCount)
}

// TestAutoRankTieBreakOrderAndPersistsContiguousRanks covers cases 4 and 5:
// every level of the total_score/x_count/ten_count/id tie-break, contiguous
// rank 1..N persistence, and player_sets.total_score being synced to the
// computed team total.
func (suite *PlayerSetRankingIntegrationTestSuite) TestAutoRankTieBreakOrderAndPersistsContiguousRanks() {
	elimination, group, lane, participant, admin, _ := suite.newElimination(1)

	highest := suite.singlePlayerSet(elimination.ID, group.ID, lane.ID, participant, "highest", 400, nil)
	// Same total_score, decided by x_count.
	xWinner := suite.singlePlayerSet(elimination.ID, group.ID, lane.ID, participant, "x-winner", 300, [][]int{{11, 11, 11, 11, 11}})
	xLoser := suite.singlePlayerSet(elimination.ID, group.ID, lane.ID, participant, "x-loser", 300, [][]int{{11, 11, 9, 9, 9}})
	// Same total_score and x_count, decided by ten_count.
	tenWinner := suite.singlePlayerSet(elimination.ID, group.ID, lane.ID, participant, "ten-winner", 200, [][]int{{11, 11, 11, 10, 10, 10, 10, 10}})
	tenLoser := suite.singlePlayerSet(elimination.ID, group.ID, lane.ID, participant, "ten-loser", 200, [][]int{{11, 11, 11, 10, 10, 9, 9, 9}})
	// Full tie, decided only by player_sets.id (idFirst is created first).
	idFirst := suite.singlePlayerSet(elimination.ID, group.ID, lane.ID, participant, "id-first", 100, [][]int{{11, 10}})
	idSecond := suite.singlePlayerSet(elimination.ID, group.ID, lane.ID, participant, "id-second", 100, [][]int{{11, 10}})

	recorder, response := suite.autoRank(elimination.ID, admin)
	suite.Equal(http.StatusOK, recorder.Code, recorder.Body.String())

	gotIDs := make([]uint, len(response.PlayerSets))
	for index, playerSet := range response.PlayerSets {
		gotIDs[index] = playerSet.ID
		suite.Equal(index+1, playerSet.Rank)
	}
	suite.Equal([]uint{highest.ID, xWinner.ID, xLoser.ID, tenWinner.ID, tenLoser.ID, idFirst.ID, idSecond.ID}, gotIDs)

	var persisted []database.PlayerSet
	suite.Require().NoError(database.DB.Where("elimination_id = ?", elimination.ID).Order("`rank` asc").Find(&persisted).Error)
	suite.Require().Len(persisted, 7)
	for index, playerSet := range persisted {
		suite.Equal(index+1, playerSet.Rank)
	}

	var refreshedXWinner database.PlayerSet
	suite.Require().NoError(database.DB.First(&refreshedXWinner, xWinner.ID).Error)
	suite.Equal(300, refreshedXWinner.TotalScore)
}

// TestManualReorderPersistsValidPermutationAndRejectsInvalidBodies covers
// case 6 (including the player_sets.total_score sync) and the
// failure-atomicity half of case 10 for malformed bodies, including a
// permutation-valid request whose 400 can only come from the
// elimination-ownership check.
func (suite *PlayerSetRankingIntegrationTestSuite) TestManualReorderPersistsValidPermutationAndRejectsInvalidBodies() {
	elimination, group, lane, participant, admin, _ := suite.newElimination(1)
	other, otherGroup, otherLane, otherParticipant, _, _ := suite.newElimination(1)

	setA := suite.singlePlayerSet(elimination.ID, group.ID, lane.ID, participant, "a", 100, nil)
	setB := suite.singlePlayerSet(elimination.ID, group.ID, lane.ID, participant, "b", 90, nil)
	setC := suite.singlePlayerSet(elimination.ID, group.ID, lane.ID, participant, "c", 80, nil)
	setD := suite.singlePlayerSet(elimination.ID, group.ID, lane.ID, participant, "d", 70, nil)
	foreignSet := suite.singlePlayerSet(other.ID, otherGroup.ID, otherLane.ID, otherParticipant, "foreign", 1, nil)

	recorder, initial := suite.getRanking(elimination.ID, admin)
	suite.Equal(http.StatusOK, recorder.Code)
	oldOrder := make([]uint, len(initial.PlayerSets))
	for index, playerSet := range initial.PlayerSets {
		oldOrder[index] = playerSet.ID
	}
	suite.ElementsMatch([]uint{setA.ID, setB.ID, setC.ID, setD.ID}, oldOrder)

	newOrder := []uint{setD.ID, setC.ID, setB.ID, setA.ID}
	recorder, updated := suite.reorder(elimination.ID, UpdatePlayerSetRankingRequest{ExpectedPlayerSetIDs: oldOrder, PlayerSetIDs: newOrder}, admin)
	suite.Equal(http.StatusOK, recorder.Code, recorder.Body.String())
	for index, playerSet := range updated.PlayerSets {
		suite.Equal(newOrder[index], playerSet.ID)
		suite.Equal(index+1, playerSet.Rank)
	}
	persistedRanks := suite.currentRanks(elimination.ID)
	for index, id := range newOrder {
		suite.Equal(index+1, persistedRanks[id])
	}

	// A successful manual reorder must also sync player_sets.total_score to
	// each set's computed team total, matching the auto-rank path.
	var persistedSets []database.PlayerSet
	suite.Require().NoError(database.DB.Where("elimination_id = ?", elimination.ID).Find(&persistedSets).Error)
	expectedTotals := map[uint]int{setA.ID: 100, setB.ID: 90, setC.ID: 80, setD.ID: 70}
	for _, playerSet := range persistedSets {
		suite.Equal(expectedTotals[playerSet.ID], playerSet.TotalScore)
	}

	// Duplicate ID in the desired list.
	recorder, _ = suite.reorder(elimination.ID, UpdatePlayerSetRankingRequest{ExpectedPlayerSetIDs: newOrder, PlayerSetIDs: []uint{setD.ID, setD.ID, setB.ID, setA.ID}}, admin)
	suite.Equal(http.StatusBadRequest, recorder.Code)
	suite.Equal(persistedRanks, suite.currentRanks(elimination.ID))

	// Missing ID: an incomplete permutation.
	recorder, _ = suite.reorder(elimination.ID, UpdatePlayerSetRankingRequest{ExpectedPlayerSetIDs: newOrder, PlayerSetIDs: []uint{setD.ID, setC.ID, setB.ID}}, admin)
	suite.Equal(http.StatusBadRequest, recorder.Code)
	suite.Equal(persistedRanks, suite.currentRanks(elimination.ID))

	// An ID belonging to another elimination's PlayerSet. foreignSet.ID
	// replaces setA.ID in BOTH lists so the request is a valid permutation of
	// itself and passes the pre-transaction samePlayerIDs(expected, desired)
	// check; the 400 must therefore come from the elimination-ownership check
	// inside the transaction, not the permutation check.
	foreignExpected := []uint{foreignSet.ID, setC.ID, setB.ID, setD.ID}
	foreignDesired := []uint{setD.ID, setC.ID, setB.ID, foreignSet.ID}
	recorder, _ = suite.reorder(elimination.ID, UpdatePlayerSetRankingRequest{ExpectedPlayerSetIDs: foreignExpected, PlayerSetIDs: foreignDesired}, admin)
	suite.Equal(http.StatusBadRequest, recorder.Code)
	suite.Equal(persistedRanks, suite.currentRanks(elimination.ID))
}

// TestManualReorderRejectsStaleSnapshot covers case 7 and the 409 half of
// case 10: an order change, a set added directly, and a set deleted directly
// after the client's GET must all be rejected as stale (409), not malformed
// (400), leaving ranks untouched.
func (suite *PlayerSetRankingIntegrationTestSuite) TestManualReorderRejectsStaleSnapshot() {
	elimination, group, lane, participant, admin, _ := suite.newElimination(1)
	suite.singlePlayerSet(elimination.ID, group.ID, lane.ID, participant, "a", 100, nil)
	suite.singlePlayerSet(elimination.ID, group.ID, lane.ID, participant, "b", 90, nil)
	suite.singlePlayerSet(elimination.ID, group.ID, lane.ID, participant, "c", 80, nil)
	suite.singlePlayerSet(elimination.ID, group.ID, lane.ID, participant, "d", 70, nil)

	recorder, snapshot := suite.getRanking(elimination.ID, admin)
	suite.Equal(http.StatusOK, recorder.Code)
	staleOrder := make([]uint, len(snapshot.PlayerSets))
	for index, playerSet := range snapshot.PlayerSets {
		staleOrder[index] = playerSet.ID
	}

	// Someone else reorders first; the caller's snapshot is now stale.
	reversed := []uint{staleOrder[3], staleOrder[2], staleOrder[1], staleOrder[0]}
	recorder, _ = suite.reorder(elimination.ID, UpdatePlayerSetRankingRequest{ExpectedPlayerSetIDs: staleOrder, PlayerSetIDs: reversed}, admin)
	suite.Equal(http.StatusOK, recorder.Code, recorder.Body.String())
	afterFirstReorder := suite.currentRanks(elimination.ID)

	recorder, _ = suite.reorder(elimination.ID, UpdatePlayerSetRankingRequest{ExpectedPlayerSetIDs: staleOrder, PlayerSetIDs: staleOrder}, admin)
	suite.Equal(http.StatusConflict, recorder.Code)
	suite.Equal(afterFirstReorder, suite.currentRanks(elimination.ID))

	// Membership changes underneath the caller (a set is added directly).
	_, err := database.CreatePlayerSet(database.PlayerSet{EliminationId: elimination.ID, Rank: 5, SetName: "e"})
	suite.Require().NoError(err)
	beforeMembershipChange := suite.currentRanks(elimination.ID)
	recorder, _ = suite.reorder(elimination.ID, UpdatePlayerSetRankingRequest{ExpectedPlayerSetIDs: reversed, PlayerSetIDs: reversed}, admin)
	suite.Equal(http.StatusConflict, recorder.Code)
	suite.Equal(beforeMembershipChange, suite.currentRanks(elimination.ID))

	// A player set is deleted directly (concurrently) after the caller loads
	// a fresh, valid snapshot: a missing ID here is a staleness problem
	// (ErrStalePlayerSetRankingOrder), not a malformed permutation, so it
	// must return 409, not 400, and the surviving ranks must be untouched.
	recorder, currentSnapshot := suite.getRanking(elimination.ID, admin)
	suite.Equal(http.StatusOK, recorder.Code)
	validOrder := make([]uint, len(currentSnapshot.PlayerSets))
	for index, playerSet := range currentSnapshot.PlayerSets {
		validOrder[index] = playerSet.ID
	}
	deletedSetID := validOrder[0]
	suite.Require().NoError(database.DB.Where("player_set_id = ?", deletedSetID).Delete(&database.PlayerSetMatchTable{}).Error)
	suite.Require().NoError(database.DB.Delete(&database.PlayerSet{}, deletedSetID).Error)
	beforeDeletion := suite.currentRanks(elimination.ID)
	recorder, _ = suite.reorder(elimination.ID, UpdatePlayerSetRankingRequest{ExpectedPlayerSetIDs: validOrder, PlayerSetIDs: validOrder}, admin)
	suite.Equal(http.StatusConflict, recorder.Code, recorder.Body.String())
	suite.Equal(beforeDeletion, suite.currentRanks(elimination.ID))
}

// TestRankingEndpointsRequireCompetitionAdmin covers case 8: an
// unauthenticated caller and an admin of an unrelated competition both get
// 403 from GET, auto-rank and manual reorder.
func (suite *PlayerSetRankingIntegrationTestSuite) TestRankingEndpointsRequireCompetitionAdmin() {
	elimination, group, lane, participant, _, _ := suite.newElimination(1)
	setA := suite.singlePlayerSet(elimination.ID, group.ID, lane.ID, participant, "a", 100, nil)
	setB := suite.singlePlayerSet(elimination.ID, group.ID, lane.ID, participant, "b", 90, nil)

	_, _, _, _, foreignAdmin, _ := suite.newElimination(1)

	for name, cookies := range map[string][]*http.Cookie{"unauthenticated": nil, "foreign competition admin": foreignAdmin} {
		suite.Run(name, func() {
			recorder, _ := suite.getRanking(elimination.ID, cookies)
			suite.Equal(http.StatusForbidden, recorder.Code)
			recorder, _ = suite.autoRank(elimination.ID, cookies)
			suite.Equal(http.StatusForbidden, recorder.Code)
			recorder, _ = suite.reorder(elimination.ID, UpdatePlayerSetRankingRequest{ExpectedPlayerSetIDs: []uint{setA.ID, setB.ID}, PlayerSetIDs: []uint{setB.ID, setA.ID}}, cookies)
			suite.Equal(http.StatusForbidden, recorder.Code)
		})
	}
}

// TestExistingStageLocksAutoAndManualRanking covers case 9 and the 409 half
// of case 10 for an elimination whose bracket has already started.
func (suite *PlayerSetRankingIntegrationTestSuite) TestExistingStageLocksAutoAndManualRanking() {
	elimination, group, lane, participant, admin, _ := suite.newElimination(1)
	setA := suite.singlePlayerSet(elimination.ID, group.ID, lane.ID, participant, "a", 100, nil)
	setB := suite.singlePlayerSet(elimination.ID, group.ID, lane.ID, participant, "b", 90, nil)
	before := suite.currentRanks(elimination.ID)

	_, err := database.CreateStage(database.Stage{EliminationId: elimination.ID})
	suite.Require().NoError(err)

	recorder, _ := suite.autoRank(elimination.ID, admin)
	suite.Equal(http.StatusConflict, recorder.Code)
	suite.Equal(before, suite.currentRanks(elimination.ID))

	recorder, _ = suite.reorder(elimination.ID, UpdatePlayerSetRankingRequest{ExpectedPlayerSetIDs: []uint{setA.ID, setB.ID}, PlayerSetIDs: []uint{setB.ID, setA.ID}}, admin)
	suite.Equal(http.StatusConflict, recorder.Code)
	suite.Equal(before, suite.currentRanks(elimination.ID))
}

// TestRankingMutationConflictsWithConcurrentBracketInitialization covers
// case 11. Rather than racing two full handler calls blindly (which is only
// guaranteed to conflict when bracket initialization happens to win the
// underlying row lock first -- if the ranking mutation commits first, a
// subsequent bracket initialization legitimately also succeeds, since
// nothing about a successful reorder makes the bracket shape invalid), this
// deterministically forces bracket initialization to win: it holds the same
// elimination-row FOR UPDATE lock production code uses, inserts the Stage
// that marks the bracket as started, and only then commits. Because a
// locking read always observes the latest committed row once the lock is
// released, the ranking mutation issued concurrently is guaranteed to see
// the new Stage and lose the race with a 409, regardless of exact goroutine
// scheduling -- matching how the existing elimination-bracket integration
// tests use goroutines and channels to assert locking behavior.
func (suite *PlayerSetRankingIntegrationTestSuite) TestRankingMutationConflictsWithConcurrentBracketInitialization() {
	elimination, group, lane, participant, admin, _ := suite.newElimination(1)
	suite.singlePlayerSet(elimination.ID, group.ID, lane.ID, participant, "a", 100, nil)
	suite.singlePlayerSet(elimination.ID, group.ID, lane.ID, participant, "b", 90, nil)
	before := suite.currentRanks(elimination.ID)

	lockHeld := make(chan struct{})
	release := make(chan struct{})
	txDone := make(chan error, 1)
	go func() {
		txDone <- database.DB.Transaction(func(tx *gorm.DB) error {
			var locked database.Elimination
			if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&locked, elimination.ID).Error; err != nil {
				return err
			}
			close(lockHeld)
			<-release
			return tx.Create(&database.Stage{EliminationId: elimination.ID}).Error
		})
	}()
	<-lockHeld

	responses := make(chan *httptest.ResponseRecorder, 1)
	go func() {
		responses <- suite.request(http.MethodPatch, fmt.Sprintf("/playerset/elimination/%d/ranking/auto", elimination.ID), nil, admin)
	}()

	close(release)
	suite.Require().NoError(<-txDone)
	recorder := <-responses
	suite.Equal(http.StatusConflict, recorder.Code, recorder.Body.String())
	suite.Equal(before, suite.currentRanks(elimination.ID))
}

// TestDeprecatedPrerankingMatchesAutoRankTieBreakAndGating covers case 12:
// the deprecated PATCH /playerset/preranking/{eliminationid} route must use
// the same auto-ranking rule (X before ten in the tie-break, X excluded from
// ten_count), still return 200, and be subject to the same 403 / stage-409
// gating as /ranking/auto.
func (suite *PlayerSetRankingIntegrationTestSuite) TestDeprecatedPrerankingMatchesAutoRankTieBreakAndGating() {
	elimination, group, lane, participant, admin, _ := suite.newElimination(1)
	xWinner := suite.singlePlayerSet(elimination.ID, group.ID, lane.ID, participant, "x-winner", 100, [][]int{{11, 11}})
	tenOnly := suite.singlePlayerSet(elimination.ID, group.ID, lane.ID, participant, "ten-only", 100, [][]int{{10, 10, 10}})

	recorder := suite.preranking(elimination.ID, admin)
	suite.Equal(http.StatusOK, recorder.Code, recorder.Body.String())

	_, ranking := suite.getRanking(elimination.ID, admin)
	suite.Require().Len(ranking.PlayerSets, 2)
	suite.Equal(xWinner.ID, ranking.PlayerSets[0].ID)
	suite.Equal(2, ranking.PlayerSets[0].XCount)
	suite.Zero(ranking.PlayerSets[0].TenCount)
	suite.Equal(tenOnly.ID, ranking.PlayerSets[1].ID)
	suite.Zero(ranking.PlayerSets[1].XCount)
	suite.Equal(3, ranking.PlayerSets[1].TenCount)

	// 403 without an authenticated competition admin.
	recorder = suite.preranking(elimination.ID, nil)
	suite.Equal(http.StatusForbidden, recorder.Code)

	// 409 once a Stage exists, matching /ranking/auto's gating.
	staged, stagedGroup, stagedLane, stagedParticipant, stagedAdmin, _ := suite.newElimination(1)
	suite.singlePlayerSet(staged.ID, stagedGroup.ID, stagedLane.ID, stagedParticipant, "solo", 10, nil)
	before := suite.currentRanks(staged.ID)
	_, err := database.CreateStage(database.Stage{EliminationId: staged.ID})
	suite.Require().NoError(err)
	recorder = suite.preranking(staged.ID, stagedAdmin)
	suite.Equal(http.StatusConflict, recorder.Code)
	suite.Equal(before, suite.currentRanks(staged.ID))
}
