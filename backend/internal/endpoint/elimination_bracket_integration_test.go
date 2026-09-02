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
	"gorm.io/gorm"
)

// EliminationBracketIntegrationTestSuite deliberately exercises the HTTP
// handlers with a real MySQL database.  The bracket operations depend on row
// locking and transactions, neither of which sqlite-style unit tests cover.
type EliminationBracketIntegrationTestSuite struct {
	suite.Suite
	router      *gin.Engine
	sessionFile string
}

func (suite *EliminationBracketIntegrationTestSuite) SetupSuite() {
	database.SetupDatabaseByMode("test")
	file, err := os.CreateTemp("", "archery-bracket-session-*.yaml")
	suite.Require().NoError(err)
	suite.sessionFile = file.Name()
	suite.Require().NoError(file.Close())
	suite.Require().NoError(os.WriteFile(suite.sessionFile, []byte("SessionKey: bracket-integration-test-key\n"), 0600))
}

func (suite *EliminationBracketIntegrationTestSuite) TearDownSuite() {
	if suite.sessionFile != "" {
		_ = os.Remove(suite.sessionFile)
	}
}

func (suite *EliminationBracketIntegrationTestSuite) SetupTest() {
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
	suite.router.POST("/elimination/bracket/:id", PostEliminationBracket)
	suite.router.POST("/elimination/bracket/:id/sync-first-round", PostEliminationBracketFirstRoundSync)
	suite.router.POST("/elimination/stage/advance/:stageid", PostEliminationStageAdvance)
	suite.router.GET("/elimination/scores/:id", GetEliminationWScoresById)
	suite.router.GET("/elimination/match/scores/:matchid", GetMatchWScoresById)
	suite.router.PUT("/elimination/match/winner/:matchid", PutEliminationMatchWinner)
	suite.router.PUT("/elimination/match/settings/:matchid", PutEliminationMatchSettings)
	suite.router.PUT("/elimination/stage/placement/:stageid", PutEliminationStagePlacement)
	suite.router.PUT("/elimination/match/placement/:matchid", PutEliminationMatchPlacement)
	suite.router.PATCH("/elimination/match/playerset/:matchid", PutMatchPlayerSetByMatchId)
	suite.router.POST("/playerset", PostPlayerSet)
	suite.router.DELETE("/playerset/:id", DeletePlayerSet)
	suite.router.POST("/matchresult/matchend", PostMatchEnd)
	suite.router.GET("/matchresult/scores/:id", GetMatchResultWScoresById)
	suite.router.PATCH("/matchresult/shootoffscore/:id", PutMatchResultShootOffScoreById)
	suite.router.PATCH("/matchresult/iswinner/:id", PutMatchResultIsWinnerById)
	suite.router.PATCH("/matchresult/matchend/totalscore/:id", PutMatchEndsTotalScoresById)
	suite.router.PATCH("/matchresult/matchend/scores/:id", PutMatchEndsScoresById)
	suite.router.PATCH("/matchresult/matchend/isconfirmed/:id", PutMatchEndsIsConfirmedById)
	suite.router.PATCH("/matchresult/matchscore/score/:id", PutMatchScoreScoreById)
	suite.router.DELETE("/matchresult/:id", DeleteMatchResultById)
	suite.router.PATCH("/medal/playersetid/:id", PutMedalPlayerSetIdById)
}

func TestEliminationBracketIntegrationTestSuite(t *testing.T) {
	if os.Getenv("ARCHERY_MYSQL_INTEGRATION") != "1" {
		t.Skip("set ARCHERY_MYSQL_INTEGRATION=1 to run destructive MySQL integration tests")
	}
	suite.Run(t, new(EliminationBracketIntegrationTestSuite))
}

func (suite *EliminationBracketIntegrationTestSuite) request(method, path string, cookies []*http.Cookie) *httptest.ResponseRecorder {
	request := httptest.NewRequest(method, path, nil)
	for _, cookie := range cookies {
		request.AddCookie(cookie)
	}
	recorder := httptest.NewRecorder()
	suite.router.ServeHTTP(recorder, request)
	return recorder
}

func (suite *EliminationBracketIntegrationTestSuite) requestJSON(method, path string, body any, cookies []*http.Cookie) *httptest.ResponseRecorder {
	encoded, err := json.Marshal(body)
	suite.Require().NoError(err)
	request := httptest.NewRequest(method, path, bytes.NewReader(encoded))
	request.Header.Set("Content-Type", "application/json")
	for _, cookie := range cookies {
		request.AddCookie(cookie)
	}
	recorder := httptest.NewRecorder()
	suite.router.ServeHTTP(recorder, request)
	return recorder
}

func (suite *EliminationBracketIntegrationTestSuite) login(userID uint) []*http.Cookie {
	recorder := suite.request(http.MethodPost, fmt.Sprintf("/test/session/%d", userID), nil)
	suite.Equal(http.StatusNoContent, recorder.Code)
	cookies := recorder.Result().Cookies()
	suite.NotEmpty(cookies)
	return cookies
}

func (suite *EliminationBracketIntegrationTestSuite) createFixture(teamSize, entrantCount int, ranks []int) (database.Elimination, []database.PlayerSet, []*http.Cookie, []*http.Cookie) {
	now := time.Now()
	competition, err := database.PostCompetition(database.Competition{Title: "bracket integration", StartTime: now, EndTime: now.Add(time.Hour)})
	suite.Require().NoError(err)
	group, err := database.CreateGroupInfo(database.Group{CompetitionId: competition.ID, GroupName: "bracket", GroupIndex: 1, BowType: "Recurve"})
	suite.Require().NoError(err)
	elimination, err := database.CreateElimination(database.Elimination{GroupId: group.ID, TeamSize: teamSize})
	suite.Require().NoError(err)
	for medalType := 0; medalType < 3; medalType++ {
		_, err := database.CreateMedal(database.Medal{EliminationId: elimination.ID, Type: medalType})
		suite.Require().NoError(err)
	}

	adminUserID := uint(81001)
	nonAdminUserID := uint(81002)
	_, err = database.CreateParticipant(database.Participant{UserID: adminUserID, CompetitionID: competition.ID, Role: pkg.RoleToString(pkg.RAdmin), Status: "approved"})
	suite.Require().NoError(err)
	_, err = database.CreateParticipant(database.Participant{UserID: nonAdminUserID, CompetitionID: competition.ID, Role: pkg.RoleToString(pkg.RPlayer), Status: "approved"})
	suite.Require().NoError(err)

	playerSets := make([]database.PlayerSet, entrantCount)
	for index := range playerSets {
		rank := index + 1
		if len(ranks) > index {
			rank = ranks[index]
		}
		playerSet, err := database.CreatePlayerSet(database.PlayerSet{EliminationId: elimination.ID, Rank: rank, SetName: fmt.Sprintf("set-%d", index+1)})
		suite.Require().NoError(err)
		playerSets[index] = playerSet
	}
	return elimination, playerSets, suite.login(adminUserID), suite.login(nonAdminUserID)
}

func (suite *EliminationBracketIntegrationTestSuite) postBracket(eliminationID uint, cookies []*http.Cookie) (*httptest.ResponseRecorder, BracketInitResponse) {
	var entrantCount int64
	suite.Require().NoError(database.DB.Model(&database.PlayerSet{}).Where("elimination_id = ?", eliminationID).Count(&entrantCount).Error)
	advancingCount := int(entrantCount)
	if advancingCount < 4 {
		advancingCount = 4
	}
	recorder := suite.requestJSON(http.MethodPost, fmt.Sprintf("/elimination/bracket/%d", eliminationID), map[string]int{"advancing_count": advancingCount}, cookies)
	var response BracketInitResponse
	if recorder.Code == http.StatusOK {
		suite.Require().NoError(json.Unmarshal(recorder.Body.Bytes(), &response))
	}
	return recorder, response
}

func (suite *EliminationBracketIntegrationTestSuite) postAdvance(stageID uint, cookies []*http.Cookie) (*httptest.ResponseRecorder, BracketAdvanceResponse) {
	recorder := suite.request(http.MethodPost, fmt.Sprintf("/elimination/stage/advance/%d", stageID), cookies)
	var response BracketAdvanceResponse
	if recorder.Code == http.StatusOK {
		suite.Require().NoError(json.Unmarshal(recorder.Body.Bytes(), &response))
	}
	return recorder, response
}

func (suite *EliminationBracketIntegrationTestSuite) postFirstRoundSync(eliminationID uint, cookies []*http.Cookie) (*httptest.ResponseRecorder, BracketFirstRoundSyncResponse) {
	recorder := suite.request(http.MethodPost, fmt.Sprintf("/elimination/bracket/%d/sync-first-round", eliminationID), cookies)
	var response BracketFirstRoundSyncResponse
	if recorder.Code == http.StatusOK {
		suite.Require().NoError(json.Unmarshal(recorder.Body.Bytes(), &response))
	}
	return recorder, response
}

func (suite *EliminationBracketIntegrationTestSuite) putMatchWinner(matchID uint, winnerMatchResultID *uint, cookies []*http.Cookie) (*httptest.ResponseRecorder, MatchWinnerResponse) {
	recorder := suite.requestJSON(http.MethodPut, fmt.Sprintf("/elimination/match/winner/%d", matchID), MatchWinnerRequest{WinnerMatchResultID: winnerMatchResultID}, cookies)
	var response MatchWinnerResponse
	if recorder.Code == http.StatusOK {
		suite.Require().NoError(json.Unmarshal(recorder.Body.Bytes(), &response))
	}
	return recorder, response
}

func (suite *EliminationBracketIntegrationTestSuite) putMatchEndScores(matchEnd database.MatchEnd, scores []int, claimedTotal int, cookies []*http.Cookie) *httptest.ResponseRecorder {
	ids := make([]uint, len(matchEnd.MatchScores))
	for index, matchScore := range matchEnd.MatchScores {
		ids[index] = matchScore.ID
	}
	return suite.requestJSON(http.MethodPatch, fmt.Sprintf("/matchresult/matchend/scores/%d", matchEnd.ID), map[string]any{
		"total_scores":    claimedTotal,
		"match_score_ids": ids,
		"scores":          scores,
	}, cookies)
}

func (suite *EliminationBracketIntegrationTestSuite) loadBracket(eliminationID uint) database.Elimination {
	bracket, err := database.GetEliminationWScoresById(eliminationID)
	suite.Require().NoError(err)
	return bracket
}

func (suite *EliminationBracketIntegrationTestSuite) markWinner(bracket database.Elimination, stageIndex, matchIndex, resultIndex int) {
	resultID := bracket.Stages[stageIndex].Matchs[matchIndex].MatchResults[resultIndex].ID
	suite.Require().NoError(database.UpdateMatchResultIsWinnerById(resultID, true))
}

func (suite *EliminationBracketIntegrationTestSuite) TestMigrationDropsPersistedTotalPoints() {
	suite.False(database.DB.Migrator().HasColumn(&database.MatchResult{}, "total_points"))
}

func (suite *EliminationBracketIntegrationTestSuite) TestScoreReadsReturnComputedEndAndMatchPoints() {
	elimination, _, adminCookies, _ := suite.createFixture(1, 2, nil)
	recorder, _ := suite.postBracket(elimination.ID, adminCookies)
	suite.Require().Equal(http.StatusOK, recorder.Code, recorder.Body.String())
	match := suite.loadBracket(elimination.ID).Stages[0].Matchs[0]
	suite.Require().Len(match.MatchResults, 2)
	suite.Require().Len(match.MatchResults[0].MatchEnds, 5)
	suite.Require().Len(match.MatchResults[1].MatchEnds, 5)

	writeEnd := func(end *database.MatchEnd, scores []int, confirmed bool) {
		suite.Require().Len(end.MatchScores, len(scores))
		total := 0
		for index, score := range scores {
			total += score
			suite.Require().NoError(database.DB.Model(&database.MatchScore{}).
				Where("id = ?", end.MatchScores[index].ID).
				Update("score", score).Error)
		}
		suite.Require().NoError(database.DB.Model(&database.MatchEnd{}).
			Where("id = ?", end.ID).
			Updates(map[string]any{"total_score": total, "is_confirmed": confirmed}).Error)
	}

	writeEnd(match.MatchResults[0].MatchEnds[0], []int{10, 10, 10}, true)
	writeEnd(match.MatchResults[1].MatchEnds[0], []int{9, 9, 9}, false)
	writeEnd(match.MatchResults[0].MatchEnds[1], []int{9, 8, 8}, true)
	writeEnd(match.MatchResults[1].MatchEnds[1], []int{9, 8, 8}, true)

	assertComputed := func(results []*database.MatchResult) {
		suite.Require().Len(results, 2)
		suite.Equal(3, results[0].TotalPoints)
		suite.Equal(1, results[1].TotalPoints)
		suite.Require().NotNil(results[0].MatchEnds[0].Points)
		suite.Require().NotNil(results[1].MatchEnds[0].Points)
		suite.Equal(2, *results[0].MatchEnds[0].Points)
		suite.Equal(0, *results[1].MatchEnds[0].Points)
		suite.Equal(2, results[0].MatchEnds[0].CumulativePoints)
		suite.Equal(0, results[1].MatchEnds[0].CumulativePoints)
		suite.Require().NotNil(results[0].MatchEnds[1].Points)
		suite.Require().NotNil(results[1].MatchEnds[1].Points)
		suite.Equal(1, *results[0].MatchEnds[1].Points)
		suite.Equal(1, *results[1].MatchEnds[1].Points)
		suite.Equal(3, results[0].MatchEnds[1].CumulativePoints)
		suite.Equal(1, results[1].MatchEnds[1].CumulativePoints)
		suite.Nil(results[0].MatchEnds[2].Points)
		suite.Nil(results[1].MatchEnds[2].Points)
		suite.Equal(3, results[0].MatchEnds[2].CumulativePoints)
		suite.Equal(1, results[1].MatchEnds[2].CumulativePoints)
	}

	recorder = suite.request(http.MethodGet, fmt.Sprintf("/elimination/scores/%d", elimination.ID), nil)
	suite.Require().Equal(http.StatusOK, recorder.Code, recorder.Body.String())
	var eliminationResponse database.Elimination
	suite.Require().NoError(json.Unmarshal(recorder.Body.Bytes(), &eliminationResponse))
	assertComputed(eliminationResponse.Stages[0].Matchs[0].MatchResults)

	recorder = suite.request(http.MethodGet, fmt.Sprintf("/elimination/match/scores/%d", match.ID), nil)
	suite.Require().Equal(http.StatusOK, recorder.Code, recorder.Body.String())
	var matchResponse database.Match
	suite.Require().NoError(json.Unmarshal(recorder.Body.Bytes(), &matchResponse))
	assertComputed(matchResponse.MatchResults)

	recorder = suite.request(http.MethodGet, fmt.Sprintf("/matchresult/scores/%d", match.MatchResults[0].ID), nil)
	suite.Require().Equal(http.StatusOK, recorder.Code, recorder.Body.String())
	var resultResponse database.MatchResult
	suite.Require().NoError(json.Unmarshal(recorder.Body.Bytes(), &resultResponse))
	suite.Equal(3, resultResponse.TotalPoints)
	suite.Require().Len(resultResponse.MatchEnds, 5)
	suite.Require().NotNil(resultResponse.MatchEnds[0].Points)
	suite.Equal(2, *resultResponse.MatchEnds[0].Points)
	suite.Equal(3, resultResponse.MatchEnds[1].CumulativePoints)
}

func (suite *EliminationBracketIntegrationTestSuite) TestScoreSaveAutomaticallyRecomputesRecurveWinnerWithoutReadMutation() {
	elimination, _, adminCookies, _ := suite.createFixture(1, 4, nil)
	recorder, _ := suite.postBracket(elimination.ID, adminCookies)
	suite.Require().Equal(http.StatusOK, recorder.Code, recorder.Body.String())
	match := suite.loadBracket(elimination.ID).Stages[0].Matchs[0]

	for _, end := range match.MatchResults[0].MatchEnds {
		recorder = suite.putMatchEndScores(*end, []int{10, 10, 10}, -999, adminCookies)
		suite.Require().Equal(http.StatusOK, recorder.Code, recorder.Body.String())
	}
	for _, end := range match.MatchResults[1].MatchEnds {
		recorder = suite.putMatchEndScores(*end, []int{9, 9, 9}, 999, adminCookies)
		suite.Require().Equal(http.StatusOK, recorder.Code, recorder.Body.String())
	}

	var results []database.MatchResult
	suite.Require().NoError(database.DB.Where("match_id = ?", match.ID).Order("id ASC").Find(&results).Error)
	suite.True(results[0].IsWinner)
	suite.False(results[1].IsWinner)

	// A read only reports the computed state. It must not invoke a winner
	// mutation or overwrite a manual choice.
	suite.Require().NoError(database.DB.Model(&database.MatchResult{}).Where("id = ?", results[1].ID).Update("is_winner", true).Error)
	suite.Require().NoError(database.DB.Model(&database.MatchResult{}).Where("id = ?", results[0].ID).Update("is_winner", false).Error)
	recorder = suite.request(http.MethodGet, fmt.Sprintf("/elimination/scores/%d", elimination.ID), nil)
	suite.Require().Equal(http.StatusOK, recorder.Code, recorder.Body.String())
	suite.Require().NoError(database.DB.Where("match_id = ?", match.ID).Order("id ASC").Find(&results).Error)
	suite.False(results[0].IsWinner)
	suite.True(results[1].IsWinner)

	// A completed score save recalculates the decision.  The supplied aggregate
	// total is ignored; totals always come from the locked arrow rows.
	recorder = suite.putMatchEndScores(*match.MatchResults[0].MatchEnds[0], []int{8, 8, 8}, 12345, adminCookies)
	suite.Require().Equal(http.StatusOK, recorder.Code, recorder.Body.String())
	recorder = suite.putMatchEndScores(*match.MatchResults[0].MatchEnds[1], []int{8, 8, 8}, 12345, adminCookies)
	suite.Require().Equal(http.StatusOK, recorder.Code, recorder.Body.String())
	recorder = suite.putMatchEndScores(*match.MatchResults[0].MatchEnds[2], []int{8, 8, 8}, 12345, adminCookies)
	suite.Require().Equal(http.StatusOK, recorder.Code, recorder.Body.String())
	suite.Require().NoError(database.DB.Where("match_id = ?", match.ID).Order("id ASC").Find(&results).Error)
	suite.False(results[0].IsWinner)
	suite.True(results[1].IsWinner)

	var firstEnd database.MatchEnd
	suite.Require().NoError(database.DB.First(&firstEnd, match.MatchResults[0].MatchEnds[0].ID).Error)
	suite.Equal(24, firstEnd.TotalScore)

	// Legacy single-arrow saves also rebuild the wave total from every arrow;
	// a stale aggregate must not survive another score save.
	suite.Require().NoError(database.DB.Model(&database.MatchEnd{}).
		Where("id = ?", firstEnd.ID).Update("total_score", 999).Error)
	recorder = suite.requestJSON(
		http.MethodPatch,
		fmt.Sprintf("/matchresult/matchscore/score/%d", match.MatchResults[0].MatchEnds[0].MatchScores[0].ID),
		map[string]int{"score": 8},
		adminCookies,
	)
	suite.Require().Equal(http.StatusOK, recorder.Code, recorder.Body.String())
	suite.Require().NoError(database.DB.First(&firstEnd, firstEnd.ID).Error)
	suite.Equal(24, firstEnd.TotalScore)
}

func (suite *EliminationBracketIntegrationTestSuite) TestScoreSaveRejectsOutOfRangeArrowValues() {
	elimination, _, adminCookies, _ := suite.createFixture(1, 4, nil)
	recorder, _ := suite.postBracket(elimination.ID, adminCookies)
	suite.Require().Equal(http.StatusOK, recorder.Code, recorder.Body.String())
	match := suite.loadBracket(elimination.ID).Stages[0].Matchs[0]
	end := match.MatchResults[0].MatchEnds[0]

	recorder = suite.putMatchEndScores(*end, []int{12, 10, 10}, 30, adminCookies)
	suite.Require().Equal(http.StatusBadRequest, recorder.Code, recorder.Body.String())
	recorder = suite.requestJSON(
		http.MethodPatch,
		fmt.Sprintf("/matchresult/matchscore/score/%d", end.MatchScores[0].ID),
		map[string]int{"score": -2},
		adminCookies,
	)
	suite.Require().Equal(http.StatusBadRequest, recorder.Code, recorder.Body.String())

	var storedScores []database.MatchScore
	suite.Require().NoError(database.DB.Where("match_end_id = ?", end.ID).Order("id ASC").Find(&storedScores).Error)
	suite.Require().Len(storedScores, 3)
	for _, score := range storedScores {
		suite.Equal(-1, score.Score)
	}
}

func (suite *EliminationBracketIntegrationTestSuite) TestScoreSaveIncompleteKeepsManualWinnerAndShootOffClearsIt() {
	elimination, _, adminCookies, _ := suite.createFixture(1, 4, nil)
	recorder, _ := suite.postBracket(elimination.ID, adminCookies)
	suite.Require().Equal(http.StatusOK, recorder.Code, recorder.Body.String())
	match := suite.loadBracket(elimination.ID).Stages[0].Matchs[0]

	manualWinnerID := match.MatchResults[1].ID
	recorder, _ = suite.putMatchWinner(match.ID, &manualWinnerID, adminCookies)
	suite.Require().Equal(http.StatusOK, recorder.Code, recorder.Body.String())

	// One complete end is insufficient for an individual recurve decision;
	// score storage must leave the administrator's manual winner untouched.
	recorder = suite.putMatchEndScores(*match.MatchResults[0].MatchEnds[0], []int{10, 10, 10}, 0, adminCookies)
	suite.Require().Equal(http.StatusOK, recorder.Code, recorder.Body.String())
	recorder = suite.putMatchEndScores(*match.MatchResults[1].MatchEnds[0], []int{9, 9, 9}, 0, adminCookies)
	suite.Require().Equal(http.StatusOK, recorder.Code, recorder.Body.String())
	var results []database.MatchResult
	suite.Require().NoError(database.DB.Where("match_id = ?", match.ID).Order("id ASC").Find(&results).Error)
	suite.False(results[0].IsWinner)
	suite.True(results[1].IsWinner)

	// 2:0, 0:2, 1:1, 2:0, 0:2 is the regulation 5:5 shoot-off state.
	leftScores := [][]int{{10, 10, 10}, {9, 9, 9}, {10, 10, 10}, {10, 10, 10}, {9, 9, 9}}
	rightScores := [][]int{{9, 9, 9}, {10, 10, 10}, {10, 10, 10}, {9, 9, 9}, {10, 10, 10}}
	for endIndex := 1; endIndex < len(match.MatchResults[0].MatchEnds); endIndex++ {
		recorder = suite.putMatchEndScores(*match.MatchResults[0].MatchEnds[endIndex], leftScores[endIndex], 999, adminCookies)
		suite.Require().Equal(http.StatusOK, recorder.Code, recorder.Body.String())
		recorder = suite.putMatchEndScores(*match.MatchResults[1].MatchEnds[endIndex], rightScores[endIndex], -999, adminCookies)
		suite.Require().Equal(http.StatusOK, recorder.Code, recorder.Body.String())
	}
	recorder = suite.putMatchEndScores(*match.MatchResults[0].MatchEnds[0], leftScores[0], 999, adminCookies)
	suite.Require().Equal(http.StatusOK, recorder.Code, recorder.Body.String())
	recorder = suite.putMatchEndScores(*match.MatchResults[1].MatchEnds[0], rightScores[0], -999, adminCookies)
	suite.Require().Equal(http.StatusOK, recorder.Code, recorder.Body.String())
	suite.Require().NoError(database.DB.Where("match_id = ?", match.ID).Order("id ASC").Find(&results).Error)
	suite.False(results[0].IsWinner)
	suite.False(results[1].IsWinner)
}

func (suite *EliminationBracketIntegrationTestSuite) TestScoreSaveAfterAdvanceKeepsWinnerAndReportsLockedConflict() {
	elimination, _, adminCookies, _ := suite.createFixture(1, 4, nil)
	recorder, _ := suite.postBracket(elimination.ID, adminCookies)
	suite.Require().Equal(http.StatusOK, recorder.Code, recorder.Body.String())
	bracket := suite.loadBracket(elimination.ID)
	match := bracket.Stages[0].Matchs[0]
	for endIndex := range match.MatchResults[0].MatchEnds {
		recorder = suite.putMatchEndScores(*match.MatchResults[0].MatchEnds[endIndex], []int{10, 10, 10}, 0, adminCookies)
		suite.Require().Equal(http.StatusOK, recorder.Code, recorder.Body.String())
		recorder = suite.putMatchEndScores(*match.MatchResults[1].MatchEnds[endIndex], []int{9, 9, 9}, 0, adminCookies)
		suite.Require().Equal(http.StatusOK, recorder.Code, recorder.Body.String())
	}

	otherWinnerID := bracket.Stages[0].Matchs[1].MatchResults[0].ID
	recorder, _ = suite.putMatchWinner(bracket.Stages[0].Matchs[1].ID, &otherWinnerID, adminCookies)
	suite.Require().Equal(http.StatusOK, recorder.Code, recorder.Body.String())
	recorder, _ = suite.postAdvance(bracket.Stages[0].ID, adminCookies)
	suite.Require().Equal(http.StatusOK, recorder.Code, recorder.Body.String())

	advanced := suite.loadBracket(elimination.ID)
	winningPlayerSetID := *advanced.Stages[0].Matchs[0].MatchResults[0].PlayerSetId
	targetPlayerSetID := *advanced.Stages[1].Matchs[0].MatchResults[0].PlayerSetId
	suite.Equal(winningPlayerSetID, targetPlayerSetID)

	// Recurve's first three changed ends now make the second side reach six.
	// The source already advanced, so the score persists but its winner and
	// projected target must remain unchanged.
	for endIndex := 0; endIndex < 3; endIndex++ {
		recorder = suite.putMatchEndScores(*match.MatchResults[0].MatchEnds[endIndex], []int{8, 8, 8}, 12345, adminCookies)
		suite.Require().Equal(http.StatusOK, recorder.Code, recorder.Body.String())
	}
	var sourceResults []database.MatchResult
	suite.Require().NoError(database.DB.Where("match_id = ?", match.ID).Order("id ASC").Find(&sourceResults).Error)
	suite.True(sourceResults[0].IsWinner)
	suite.False(sourceResults[1].IsWinner)
	var changedEnd database.MatchEnd
	suite.Require().NoError(database.DB.First(&changedEnd, match.MatchResults[0].MatchEnds[2].ID).Error)
	suite.Equal(24, changedEnd.TotalScore)
	var target database.MatchResult
	suite.Require().NoError(database.DB.First(&target, advanced.Stages[1].Matchs[0].MatchResults[0].ID).Error)
	suite.Require().NotNil(target.PlayerSetId)
	suite.Equal(winningPlayerSetID, *target.PlayerSetId)

	recorder = suite.request(http.MethodGet, fmt.Sprintf("/elimination/scores/%d", elimination.ID), nil)
	suite.Require().Equal(http.StatusOK, recorder.Code, recorder.Body.String())
	var responseElimination database.Elimination
	suite.Require().NoError(json.Unmarshal(recorder.Body.Bytes(), &responseElimination))
	suite.Equal(database.MatchOutcomeLockedConflict, responseElimination.Stages[0].Matchs[0].OutcomeStatus)
}

func (suite *EliminationBracketIntegrationTestSuite) TestInitializeCompleteBracketAndIdempotency() {
	elimination, _, adminCookies, _ := suite.createFixture(1, 5, nil)
	recorder, response := suite.postBracket(elimination.ID, adminCookies)
	suite.Equal(http.StatusOK, recorder.Code)
	suite.Equal(elimination.ID, response.EliminationID)
	suite.Equal(5, response.EntrantCount)
	suite.Equal(8, response.BracketSize)
	suite.Equal(3, response.StageCount)
	suite.True(response.Created)

	bracket := suite.loadBracket(elimination.ID)
	suite.Len(bracket.Stages, 3)
	suite.Len(bracket.Stages[0].Matchs, 4)
	suite.Len(bracket.Stages[1].Matchs, 2)
	suite.Len(bracket.Stages[2].Matchs, 2)
	for _, stage := range bracket.Stages {
		for _, match := range stage.Matchs {
			suite.Len(match.MatchResults, 2)
			for _, result := range match.MatchResults {
				suite.Equal(0, result.LaneNumber)
				suite.Len(result.MatchEnds, 5)
				for _, end := range result.MatchEnds {
					suite.Len(end.MatchScores, 3)
				}
			}
		}
	}
	medals, err := database.GetMedalInfoByEliminationId(elimination.ID)
	suite.Require().NoError(err)
	suite.Len(medals, 3)

	recorder, response = suite.postBracket(elimination.ID, adminCookies)
	suite.Equal(http.StatusOK, recorder.Code)
	suite.False(response.Created)
	recorder = suite.requestJSON(http.MethodPost, fmt.Sprintf("/elimination/bracket/%d", elimination.ID), map[string]int{"advancing_count": 8}, adminCookies)
	suite.Equal(http.StatusConflict, recorder.Code)
}

func (suite *EliminationBracketIntegrationTestSuite) TestInitializeRanksUnsetPlayerSetsBeforeSeedingFirstRound() {
	elimination, playerSets, adminCookies, _ := suite.createFixture(1, 4, []int{0, 0, 0, 0})
	recorder, _ := suite.postBracket(elimination.ID, adminCookies)
	suite.Equal(http.StatusOK, recorder.Code, recorder.Body.String())

	var ranked []database.PlayerSet
	suite.Require().NoError(database.DB.Where("elimination_id = ?", elimination.ID).Order("`rank` asc, id asc").Find(&ranked).Error)
	suite.Len(ranked, 4)
	for index, playerSet := range ranked {
		suite.Equal(index+1, playerSet.Rank)
		suite.Equal(playerSets[index].ID, playerSet.ID)
	}

	bracket := suite.loadBracket(elimination.ID)
	firstRound := bracket.Stages[0].Matchs
	suite.Equal(playerSets[0].ID, *firstRound[0].MatchResults[0].PlayerSetId)
	suite.Equal(playerSets[3].ID, *firstRound[0].MatchResults[1].PlayerSetId)
	suite.Equal(playerSets[2].ID, *firstRound[1].MatchResults[0].PlayerSetId)
	suite.Equal(playerSets[1].ID, *firstRound[1].MatchResults[1].PlayerSetId)
}

func (suite *EliminationBracketIntegrationTestSuite) TestFirstRoundSyncRanksUnsetPlayerSetsInAnExistingOpenBracket() {
	elimination, _, adminCookies, _ := suite.createFixture(1, 0, nil)
	recorder, _ := suite.postBracket(elimination.ID, adminCookies)
	suite.Equal(http.StatusOK, recorder.Code, recorder.Body.String())

	playerSets := make([]database.PlayerSet, 4)
	for index := range playerSets {
		playerSet, err := database.CreatePlayerSet(database.PlayerSet{EliminationId: elimination.ID, Rank: 0, SetName: fmt.Sprintf("late-set-%d", index+1)})
		suite.Require().NoError(err)
		playerSets[index] = playerSet
	}
	recorder, syncResponse := suite.postFirstRoundSync(elimination.ID, adminCookies)
	suite.Equal(http.StatusOK, recorder.Code, recorder.Body.String())
	suite.True(syncResponse.Changed)

	var ranked []database.PlayerSet
	suite.Require().NoError(database.DB.Where("elimination_id = ?", elimination.ID).Order("`rank` asc, id asc").Find(&ranked).Error)
	for index, playerSet := range ranked {
		suite.Equal(index+1, playerSet.Rank)
	}
	bracket := suite.loadBracket(elimination.ID)
	suite.Equal(playerSets[0].ID, *bracket.Stages[0].Matchs[0].MatchResults[0].PlayerSetId)
	suite.Equal(playerSets[3].ID, *bracket.Stages[0].Matchs[0].MatchResults[1].PlayerSetId)
	suite.Equal(playerSets[2].ID, *bracket.Stages[0].Matchs[1].MatchResults[0].PlayerSetId)
	suite.Equal(playerSets[1].ID, *bracket.Stages[0].Matchs[1].MatchResults[1].PlayerSetId)
}

func (suite *EliminationBracketIntegrationTestSuite) TestInitializeAllowsEmptyAndGappedSetupRosterWithoutAdvancingByes() {
	empty, _, emptyAdmin, _ := suite.createFixture(1, 0, nil)
	recorder, response := suite.postBracket(empty.ID, emptyAdmin)
	suite.Equal(http.StatusOK, recorder.Code)
	suite.Equal(0, response.EntrantCount)
	bracket := suite.loadBracket(empty.ID)
	for _, match := range bracket.Stages[0].Matchs {
		for _, result := range match.MatchResults {
			suite.Nil(result.PlayerSetId)
			suite.False(result.IsWinner)
		}
	}

	gapped, playerSets, gappedAdmin, _ := suite.createFixture(1, 2, []int{1, 4})
	recorder, _ = suite.postBracket(gapped.ID, gappedAdmin)
	suite.Equal(http.StatusOK, recorder.Code)
	bracket = suite.loadBracket(gapped.ID)
	suite.Equal(playerSets[0].ID, *bracket.Stages[0].Matchs[0].MatchResults[0].PlayerSetId)
	suite.Equal(playerSets[1].ID, *bracket.Stages[0].Matchs[0].MatchResults[1].PlayerSetId)
	suite.False(bracket.Stages[0].Matchs[0].MatchResults[0].IsWinner)
	suite.False(bracket.Stages[0].Matchs[0].MatchResults[1].IsWinner)
}

func (suite *EliminationBracketIntegrationTestSuite) TestFirstRoundSyncRepairsOpenBracketAndIsIdempotent() {
	elimination, playerSets, adminCookies, nonAdminCookies := suite.createFixture(1, 2, []int{1, 4})
	recorder, _ := suite.postBracket(elimination.ID, adminCookies)
	suite.Equal(http.StatusOK, recorder.Code)

	// Simulate a legacy/out-of-band schedule-rank write: the bracket still has
	// seed 4 in match 0, but rank 3 must move it to match 1.
	suite.Require().NoError(database.DB.Model(&database.PlayerSet{}).Where("id = ?", playerSets[1].ID).Update("rank", 3).Error)
	recorder, _ = suite.postFirstRoundSync(elimination.ID, nonAdminCookies)
	suite.Equal(http.StatusForbidden, recorder.Code)

	recorder, response := suite.postFirstRoundSync(elimination.ID, adminCookies)
	suite.Equal(http.StatusOK, recorder.Code)
	suite.True(response.Changed)
	bracket := suite.loadBracket(elimination.ID)
	suite.Equal(playerSets[0].ID, *bracket.Stages[0].Matchs[0].MatchResults[0].PlayerSetId)
	suite.Nil(bracket.Stages[0].Matchs[0].MatchResults[1].PlayerSetId)
	suite.Equal(playerSets[1].ID, *bracket.Stages[0].Matchs[1].MatchResults[0].PlayerSetId)
	suite.Nil(bracket.Stages[0].Matchs[1].MatchResults[1].PlayerSetId)

	recorder, response = suite.postFirstRoundSync(elimination.ID, adminCookies)
	suite.Equal(http.StatusOK, recorder.Code)
	suite.False(response.Changed)
}

func (suite *EliminationBracketIntegrationTestSuite) TestFirstAdvanceSynchronizesOpenFirstRoundBeforeCompatibilityCheck() {
	elimination, playerSets, adminCookies, _ := suite.createFixture(1, 2, []int{1, 4})
	recorder, _ := suite.postBracket(elimination.ID, adminCookies)
	suite.Equal(http.StatusOK, recorder.Code)

	// Both first-round matches become structural BYEs after the persisted rank
	// change. Before the pre-advance sync this stale first slot caused the
	// generic partial/incompatible 409.
	suite.Require().NoError(database.DB.Model(&database.PlayerSet{}).Where("id = ?", playerSets[1].ID).Update("rank", 3).Error)
	bracket := suite.loadBracket(elimination.ID)
	recorder, response := suite.postAdvance(bracket.Stages[0].ID, adminCookies)
	suite.Equal(http.StatusOK, recorder.Code, recorder.Body.String())
	suite.True(response.Changed)
	bracket = suite.loadBracket(elimination.ID)
	suite.Equal(playerSets[0].ID, *bracket.Stages[1].Matchs[0].MatchResults[0].PlayerSetId)
	suite.Equal(playerSets[1].ID, *bracket.Stages[1].Matchs[0].MatchResults[1].PlayerSetId)
}

func (suite *EliminationBracketIntegrationTestSuite) TestFirstAdvanceTreatsRankZeroAsReserveThenRequiresWinners() {
	elimination, _, adminCookies, _ := suite.createFixture(1, 4, []int{0, 1, 2, 3})
	recorder, _ := suite.postBracket(elimination.ID, adminCookies)
	suite.Equal(http.StatusOK, recorder.Code)
	bracket := suite.loadBracket(elimination.ID)
	recorder, _ = suite.postAdvance(bracket.Stages[0].ID, adminCookies)
	suite.Equal(http.StatusConflict, recorder.Code)
	suite.Contains(recorder.Body.String(), errBracketPending.Error())
	stored, err := database.GetOnlyEliminationById(elimination.ID)
	suite.Require().NoError(err)
	suite.False(stored.BracketRosterLocked)
}

func (suite *EliminationBracketIntegrationTestSuite) TestInitializeRequiresCompetitionAdminAndValidEntrants() {
	elimination, _, _, nonAdminCookies := suite.createFixture(1, 4, nil)
	recorder, _ := suite.postBracket(elimination.ID, nil)
	suite.Equal(http.StatusForbidden, recorder.Code)
	recorder, _ = suite.postBracket(elimination.ID, nonAdminCookies)
	suite.Equal(http.StatusForbidden, recorder.Code)

	tooFew, _, tooFewAdmin, _ := suite.createFixture(1, 3, nil)
	recorder, _ = suite.postBracket(tooFew.ID, tooFewAdmin)
	suite.Equal(http.StatusOK, recorder.Code)

	badRanks, _, badRanksAdmin, _ := suite.createFixture(1, 4, []int{1, 2, 2, 4})
	recorder, _ = suite.postBracket(badRanks.ID, badRanksAdmin)
	suite.Equal(http.StatusConflict, recorder.Code)

	partial, _, partialAdmin, _ := suite.createFixture(1, 4, nil)
	_, err := database.CreateStage(database.Stage{EliminationId: partial.ID})
	suite.Require().NoError(err)
	recorder, _ = suite.postBracket(partial.ID, partialAdmin)
	suite.Equal(http.StatusConflict, recorder.Code)

	missingMedal, _, missingMedalAdmin, _ := suite.createFixture(1, 4, nil)
	suite.Require().NoError(database.DB.Where("elimination_id = ? AND type = ?", missingMedal.ID, 2).Delete(&database.Medal{}).Error)
	recorder, _ = suite.postBracket(missingMedal.ID, missingMedalAdmin)
	suite.Equal(http.StatusConflict, recorder.Code)
	var stageCount int64
	suite.Require().NoError(database.DB.Model(&database.Stage{}).Where("elimination_id = ?", missingMedal.ID).Count(&stageCount).Error)
	suite.Zero(stageCount)
}

func (suite *EliminationBracketIntegrationTestSuite) TestInitializeRollsBackAndConcurrentCallsAreIdempotent() {
	invalidTeamSize, _, adminCookies, _ := suite.createFixture(99, 4, nil)
	recorder, _ := suite.postBracket(invalidTeamSize.ID, adminCookies)
	suite.Equal(http.StatusBadRequest, recorder.Code)
	var stageCount int64
	suite.Require().NoError(database.DB.Model(&database.Stage{}).Where("elimination_id = ?", invalidTeamSize.ID).Count(&stageCount).Error)
	suite.EqualValues(0, stageCount)

	elimination, _, concurrentAdminCookies, _ := suite.createFixture(1, 4, nil)
	start := make(chan struct{})
	responses := make(chan *httptest.ResponseRecorder, 2)
	var waitGroup sync.WaitGroup
	for index := 0; index < 2; index++ {
		waitGroup.Add(1)
		go func() {
			defer waitGroup.Done()
			<-start
			responses <- suite.requestJSON(http.MethodPost, fmt.Sprintf("/elimination/bracket/%d", elimination.ID), map[string]int{"advancing_count": 4}, concurrentAdminCookies)
		}()
	}
	close(start)
	waitGroup.Wait()
	close(responses)

	createdCount := 0
	for recorder := range responses {
		suite.Equal(http.StatusOK, recorder.Code, recorder.Body.String())
		var response BracketInitResponse
		suite.Require().NoError(json.Unmarshal(recorder.Body.Bytes(), &response))
		if response.Created {
			createdCount++
		}
	}
	suite.Equal(1, createdCount)
	bracket := suite.loadBracket(elimination.ID)
	suite.Len(bracket.Stages, 2)
}

func (suite *EliminationBracketIntegrationTestSuite) TestAdvanceRegularStageThenSemiFinalAndFinalMedals() {
	elimination, _, adminCookies, _ := suite.createFixture(1, 8, nil)
	recorder, _ := suite.postBracket(elimination.ID, adminCookies)
	suite.Equal(http.StatusOK, recorder.Code)

	bracket := suite.loadBracket(elimination.ID)
	for matchIndex := range bracket.Stages[0].Matchs {
		suite.markWinner(bracket, 0, matchIndex, 0)
	}
	recorder, advance := suite.postAdvance(bracket.Stages[0].ID, adminCookies)
	suite.Equal(http.StatusOK, recorder.Code)
	suite.True(advance.Changed)
	suite.False(advance.Finalized)
	suite.NotNil(advance.TargetStageID)

	bracket = suite.loadBracket(elimination.ID)
	for matchIndex := range bracket.Stages[1].Matchs {
		suite.markWinner(bracket, 1, matchIndex, 0)
	}
	recorder, advance = suite.postAdvance(bracket.Stages[1].ID, adminCookies)
	suite.Equal(http.StatusOK, recorder.Code)
	suite.True(advance.Changed)
	bracket = suite.loadBracket(elimination.ID)
	goldMatch := bracket.Stages[2].Matchs[0]
	bronzeMatch := bracket.Stages[2].Matchs[1]
	suite.NotNil(goldMatch.MatchResults[0].PlayerSetId)
	suite.NotNil(goldMatch.MatchResults[1].PlayerSetId)
	suite.NotNil(bronzeMatch.MatchResults[0].PlayerSetId)
	suite.NotNil(bronzeMatch.MatchResults[1].PlayerSetId)

	suite.markWinner(bracket, 2, 0, 0)
	suite.markWinner(bracket, 2, 1, 0)
	recorder, advance = suite.postAdvance(bracket.Stages[2].ID, adminCookies)
	suite.Equal(http.StatusOK, recorder.Code)
	suite.True(advance.Finalized)
	suite.True(advance.Changed)
	medals, err := database.GetMedalInfoByEliminationId(elimination.ID)
	suite.Require().NoError(err)
	suite.Len(medals, 3)
	suite.NotZero(medals[0].PlayerSetId)
	suite.NotZero(medals[1].PlayerSetId)
	suite.NotZero(medals[2].PlayerSetId)

	recorder, advance = suite.postAdvance(bracket.Stages[2].ID, adminCookies)
	suite.Equal(http.StatusOK, recorder.Code)
	suite.True(advance.Finalized)
	suite.False(advance.Changed)
}

func (suite *EliminationBracketIntegrationTestSuite) TestManualFinalWinnerCorrectionReprojectsOnlyAffectedMedals() {
	elimination, _, adminCookies, _ := suite.createFixture(1, 4, nil)
	recorder, _ := suite.postBracket(elimination.ID, adminCookies)
	suite.Equal(http.StatusOK, recorder.Code, recorder.Body.String())

	bracket := suite.loadBracket(elimination.ID)
	for matchIndex := range bracket.Stages[0].Matchs {
		suite.markWinner(bracket, 0, matchIndex, 0)
	}
	recorder, _ = suite.postAdvance(bracket.Stages[0].ID, adminCookies)
	suite.Equal(http.StatusOK, recorder.Code, recorder.Body.String())

	bracket = suite.loadBracket(elimination.ID)
	goldMatch, bronzeMatch := bracket.Stages[1].Matchs[0], bracket.Stages[1].Matchs[1]
	// Before the stage is formally finalized there are no awarded medals. The
	// Progress settings path may change both identities and winner, but must
	// not award medals early; PostAdvance owns first materialization.
	initialGoldWinnerID := goldMatch.MatchResults[0].ID
	recorder = suite.requestJSON(http.MethodPut, fmt.Sprintf("/elimination/match/settings/%d", goldMatch.ID), MatchSettingsRequest{
		WinnerMatchResultID: &initialGoldWinnerID,
		PlayerSetIDs:        []uint{*goldMatch.MatchResults[1].PlayerSetId, *goldMatch.MatchResults[0].PlayerSetId},
		Placements: []MatchResultPlacement{
			{MatchResultID: goldMatch.MatchResults[0].ID, LaneNumber: 0},
			{MatchResultID: goldMatch.MatchResults[1].ID, LaneNumber: 0},
		},
	}, adminCookies)
	suite.Equal(http.StatusOK, recorder.Code, recorder.Body.String())
	medals, err := database.GetMedalInfoByEliminationId(elimination.ID)
	suite.Require().NoError(err)
	suite.Zero(medals[0].PlayerSetId)
	suite.Zero(medals[1].PlayerSetId)
	suite.Zero(medals[2].PlayerSetId)

	bracket = suite.loadBracket(elimination.ID)
	goldMatch, bronzeMatch = bracket.Stages[1].Matchs[0], bracket.Stages[1].Matchs[1]
	suite.markWinner(bracket, 1, 1, 0)
	recorder, _ = suite.postAdvance(bracket.Stages[1].ID, adminCookies)
	suite.Equal(http.StatusOK, recorder.Code, recorder.Body.String())

	medals, err = database.GetMedalInfoByEliminationId(elimination.ID)
	suite.Require().NoError(err)
	suite.Equal(*goldMatch.MatchResults[0].PlayerSetId, medals[0].PlayerSetId)
	suite.Equal(*goldMatch.MatchResults[1].PlayerSetId, medals[1].PlayerSetId)
	suite.Equal(*bronzeMatch.MatchResults[0].PlayerSetId, medals[2].PlayerSetId)

	// Winner and medal rewrites roll back together if a later placement in the
	// same settings request is invalid.
	invalidTarget := "C"
	goldOtherID := goldMatch.MatchResults[1].ID
	recorder = suite.requestJSON(http.MethodPut, fmt.Sprintf("/elimination/match/settings/%d", goldMatch.ID), MatchSettingsRequest{
		WinnerMatchResultID: &goldOtherID,
		Placements: []MatchResultPlacement{
			{MatchResultID: goldMatch.MatchResults[0].ID, LaneNumber: 0},
			{MatchResultID: goldMatch.MatchResults[1].ID, LaneNumber: 0, Target: &invalidTarget},
		},
	}, adminCookies)
	suite.Equal(http.StatusBadRequest, recorder.Code, recorder.Body.String())
	bracket = suite.loadBracket(elimination.ID)
	suite.True(bracket.Stages[1].Matchs[0].MatchResults[0].IsWinner)
	suite.False(bracket.Stages[1].Matchs[0].MatchResults[1].IsWinner)
	medals, err = database.GetMedalInfoByEliminationId(elimination.ID)
	suite.Require().NoError(err)
	suite.Equal(*goldMatch.MatchResults[0].PlayerSetId, medals[0].PlayerSetId)
	suite.Equal(*goldMatch.MatchResults[1].PlayerSetId, medals[1].PlayerSetId)
	suite.Equal(*bronzeMatch.MatchResults[0].PlayerSetId, medals[2].PlayerSetId)

	// The final was already awarded. The manual winner endpoint may still
	// correct its winner and atomically swap gold/silver.
	recorder, response := suite.putMatchWinner(goldMatch.ID, &goldOtherID, adminCookies)
	suite.Equal(http.StatusOK, recorder.Code, recorder.Body.String())
	suite.True(response.Changed)
	medals, err = database.GetMedalInfoByEliminationId(elimination.ID)
	suite.Require().NoError(err)
	suite.Equal(*goldMatch.MatchResults[1].PlayerSetId, medals[0].PlayerSetId)
	suite.Equal(*goldMatch.MatchResults[0].PlayerSetId, medals[1].PlayerSetId)
	suite.Equal(*bronzeMatch.MatchResults[0].PlayerSetId, medals[2].PlayerSetId)

	// Progress uses match settings. Correcting the bronze final must touch
	// only bronze, while its required placement payload remains atomic with
	// the winner change.
	bronzeOtherID := bronzeMatch.MatchResults[1].ID
	recorder = suite.requestJSON(http.MethodPut, fmt.Sprintf("/elimination/match/settings/%d", bronzeMatch.ID), MatchSettingsRequest{
		WinnerMatchResultID: &bronzeOtherID,
		Placements: []MatchResultPlacement{
			{MatchResultID: bronzeMatch.MatchResults[0].ID, LaneNumber: 0},
			{MatchResultID: bronzeMatch.MatchResults[1].ID, LaneNumber: 0},
		},
	}, adminCookies)
	suite.Equal(http.StatusOK, recorder.Code, recorder.Body.String())
	medals, err = database.GetMedalInfoByEliminationId(elimination.ID)
	suite.Require().NoError(err)
	suite.Equal(*goldMatch.MatchResults[1].PlayerSetId, medals[0].PlayerSetId)
	suite.Equal(*goldMatch.MatchResults[0].PlayerSetId, medals[1].PlayerSetId)
	suite.Equal(*bronzeMatch.MatchResults[1].PlayerSetId, medals[2].PlayerSetId)

	// Clearing bronze removes only the bronze medal.
	recorder, response = suite.putMatchWinner(bronzeMatch.ID, nil, adminCookies)
	suite.Equal(http.StatusOK, recorder.Code, recorder.Body.String())
	suite.True(response.Changed)
	medals, err = database.GetMedalInfoByEliminationId(elimination.ID)
	suite.Require().NoError(err)
	suite.Equal(*goldMatch.MatchResults[1].PlayerSetId, medals[0].PlayerSetId)
	suite.Equal(*goldMatch.MatchResults[0].PlayerSetId, medals[1].PlayerSetId)
	suite.Zero(medals[2].PlayerSetId)

	// Clearing the awarded gold final clears its two derived medal rows and
	// does not recreate the independently cleared bronze medal.
	recorder, response = suite.putMatchWinner(goldMatch.ID, nil, adminCookies)
	suite.Equal(http.StatusOK, recorder.Code, recorder.Body.String())
	suite.True(response.Changed)
	medals, err = database.GetMedalInfoByEliminationId(elimination.ID)
	suite.Require().NoError(err)
	suite.Zero(medals[0].PlayerSetId)
	suite.Zero(medals[1].PlayerSetId)
	suite.Zero(medals[2].PlayerSetId)

	// Historical stale state: no explicit winner but medals remain. An
	// explicit clear still removes those derived rows.
	suite.Require().NoError(database.DB.Model(&database.Medal{}).
		Where("elimination_id = ? AND type = ?", elimination.ID, 0).
		Update("player_set_id", *goldMatch.MatchResults[0].PlayerSetId).Error)
	suite.Require().NoError(database.DB.Model(&database.Medal{}).
		Where("elimination_id = ? AND type = ?", elimination.ID, 1).
		Update("player_set_id", *goldMatch.MatchResults[1].PlayerSetId).Error)
	recorder, response = suite.putMatchWinner(goldMatch.ID, nil, adminCookies)
	suite.Equal(http.StatusOK, recorder.Code, recorder.Body.String())
	suite.True(response.Changed)
	medals, err = database.GetMedalInfoByEliminationId(elimination.ID)
	suite.Require().NoError(err)
	suite.Zero(medals[0].PlayerSetId)
	suite.Zero(medals[1].PlayerSetId)
	suite.Zero(medals[2].PlayerSetId)
}

func (suite *EliminationBracketIntegrationTestSuite) TestMatchWinnerEndpointSelectsExactlyOneAndProtectsAdvancedSource() {
	elimination, _, adminCookies, _ := suite.createFixture(1, 4, nil)
	recorder, _ := suite.postBracket(elimination.ID, adminCookies)
	suite.Equal(http.StatusOK, recorder.Code)
	bracket := suite.loadBracket(elimination.ID)
	match := bracket.Stages[0].Matchs[0]
	firstID := match.MatchResults[0].ID
	secondID := match.MatchResults[1].ID

	// Saving an unselected dialog state must not lock a roster that remains
	// editable for schedule changes.
	recorder, response := suite.putMatchWinner(match.ID, nil, adminCookies)
	suite.Equal(http.StatusOK, recorder.Code)
	suite.False(response.Changed)
	stored, err := database.GetOnlyEliminationById(elimination.ID)
	suite.Require().NoError(err)
	suite.False(stored.BracketRosterLocked)

	recorder, response = suite.putMatchWinner(match.ID, &firstID, adminCookies)
	suite.Equal(http.StatusOK, recorder.Code)
	suite.True(response.Changed)
	bracket = suite.loadBracket(elimination.ID)
	suite.True(bracket.Stages[0].Matchs[0].MatchResults[0].IsWinner)
	suite.False(bracket.Stages[0].Matchs[0].MatchResults[1].IsWinner)

	recorder, response = suite.putMatchWinner(match.ID, &secondID, adminCookies)
	suite.Equal(http.StatusOK, recorder.Code)
	suite.True(response.Changed)
	bracket = suite.loadBracket(elimination.ID)
	suite.False(bracket.Stages[0].Matchs[0].MatchResults[0].IsWinner)
	suite.True(bracket.Stages[0].Matchs[0].MatchResults[1].IsWinner)

	recorder, response = suite.putMatchWinner(match.ID, nil, adminCookies)
	suite.Equal(http.StatusOK, recorder.Code)
	suite.True(response.Changed)
	bracket = suite.loadBracket(elimination.ID)
	suite.False(bracket.Stages[0].Matchs[0].MatchResults[0].IsWinner)
	suite.False(bracket.Stages[0].Matchs[0].MatchResults[1].IsWinner)

	// The old per-result API now delegates to the same match transaction, so
	// selecting the other side clears the prior winner instead of creating two.
	recorder = suite.requestJSON(http.MethodPatch, fmt.Sprintf("/matchresult/iswinner/%d", firstID), map[string]bool{"is_winner": true}, adminCookies)
	suite.Equal(http.StatusOK, recorder.Code)
	recorder = suite.requestJSON(http.MethodPatch, fmt.Sprintf("/matchresult/iswinner/%d", secondID), map[string]bool{"is_winner": true}, adminCookies)
	suite.Equal(http.StatusOK, recorder.Code)
	bracket = suite.loadBracket(elimination.ID)
	suite.False(bracket.Stages[0].Matchs[0].MatchResults[0].IsWinner)
	suite.True(bracket.Stages[0].Matchs[0].MatchResults[1].IsWinner)

	// Once this source has been advanced, its winner cannot be rewritten.
	for matchIndex := 1; matchIndex < len(bracket.Stages[0].Matchs); matchIndex++ {
		suite.markWinner(bracket, 0, matchIndex, 0)
	}
	recorder, _ = suite.postAdvance(bracket.Stages[0].ID, adminCookies)
	suite.Equal(http.StatusOK, recorder.Code)
	recorder, _ = suite.putMatchWinner(match.ID, &firstID, adminCookies)
	suite.Equal(http.StatusConflict, recorder.Code)
}

func (suite *EliminationBracketIntegrationTestSuite) TestMatchWinnerSynchronizesOpenFirstRoundBeforeSelectingWinner() {
	elimination, playerSets, adminCookies, _ := suite.createFixture(1, 2, []int{1, 4})
	recorder, _ := suite.postBracket(elimination.ID, adminCookies)
	suite.Equal(http.StatusOK, recorder.Code)

	// This rank write deliberately bypasses the roster mutation helper. The
	// match winner endpoint must re-sync before checking whether its selected
	// result is occupied.
	suite.Require().NoError(database.DB.Model(&database.PlayerSet{}).Where("id = ?", playerSets[1].ID).Update("rank", 3).Error)
	bracket := suite.loadBracket(elimination.ID)
	match := bracket.Stages[0].Matchs[1]
	winnerID := match.MatchResults[0].ID
	recorder, response := suite.putMatchWinner(match.ID, &winnerID, adminCookies)
	suite.Equal(http.StatusOK, recorder.Code, recorder.Body.String())
	suite.True(response.Changed)
	bracket = suite.loadBracket(elimination.ID)
	suite.Equal(playerSets[1].ID, *bracket.Stages[0].Matchs[1].MatchResults[0].PlayerSetId)
	suite.True(bracket.Stages[0].Matchs[1].MatchResults[0].IsWinner)
	suite.False(bracket.Stages[0].Matchs[1].MatchResults[1].IsWinner)
}

func (suite *EliminationBracketIntegrationTestSuite) TestMatchSettingsIsAtomicAndIdempotent() {
	elimination, _, adminCookies, _ := suite.createFixture(1, 4, nil)
	recorder, _ := suite.postBracket(elimination.ID, adminCookies)
	bracket := suite.loadBracket(elimination.ID)
	match := bracket.Stages[0].Matchs[0]
	winnerID := match.MatchResults[0].ID
	a := "A"
	body := MatchSettingsRequest{WinnerMatchResultID: &winnerID, Placements: []MatchResultPlacement{{MatchResultID: winnerID, LaneNumber: 0, Target: &a}, {MatchResultID: match.MatchResults[1].ID, LaneNumber: 0, Target: &a}}}
	recorder = suite.requestJSON(http.MethodPut, fmt.Sprintf("/elimination/match/settings/%d", match.ID), body, adminCookies)
	suite.Equal(http.StatusOK, recorder.Code, recorder.Body.String())
	var response MatchSettingsResponse
	suite.Require().NoError(json.Unmarshal(recorder.Body.Bytes(), &response))
	suite.True(response.Changed)
	bracket = suite.loadBracket(elimination.ID)
	suite.True(bracket.Stages[0].Matchs[0].MatchResults[0].IsWinner)
	suite.Equal(0, bracket.Stages[0].Matchs[0].MatchResults[0].LaneNumber)
	suite.Equal("A", *bracket.Stages[0].Matchs[0].MatchResults[0].Target)
	suite.Equal(0, bracket.Stages[0].Matchs[0].MatchResults[1].LaneNumber)
	suite.Equal("A", *bracket.Stages[0].Matchs[0].MatchResults[1].Target)
	recorder = suite.requestJSON(http.MethodPut, fmt.Sprintf("/elimination/match/settings/%d", match.ID), body, adminCookies)
	suite.Equal(http.StatusOK, recorder.Code)
	suite.Require().NoError(json.Unmarshal(recorder.Body.Bytes(), &response))
	suite.False(response.Changed)

	invalidTarget := "C"
	otherWinnerID := match.MatchResults[1].ID
	recorder = suite.requestJSON(http.MethodPut, fmt.Sprintf("/elimination/match/settings/%d", match.ID), MatchSettingsRequest{
		WinnerMatchResultID: &otherWinnerID,
		Placements: []MatchResultPlacement{
			{MatchResultID: match.MatchResults[0].ID, LaneNumber: 4, Target: &a},
			{MatchResultID: match.MatchResults[1].ID, LaneNumber: 4, Target: &invalidTarget},
		},
	}, adminCookies)
	suite.Equal(http.StatusBadRequest, recorder.Code)
	bracket = suite.loadBracket(elimination.ID)
	suite.True(bracket.Stages[0].Matchs[0].MatchResults[0].IsWinner)
	suite.False(bracket.Stages[0].Matchs[0].MatchResults[1].IsWinner)
	for _, result := range bracket.Stages[0].Matchs[0].MatchResults {
		suite.Equal(0, result.LaneNumber)
		suite.Require().NotNil(result.Target)
		suite.Equal("A", *result.Target)
	}
}

func (suite *EliminationBracketIntegrationTestSuite) TestMatchSettingsRollsBackPlacementWhenWinnerHasAdvanced() {
	elimination, _, adminCookies, _ := suite.createFixture(1, 4, nil)
	recorder, _ := suite.postBracket(elimination.ID, adminCookies)
	suite.Equal(http.StatusOK, recorder.Code)

	bracket := suite.loadBracket(elimination.ID)
	suite.markWinner(bracket, 0, 0, 0)
	suite.markWinner(bracket, 0, 1, 0)
	recorder, _ = suite.postAdvance(bracket.Stages[0].ID, adminCookies)
	suite.Equal(http.StatusOK, recorder.Code, recorder.Body.String())

	bracket = suite.loadBracket(elimination.ID)
	match := bracket.Stages[0].Matchs[0]
	// Attempt to switch the already-advanced source to the opposite winner.
	// Re-sending the existing winner is idempotent and must still permit a
	// placement-only correction after advancement.
	winnerID := match.MatchResults[1].ID
	a, b := "A", "B"
	recorder = suite.requestJSON(http.MethodPut, fmt.Sprintf("/elimination/match/settings/%d", match.ID), MatchSettingsRequest{
		WinnerMatchResultID: &winnerID,
		Placements:          []MatchResultPlacement{{MatchResultID: match.MatchResults[0].ID, LaneNumber: 9, Target: &a}, {MatchResultID: match.MatchResults[1].ID, LaneNumber: 9, Target: &b}},
	}, adminCookies)
	suite.Equal(http.StatusConflict, recorder.Code, recorder.Body.String())

	bracket = suite.loadBracket(elimination.ID)
	suite.True(bracket.Stages[0].Matchs[0].MatchResults[0].IsWinner)
	suite.Equal(0, bracket.Stages[0].Matchs[0].MatchResults[0].LaneNumber)
	suite.Nil(bracket.Stages[0].Matchs[0].MatchResults[0].Target)
	suite.Equal(0, bracket.Stages[0].Matchs[0].MatchResults[1].LaneNumber)
	suite.Nil(bracket.Stages[0].Matchs[0].MatchResults[1].Target)

	existingWinnerID := match.MatchResults[0].ID
	recorder = suite.requestJSON(http.MethodPut, fmt.Sprintf("/elimination/match/settings/%d", match.ID), MatchSettingsRequest{
		WinnerMatchResultID: &existingWinnerID,
		Placements:          []MatchResultPlacement{{MatchResultID: match.MatchResults[0].ID, LaneNumber: 9, Target: &a}, {MatchResultID: match.MatchResults[1].ID, LaneNumber: 9, Target: &b}},
	}, adminCookies)
	suite.Equal(http.StatusOK, recorder.Code, recorder.Body.String())
	bracket = suite.loadBracket(elimination.ID)
	suite.True(bracket.Stages[0].Matchs[0].MatchResults[0].IsWinner)
	suite.Equal(9, bracket.Stages[0].Matchs[0].MatchResults[0].LaneNumber)
	suite.Equal(9, bracket.Stages[0].Matchs[0].MatchResults[1].LaneNumber)
}

func (suite *EliminationBracketIntegrationTestSuite) TestMatchSettingsSupportsLegacyPlayerSets() {
	elimination, playerSets, adminCookies, _ := suite.createFixture(1, 2, nil)
	var match bracketMatch
	suite.Require().NoError(database.DB.Transaction(func(tx *gorm.DB) error {
		stage := database.Stage{EliminationId: elimination.ID}
		if err := tx.Create(&stage).Error; err != nil {
			return err
		}
		var err error
		match, err = createBracketMatch(tx, stage.ID, [2]*uint{}, elimination.TeamSize)
		return err
	}))
	a, b := "A", "B"
	winnerID := match.Results[0].ID
	body := MatchSettingsRequest{
		WinnerMatchResultID: &winnerID,
		PlayerSetIDs:        []uint{playerSets[0].ID, playerSets[1].ID},
		Placements:          []MatchResultPlacement{{MatchResultID: winnerID, LaneNumber: 4, Target: &a}, {MatchResultID: match.Results[1].ID, LaneNumber: 4, Target: &b}},
	}
	recorder := suite.requestJSON(http.MethodPut, fmt.Sprintf("/elimination/match/settings/%d", match.Match.ID), body, adminCookies)
	suite.Equal(http.StatusOK, recorder.Code, recorder.Body.String())

	loaded := suite.loadBracket(elimination.ID).Stages[0].Matchs[0]
	suite.Equal(playerSets[0].ID, *loaded.MatchResults[0].PlayerSetId)
	suite.Equal(playerSets[1].ID, *loaded.MatchResults[1].PlayerSetId)
	suite.True(loaded.MatchResults[0].IsWinner)
	medals, err := database.GetMedalInfoByEliminationId(elimination.ID)
	suite.Require().NoError(err)
	suite.Equal(playerSets[0].ID, medals[0].PlayerSetId)
	suite.Equal(playerSets[1].ID, medals[1].PlayerSetId)
	suite.Zero(medals[2].PlayerSetId)

	correction := body
	correction.PlayerSetIDs = []uint{playerSets[1].ID, playerSets[0].ID}
	recorder = suite.requestJSON(http.MethodPut, fmt.Sprintf("/elimination/match/settings/%d", match.Match.ID), correction, adminCookies)
	suite.Equal(http.StatusOK, recorder.Code, recorder.Body.String())
	medals, err = database.GetMedalInfoByEliminationId(elimination.ID)
	suite.Require().NoError(err)
	suite.Equal(playerSets[1].ID, medals[0].PlayerSetId)
	suite.Equal(playerSets[0].ID, medals[1].PlayerSetId)

	// Legacy single-final brackets have no supported PostAdvance path. Once
	// MatchSettings materializes their medals, later manual winner changes must
	// still atomically swap gold and silver.
	legacyOtherWinnerID := match.Results[1].ID
	recorder, winnerResponse := suite.putMatchWinner(match.Match.ID, &legacyOtherWinnerID, adminCookies)
	suite.Equal(http.StatusOK, recorder.Code, recorder.Body.String())
	suite.True(winnerResponse.Changed)
	medals, err = database.GetMedalInfoByEliminationId(elimination.ID)
	suite.Require().NoError(err)
	suite.Equal(playerSets[0].ID, medals[0].PlayerSetId)
	suite.Equal(playerSets[1].ID, medals[1].PlayerSetId)

	duplicateBody := body
	duplicateBody.PlayerSetIDs = []uint{playerSets[0].ID, playerSets[0].ID}
	duplicateBody.Placements = []MatchResultPlacement{{MatchResultID: match.Results[0].ID, LaneNumber: 8, Target: &a}, {MatchResultID: match.Results[1].ID, LaneNumber: 8, Target: &b}}
	recorder = suite.requestJSON(http.MethodPut, fmt.Sprintf("/elimination/match/settings/%d", match.Match.ID), duplicateBody, adminCookies)
	suite.Equal(http.StatusConflict, recorder.Code, recorder.Body.String())
	loaded = suite.loadBracket(elimination.ID).Stages[0].Matchs[0]
	suite.Equal(playerSets[1].ID, *loaded.MatchResults[0].PlayerSetId)
	suite.Equal(playerSets[0].ID, *loaded.MatchResults[1].PlayerSetId)
	suite.Equal(4, loaded.MatchResults[0].LaneNumber)
	suite.Equal(4, loaded.MatchResults[1].LaneNumber)
}

func (suite *EliminationBracketIntegrationTestSuite) TestManualMatchPlayerSetAssignmentAllowsStartedAndLaterMatches() {
	elimination, playerSets, adminCookies, _ := suite.createFixture(1, 4, nil)
	var firstStageMatch bracketMatch
	var finalStageMatch bracketMatch
	suite.Require().NoError(database.DB.Transaction(func(tx *gorm.DB) error {
		firstStage := database.Stage{EliminationId: elimination.ID}
		if err := tx.Create(&firstStage).Error; err != nil {
			return err
		}
		finalStage := database.Stage{EliminationId: elimination.ID}
		if err := tx.Create(&finalStage).Error; err != nil {
			return err
		}
		var err error
		firstStageMatch, err = createBracketMatch(tx, firstStage.ID, [2]*uint{}, elimination.TeamSize)
		if err != nil {
			return err
		}
		if _, err := createBracketMatch(tx, firstStage.ID, [2]*uint{}, elimination.TeamSize); err != nil {
			return err
		}
		finalStageMatch, err = createBracketMatch(tx, finalStage.ID, [2]*uint{}, elimination.TeamSize)
		if err != nil {
			return err
		}
		_, err = createBracketMatch(tx, finalStage.ID, [2]*uint{}, elimination.TeamSize)
		return err
	}))

	path := fmt.Sprintf("/elimination/match/playerset/%d", firstStageMatch.Match.ID)
	recorder := suite.requestJSON(http.MethodPatch, path, map[string]any{"player_set_ids": []uint{playerSets[0].ID, playerSets[1].ID}}, adminCookies)
	suite.Equal(http.StatusOK, recorder.Code, recorder.Body.String())
	loaded := suite.loadBracket(elimination.ID).Stages[0].Matchs[0]
	suite.Equal(playerSets[0].ID, *loaded.MatchResults[0].PlayerSetId)
	suite.Equal(playerSets[1].ID, *loaded.MatchResults[1].PlayerSetId)
	recorder = suite.requestJSON(http.MethodPatch, fmt.Sprintf("/elimination/match/playerset/%d", finalStageMatch.Match.ID), map[string]any{"player_set_ids": []uint{playerSets[2].ID, playerSets[3].ID}}, adminCookies)
	suite.Equal(http.StatusOK, recorder.Code, recorder.Body.String())

	recorder = suite.requestJSON(http.MethodPatch, fmt.Sprintf("/matchresult/shootoffscore/%d", loaded.MatchResults[0].ID), map[string]int{"shoot_off_score": 2}, nil)
	suite.Equal(http.StatusOK, recorder.Code, recorder.Body.String())
	recorder = suite.requestJSON(http.MethodPatch, path, map[string]any{"player_set_ids": []uint{playerSets[0].ID, playerSets[1].ID}}, adminCookies)
	suite.Equal(http.StatusOK, recorder.Code, recorder.Body.String())
	recorder = suite.requestJSON(http.MethodPatch, path, map[string]any{"player_set_ids": []uint{playerSets[2].ID, playerSets[3].ID}}, adminCookies)
	suite.Equal(http.StatusOK, recorder.Code, recorder.Body.String())
	loaded = suite.loadBracket(elimination.ID).Stages[0].Matchs[0]
	suite.Equal(playerSets[2].ID, *loaded.MatchResults[0].PlayerSetId)
	suite.Equal(playerSets[3].ID, *loaded.MatchResults[1].PlayerSetId)
	suite.Equal(2, loaded.MatchResults[0].ShootOffScore)
}

func (suite *EliminationBracketIntegrationTestSuite) TestCompleteLegacyEightSlotBracketAllowsFinalAssignmentWithThreePlayerSets() {
	elimination, playerSets, adminCookies, _ := suite.createFixture(1, 3, nil)
	var finalMatch bracketMatch
	suite.Require().NoError(database.DB.Transaction(func(tx *gorm.DB) error {
		stages := make([]database.Stage, 3)
		for index := range stages {
			stages[index] = database.Stage{EliminationId: elimination.ID}
			if err := tx.Create(&stages[index]).Error; err != nil {
				return err
			}
		}
		for index := 0; index < 4; index++ {
			if _, err := createBracketMatch(tx, stages[0].ID, [2]*uint{}, elimination.TeamSize); err != nil {
				return err
			}
		}
		for index := 0; index < 2; index++ {
			if _, err := createBracketMatch(tx, stages[1].ID, [2]*uint{}, elimination.TeamSize); err != nil {
				return err
			}
		}
		var err error
		finalMatch, err = createBracketMatch(tx, stages[2].ID, [2]*uint{}, elimination.TeamSize)
		if err != nil {
			return err
		}
		_, err = createBracketMatch(tx, stages[2].ID, [2]*uint{}, elimination.TeamSize)
		return err
	}))
	recorder := suite.requestJSON(http.MethodPatch, fmt.Sprintf("/elimination/match/playerset/%d", finalMatch.Match.ID), map[string]any{"player_set_ids": []uint{playerSets[0].ID, playerSets[1].ID}}, adminCookies)
	suite.Equal(http.StatusOK, recorder.Code, recorder.Body.String())
}

func (suite *EliminationBracketIntegrationTestSuite) TestGeneratedBracketManualAssignmentAllowsLaterRoundsAndLockedRoster() {
	elimination, playerSets, adminCookies, _ := suite.createFixture(1, 4, nil)
	recorder, _ := suite.postBracket(elimination.ID, adminCookies)
	suite.Equal(http.StatusOK, recorder.Code, recorder.Body.String())
	bracket := suite.loadBracket(elimination.ID)

	laterRoundPath := fmt.Sprintf("/elimination/match/playerset/%d", bracket.Stages[1].Matchs[0].ID)
	recorder = suite.requestJSON(http.MethodPatch, laterRoundPath, map[string]any{"player_set_ids": []uint{playerSets[0].ID, playerSets[1].ID}}, adminCookies)
	suite.Equal(http.StatusOK, recorder.Code, recorder.Body.String())

	suite.Require().NoError(database.DB.Model(&database.Elimination{}).Where("id = ?", elimination.ID).Update("bracket_roster_locked", true).Error)
	firstRoundPath := fmt.Sprintf("/elimination/match/playerset/%d", bracket.Stages[0].Matchs[0].ID)
	recorder = suite.requestJSON(http.MethodPatch, firstRoundPath, map[string]any{"player_set_ids": []uint{playerSets[3].ID, playerSets[0].ID}}, adminCookies)
	suite.Equal(http.StatusOK, recorder.Code, recorder.Body.String())
	recorder = suite.requestJSON(http.MethodPatch, firstRoundPath, map[string]any{"player_set_ids": []uint{playerSets[0].ID, playerSets[3].ID}}, adminCookies)
	suite.Equal(http.StatusOK, recorder.Code, recorder.Body.String())
}

func (suite *EliminationBracketIntegrationTestSuite) TestManualCorrectionReprojectsAdvancedWinnerAndPreservesTargetScore() {
	elimination, _, adminCookies, _ := suite.createFixture(1, 4, nil)
	recorder, _ := suite.postBracket(elimination.ID, adminCookies)
	suite.Equal(http.StatusOK, recorder.Code, recorder.Body.String())
	bracket := suite.loadBracket(elimination.ID)
	suite.markWinner(bracket, 0, 0, 0)
	suite.markWinner(bracket, 0, 1, 0)
	recorder, _ = suite.postAdvance(bracket.Stages[0].ID, adminCookies)
	suite.Equal(http.StatusOK, recorder.Code, recorder.Body.String())

	bracket = suite.loadBracket(elimination.ID)
	source := bracket.Stages[0].Matchs[0]
	goldTarget := bracket.Stages[1].Matchs[0].MatchResults[0]
	suite.Require().NotNil(source.MatchResults[0].PlayerSetId)
	suite.Require().NotNil(source.MatchResults[1].PlayerSetId)
	recorder = suite.requestJSON(http.MethodPatch, fmt.Sprintf("/matchresult/shootoffscore/%d", goldTarget.ID), map[string]int{"shoot_off_score": 17}, nil)
	suite.Equal(http.StatusOK, recorder.Code, recorder.Body.String())

	recorder = suite.requestJSON(http.MethodPatch, fmt.Sprintf("/elimination/match/playerset/%d", source.ID), map[string]any{"player_set_ids": []uint{*source.MatchResults[1].PlayerSetId, *source.MatchResults[0].PlayerSetId}}, adminCookies)
	suite.Equal(http.StatusOK, recorder.Code, recorder.Body.String())
	bracket = suite.loadBracket(elimination.ID)
	correctedSource := bracket.Stages[0].Matchs[0]
	correctedTarget := bracket.Stages[1].Matchs[0].MatchResults[0]
	suite.True(correctedSource.MatchResults[0].IsWinner)
	suite.Equal(*correctedSource.MatchResults[0].PlayerSetId, *correctedTarget.PlayerSetId)
	suite.Equal(17, correctedTarget.ShootOffScore)
}

func (suite *EliminationBracketIntegrationTestSuite) TestManualLaterRoundCorrectionCanScoreAndReprojectsFinalMedals() {
	elimination, _, adminCookies, _ := suite.createFixture(1, 4, nil)
	recorder, _ := suite.postBracket(elimination.ID, adminCookies)
	suite.Equal(http.StatusOK, recorder.Code, recorder.Body.String())
	bracket := suite.loadBracket(elimination.ID)
	suite.markWinner(bracket, 0, 0, 0)
	suite.markWinner(bracket, 0, 1, 0)
	recorder, _ = suite.postAdvance(bracket.Stages[0].ID, adminCookies)
	suite.Equal(http.StatusOK, recorder.Code, recorder.Body.String())

	bracket = suite.loadBracket(elimination.ID)
	gold := bracket.Stages[1].Matchs[0]
	suite.Require().NotNil(gold.MatchResults[0].PlayerSetId)
	suite.Require().NotNil(gold.MatchResults[1].PlayerSetId)
	firstID, secondID := *gold.MatchResults[0].PlayerSetId, *gold.MatchResults[1].PlayerSetId
	recorder = suite.requestJSON(http.MethodPatch, fmt.Sprintf("/elimination/match/playerset/%d", gold.ID), map[string]any{"player_set_ids": []uint{secondID, firstID}}, adminCookies)
	suite.Equal(http.StatusOK, recorder.Code, recorder.Body.String())

	bracket = suite.loadBracket(elimination.ID)
	gold = bracket.Stages[1].Matchs[0]
	recorder = suite.requestJSON(http.MethodPatch, fmt.Sprintf("/matchresult/shootoffscore/%d", gold.MatchResults[0].ID), map[string]int{"shoot_off_score": 19}, nil)
	suite.Equal(http.StatusOK, recorder.Code, recorder.Body.String())
	recorder, _ = suite.putMatchWinner(gold.ID, &gold.MatchResults[0].ID, adminCookies)
	suite.Equal(http.StatusOK, recorder.Code, recorder.Body.String())
	bracket = suite.loadBracket(elimination.ID)
	suite.markWinner(bracket, 1, 1, 0)
	recorder, _ = suite.postAdvance(bracket.Stages[1].ID, adminCookies)
	suite.Equal(http.StatusOK, recorder.Code, recorder.Body.String())
	medals, err := database.GetMedalInfoByEliminationId(elimination.ID)
	suite.Require().NoError(err)
	suite.Equal(secondID, medals[0].PlayerSetId)

	// The final has already been awarded. Swapping its two identities retains
	// the score/winner slot and immediately rewrites the materialized medals.
	recorder = suite.requestJSON(http.MethodPatch, fmt.Sprintf("/elimination/match/playerset/%d", gold.ID), map[string]any{"player_set_ids": []uint{firstID, secondID}}, adminCookies)
	suite.Equal(http.StatusOK, recorder.Code, recorder.Body.String())
	bracket = suite.loadBracket(elimination.ID)
	suite.True(bracket.Stages[1].Matchs[0].MatchResults[0].IsWinner)
	suite.Equal(19, bracket.Stages[1].Matchs[0].MatchResults[0].ShootOffScore)
	medals, err = database.GetMedalInfoByEliminationId(elimination.ID)
	suite.Require().NoError(err)
	suite.Equal(firstID, medals[0].PlayerSetId)
}

func (suite *EliminationBracketIntegrationTestSuite) TestManualSourceCorrectionAfterFinalReprojectsDescendantsAndMedals() {
	elimination, _, adminCookies, _ := suite.createFixture(1, 4, nil)
	recorder, _ := suite.postBracket(elimination.ID, adminCookies)
	suite.Equal(http.StatusOK, recorder.Code, recorder.Body.String())
	bracket := suite.loadBracket(elimination.ID)
	suite.markWinner(bracket, 0, 0, 0)
	suite.markWinner(bracket, 0, 1, 0)
	recorder, _ = suite.postAdvance(bracket.Stages[0].ID, adminCookies)
	suite.Equal(http.StatusOK, recorder.Code, recorder.Body.String())

	bracket = suite.loadBracket(elimination.ID)
	source := bracket.Stages[0].Matchs[0]
	gold := bracket.Stages[1].Matchs[0]
	bronze := bracket.Stages[1].Matchs[1]
	suite.Require().NotNil(source.MatchResults[0].PlayerSetId)
	suite.Require().NotNil(source.MatchResults[1].PlayerSetId)
	suite.Require().NotNil(gold.MatchResults[0].PlayerSetId)
	suite.Require().NotNil(bronze.MatchResults[0].PlayerSetId)
	recorder = suite.requestJSON(http.MethodPatch, fmt.Sprintf("/matchresult/shootoffscore/%d", gold.MatchResults[0].ID), map[string]int{"shoot_off_score": 23}, nil)
	suite.Equal(http.StatusOK, recorder.Code, recorder.Body.String())
	suite.markWinner(bracket, 1, 0, 0)
	suite.markWinner(bracket, 1, 1, 0)
	recorder, _ = suite.postAdvance(bracket.Stages[1].ID, adminCookies)
	suite.Equal(http.StatusOK, recorder.Code, recorder.Body.String())

	recorder = suite.requestJSON(http.MethodPatch, fmt.Sprintf("/elimination/match/playerset/%d", source.ID), map[string]any{"player_set_ids": []uint{*source.MatchResults[1].PlayerSetId, *source.MatchResults[0].PlayerSetId}}, adminCookies)
	suite.Equal(http.StatusOK, recorder.Code, recorder.Body.String())
	bracket = suite.loadBracket(elimination.ID)
	source = bracket.Stages[0].Matchs[0]
	gold = bracket.Stages[1].Matchs[0]
	bronze = bracket.Stages[1].Matchs[1]
	suite.True(source.MatchResults[0].IsWinner)
	suite.Equal(*source.MatchResults[0].PlayerSetId, *gold.MatchResults[0].PlayerSetId)
	suite.Equal(*source.MatchResults[1].PlayerSetId, *bronze.MatchResults[0].PlayerSetId)
	suite.True(gold.MatchResults[0].IsWinner)
	suite.Equal(23, gold.MatchResults[0].ShootOffScore)
	medals, err := database.GetMedalInfoByEliminationId(elimination.ID)
	suite.Require().NoError(err)
	suite.Equal(*gold.MatchResults[0].PlayerSetId, medals[0].PlayerSetId)
	suite.Equal(*bronze.MatchResults[0].PlayerSetId, medals[2].PlayerSetId)
}

func (suite *EliminationBracketIntegrationTestSuite) TestManualCrossMatchSwapBatchProjectsAllDecidedSources() {
	elimination, _, adminCookies, _ := suite.createFixture(1, 4, nil)
	recorder, _ := suite.postBracket(elimination.ID, adminCookies)
	suite.Equal(http.StatusOK, recorder.Code, recorder.Body.String())
	bracket := suite.loadBracket(elimination.ID)
	suite.markWinner(bracket, 0, 0, 0)
	suite.markWinner(bracket, 0, 1, 0)
	recorder, _ = suite.postAdvance(bracket.Stages[0].ID, adminCookies)
	suite.Equal(http.StatusOK, recorder.Code, recorder.Body.String())
	bracket = suite.loadBracket(elimination.ID)
	first, second := bracket.Stages[0].Matchs[0], bracket.Stages[0].Matchs[1]
	firstOriginal0, firstOriginal1 := *first.MatchResults[0].PlayerSetId, *first.MatchResults[1].PlayerSetId
	recorder = suite.requestJSON(http.MethodPatch, fmt.Sprintf("/elimination/match/playerset/%d", first.ID), map[string]any{"player_set_ids": []uint{*second.MatchResults[0].PlayerSetId, *second.MatchResults[1].PlayerSetId}}, adminCookies)
	suite.Equal(http.StatusOK, recorder.Code, recorder.Body.String())
	bracket = suite.loadBracket(elimination.ID)
	first, second = bracket.Stages[0].Matchs[0], bracket.Stages[0].Matchs[1]
	gold, bronze := bracket.Stages[1].Matchs[0], bracket.Stages[1].Matchs[1]
	// Projection order is deterministic: first destination's displaced pair
	// returns to first requested external source, then second to second.
	suite.Equal(firstOriginal0, *second.MatchResults[0].PlayerSetId)
	suite.Equal(firstOriginal1, *second.MatchResults[1].PlayerSetId)
	suite.Equal(*first.MatchResults[0].PlayerSetId, *gold.MatchResults[0].PlayerSetId)
	suite.Equal(*second.MatchResults[0].PlayerSetId, *gold.MatchResults[1].PlayerSetId)
	suite.Equal(*first.MatchResults[1].PlayerSetId, *bronze.MatchResults[0].PlayerSetId)
	suite.Equal(*second.MatchResults[1].PlayerSetId, *bronze.MatchResults[1].PlayerSetId)
}

func (suite *EliminationBracketIntegrationTestSuite) TestLegacyTwoSemiFinalsIntoOneGoldFinalCorrection() {
	elimination, playerSets, adminCookies, _ := suite.createFixture(1, 4, nil)
	var firstStage, finalStage database.Stage
	suite.Require().NoError(database.DB.Transaction(func(tx *gorm.DB) error {
		var err error
		firstStage = database.Stage{EliminationId: elimination.ID}
		if err = tx.Create(&firstStage).Error; err != nil {
			return err
		}
		finalStage = database.Stage{EliminationId: elimination.ID}
		if err = tx.Create(&finalStage).Error; err != nil {
			return err
		}
		if _, err = createBracketMatch(tx, firstStage.ID, [2]*uint{&playerSets[0].ID, &playerSets[3].ID}, 1); err != nil {
			return err
		}
		if _, err = createBracketMatch(tx, firstStage.ID, [2]*uint{&playerSets[2].ID, &playerSets[1].ID}, 1); err != nil {
			return err
		}
		_, err = createBracketMatch(tx, finalStage.ID, [2]*uint{}, 1)
		return err
	}))
	bracket := suite.loadBracket(elimination.ID)
	suite.markWinner(bracket, 0, 0, 0)
	suite.markWinner(bracket, 0, 1, 0)
	suite.Require().NoError(database.DB.Transaction(func(tx *gorm.DB) error {
		loaded, err := loadBracket(tx, elimination.ID)
		if err != nil {
			return err
		}
		_, err = projectDecidedStages(tx, loaded, 0, map[int]bool{0: true, 1: true}, false, true)
		return err
	}))
	bracket = suite.loadBracket(elimination.ID)
	gold := bracket.Stages[1].Matchs[0]
	suite.markWinner(bracket, 1, 0, 0)
	suite.Require().NoError(database.DB.Transaction(func(tx *gorm.DB) error {
		loaded, err := loadBracket(tx, elimination.ID)
		if err != nil {
			return err
		}
		_, err = reprojectBracketMedals(tx, elimination.ID, bracketStage{Stage: loaded[1].Stage, Matches: loaded[1].Matches})
		return err
	}))
	// Bronze is legacy/manual data, not derivable from this topology.
	suite.Require().NoError(database.DB.Model(&database.Medal{}).Where("elimination_id = ? AND type = ?", elimination.ID, 2).Update("player_set_id", playerSets[1].ID).Error)

	semi := bracket.Stages[0].Matchs[0]
	recorder := suite.requestJSON(http.MethodPatch, fmt.Sprintf("/elimination/match/playerset/%d", semi.ID), map[string]any{"player_set_ids": []uint{playerSets[3].ID, playerSets[0].ID}}, adminCookies)
	suite.Equal(http.StatusOK, recorder.Code, recorder.Body.String())
	bracket = suite.loadBracket(elimination.ID)
	gold = bracket.Stages[1].Matchs[0]
	suite.Equal(playerSets[3].ID, *gold.MatchResults[0].PlayerSetId)
	medals, err := database.GetMedalInfoByEliminationId(elimination.ID)
	suite.Require().NoError(err)
	suite.Equal(playerSets[3].ID, medals[0].PlayerSetId)
	suite.Equal(playerSets[2].ID, medals[1].PlayerSetId)
	suite.Equal(playerSets[1].ID, medals[2].PlayerSetId)

	secondWinnerID := bracket.Stages[0].Matchs[0].MatchResults[1].ID
	recorder, _ = suite.putMatchWinner(semi.ID, &secondWinnerID, adminCookies)
	suite.Equal(http.StatusConflict, recorder.Code, recorder.Body.String())
	bracket = suite.loadBracket(elimination.ID)
	suite.Equal(playerSets[3].ID, *bracket.Stages[1].Matchs[0].MatchResults[0].PlayerSetId)
	medals, err = database.GetMedalInfoByEliminationId(elimination.ID)
	suite.Require().NoError(err)
	suite.Equal(playerSets[3].ID, medals[0].PlayerSetId)
	suite.Equal(playerSets[2].ID, medals[1].PlayerSetId)
	suite.Equal(playerSets[1].ID, medals[2].PlayerSetId)
}

func (suite *EliminationBracketIntegrationTestSuite) TestBatchProjectorDeterministicallyPermutesExternalStaleSlots() {
	elimination, _, adminCookies, _ := suite.createFixture(1, 8, nil)
	recorder, _ := suite.postBracket(elimination.ID, adminCookies)
	suite.Equal(http.StatusOK, recorder.Code, recorder.Body.String())
	bracket := suite.loadBracket(elimination.ID)

	// Only the first two sources are decided. Their wanted A/B slots in the
	// next stage are deliberately held by the other match; C/D occupy the two
	// actual destinations. The batch must move C to A's old slot and D to B's
	// old slot, retaining each external slot's score and winner state.
	firstSource := bracket.Stages[0].Matchs[0]
	secondSource := bracket.Stages[0].Matchs[1]
	thirdSource := bracket.Stages[0].Matchs[2]
	fourthSource := bracket.Stages[0].Matchs[3]
	firstWinner := *firstSource.MatchResults[0].PlayerSetId
	secondWinner := *secondSource.MatchResults[0].PlayerSetId
	thirdWinner := *thirdSource.MatchResults[0].PlayerSetId
	fourthWinner := *fourthSource.MatchResults[0].PlayerSetId
	firstTarget := bracket.Stages[1].Matchs[0]
	externalTarget := bracket.Stages[1].Matchs[1]

	// C/D are old destinations; A/B are external slots with distinguishable
	// match state. Both stage-one matches already have a selected winner, so
	// the subsequent stage advance also proves the swapped sibling continues.
	suite.Require().NoError(database.DB.Model(&database.MatchResult{}).Where("id = ?", firstTarget.MatchResults[0].ID).Updates(map[string]interface{}{"player_set_id": thirdWinner, "shoot_off_score": 13, "is_winner": true}).Error)
	suite.Require().NoError(database.DB.Model(&database.MatchResult{}).Where("id = ?", firstTarget.MatchResults[1].ID).Updates(map[string]interface{}{"player_set_id": fourthWinner, "shoot_off_score": 7}).Error)
	suite.Require().NoError(database.DB.Model(&database.MatchResult{}).Where("id = ?", externalTarget.MatchResults[0].ID).Updates(map[string]interface{}{"player_set_id": firstWinner, "shoot_off_score": 31, "is_winner": true}).Error)
	suite.Require().NoError(database.DB.Model(&database.MatchResult{}).Where("id = ?", externalTarget.MatchResults[1].ID).Updates(map[string]interface{}{"player_set_id": secondWinner, "shoot_off_score": 17}).Error)

	suite.markWinner(bracket, 0, 0, 0)
	suite.markWinner(bracket, 0, 1, 0)
	// The public stage-advance endpoint deliberately requires every source
	// match to be decided. Exercise its shared batch projector with just the
	// two completed sources, which is the recovery path that has external
	// target slots and therefore needs the deterministic permutation.
	suite.Require().NoError(database.DB.Transaction(func(tx *gorm.DB) error {
		loaded, err := loadBracket(tx, elimination.ID)
		if err != nil {
			return err
		}
		_, err = projectDecidedStages(tx, loaded, 0, map[int]bool{0: true, 1: true}, false, true)
		return err
	}))
	bracket = suite.loadBracket(elimination.ID)
	firstTarget = bracket.Stages[1].Matchs[0]
	externalTarget = bracket.Stages[1].Matchs[1]
	suite.Equal(firstWinner, *firstTarget.MatchResults[0].PlayerSetId)
	suite.Equal(secondWinner, *firstTarget.MatchResults[1].PlayerSetId)
	suite.Equal(thirdWinner, *externalTarget.MatchResults[0].PlayerSetId)
	suite.Equal(fourthWinner, *externalTarget.MatchResults[1].PlayerSetId)
	suite.Equal(31, externalTarget.MatchResults[0].ShootOffScore)
	suite.True(externalTarget.MatchResults[0].IsWinner)
	suite.Equal(17, externalTarget.MatchResults[1].ShootOffScore)

	// The external winner is now C, not stale A, and must reach the gold
	// final; the same deterministic pairing must therefore survive the next
	// projection and final medal assignment.
	// Batch cascading reaches both final matches. Finalizing then verifies
	// their identities award the corresponding medals.
	gold, bronze := bracket.Stages[2].Matchs[0], bracket.Stages[2].Matchs[1]
	suite.Equal(firstWinner, *gold.MatchResults[0].PlayerSetId)
	suite.Equal(thirdWinner, *gold.MatchResults[1].PlayerSetId)
	suite.Equal(secondWinner, *bronze.MatchResults[0].PlayerSetId)
	suite.Equal(fourthWinner, *bronze.MatchResults[1].PlayerSetId)
	suite.markWinner(bracket, 2, 0, 0)
	suite.markWinner(bracket, 2, 1, 0)
	recorder, _ = suite.postAdvance(bracket.Stages[2].ID, adminCookies)
	suite.Equal(http.StatusOK, recorder.Code, recorder.Body.String())
	medals, err := database.GetMedalInfoByEliminationId(elimination.ID)
	suite.Require().NoError(err)
	suite.Equal(firstWinner, medals[0].PlayerSetId)
	suite.Equal(thirdWinner, medals[1].PlayerSetId)
	suite.Equal(secondWinner, medals[2].PlayerSetId)
}

func (suite *EliminationBracketIntegrationTestSuite) TestGeneratedBracketManualSwapLocksAutoRosterAndCanAdvance() {
	elimination, playerSets, adminCookies, _ := suite.createFixture(1, 5, nil)
	recorder := suite.requestJSON(http.MethodPost, fmt.Sprintf("/elimination/bracket/%d", elimination.ID), BracketInitRequest{AdvancingCount: 4}, adminCookies)
	suite.Equal(http.StatusOK, recorder.Code, recorder.Body.String())
	bracket := suite.loadBracket(elimination.ID)
	firstMatch := bracket.Stages[0].Matchs[0]
	path := fmt.Sprintf("/elimination/match/playerset/%d", firstMatch.ID)

	// Rank 5 is a reserve. Manual recovery swaps rank 2 from its other first
	// round match and admits the reserve, without duplicating a team or
	// rewriting ranking data.
	recorder = suite.requestJSON(http.MethodPatch, path, map[string]any{"player_set_ids": []uint{playerSets[4].ID, playerSets[1].ID}}, adminCookies)
	suite.Equal(http.StatusOK, recorder.Code, recorder.Body.String())
	bracket = suite.loadBracket(elimination.ID)
	suite.Equal(playerSets[4].ID, *bracket.Stages[0].Matchs[0].MatchResults[0].PlayerSetId)
	suite.Equal(playerSets[1].ID, *bracket.Stages[0].Matchs[0].MatchResults[1].PlayerSetId)
	firstRoundIDs := map[uint]bool{}
	for _, match := range bracket.Stages[0].Matchs {
		for _, result := range match.MatchResults {
			if result.PlayerSetId != nil {
				suite.False(firstRoundIDs[*result.PlayerSetId], "first round must not duplicate a PlayerSet")
				firstRoundIDs[*result.PlayerSetId] = true
			}
		}
	}

	var ranked []database.PlayerSet
	suite.Require().NoError(database.DB.Where("elimination_id = ?", elimination.ID).Order("id asc").Find(&ranked).Error)
	ranks := map[uint]int{}
	for _, playerSet := range ranked {
		ranks[playerSet.ID] = playerSet.Rank
	}
	suite.Equal(5, ranks[playerSets[4].ID])
	suite.Equal(2, ranks[playerSets[1].ID])
	suite.Equal(1, ranks[playerSets[0].ID])
	suite.Equal(4, ranks[playerSets[3].ID])

	recorder, syncResponse := suite.postFirstRoundSync(elimination.ID, adminCookies)
	suite.Equal(http.StatusConflict, recorder.Code, recorder.Body.String())
	suite.False(syncResponse.Changed)
	winnerID := bracket.Stages[0].Matchs[0].MatchResults[0].ID
	recorder, _ = suite.putMatchWinner(bracket.Stages[0].Matchs[0].ID, &winnerID, adminCookies)
	suite.Equal(http.StatusOK, recorder.Code, recorder.Body.String())
	bracket = suite.loadBracket(elimination.ID)
	suite.markWinner(bracket, 0, 1, 0)
	recorder, _ = suite.postAdvance(bracket.Stages[0].ID, adminCookies)
	suite.Equal(http.StatusOK, recorder.Code, recorder.Body.String())
}

func (suite *EliminationBracketIntegrationTestSuite) TestGeneratedBracketCanPromoteZeroRankReserveAndLocksAutoRoster() {
	elimination, playerSets, adminCookies, _ := suite.createFixture(1, 4, nil)
	reserve, err := database.CreatePlayerSet(database.PlayerSet{EliminationId: elimination.ID, Rank: 0, SetName: "zero-rank-reserve"})
	suite.Require().NoError(err)
	recorder := suite.requestJSON(http.MethodPost, fmt.Sprintf("/elimination/bracket/%d", elimination.ID), BracketInitRequest{AdvancingCount: 4}, adminCookies)
	suite.Equal(http.StatusOK, recorder.Code, recorder.Body.String())
	bracket := suite.loadBracket(elimination.ID)
	path := fmt.Sprintf("/elimination/match/playerset/%d", bracket.Stages[0].Matchs[0].ID)
	recorder = suite.requestJSON(http.MethodPatch, path, map[string]any{"player_set_ids": []uint{reserve.ID, playerSets[1].ID}}, adminCookies)
	suite.Equal(http.StatusOK, recorder.Code, recorder.Body.String())
	recorder, syncResponse := suite.postFirstRoundSync(elimination.ID, adminCookies)
	suite.Equal(http.StatusConflict, recorder.Code, recorder.Body.String())
	suite.False(syncResponse.Changed)
	bracket = suite.loadBracket(elimination.ID)
	suite.Equal(reserve.ID, *bracket.Stages[0].Matchs[0].MatchResults[0].PlayerSetId)
}

func (suite *EliminationBracketIntegrationTestSuite) TestLegacyWinnerMutationRejectsPopulatedDownstream() {
	elimination, _, adminCookies, _ := suite.createFixture(1, 4, nil)
	recorder, _ := suite.postBracket(elimination.ID, adminCookies)
	suite.Equal(http.StatusOK, recorder.Code)
	bracket := suite.loadBracket(elimination.ID)
	source := bracket.Stages[0].Matchs[0].MatchResults[0]
	target := bracket.Stages[1].Matchs[0].MatchResults[0]
	suite.Require().NotNil(source.PlayerSetId)
	suite.Require().NoError(database.DB.Model(&database.Elimination{}).Where("id = ?", elimination.ID).Update("bracket_seed_count", 0).Error)
	suite.Require().NoError(database.DB.Model(&database.MatchResult{}).Where("id = ?", target.ID).Update("player_set_id", *source.PlayerSetId).Error)

	recorder = suite.requestJSON(http.MethodPatch, fmt.Sprintf("/matchresult/iswinner/%d", source.ID), map[string]bool{"is_winner": true}, adminCookies)
	suite.Equal(http.StatusConflict, recorder.Code, recorder.Body.String())
	var reloaded database.MatchResult
	suite.Require().NoError(database.DB.First(&reloaded, source.ID).Error)
	suite.False(reloaded.IsWinner)
}

func (suite *EliminationBracketIntegrationTestSuite) TestAdvanceOverwritesStaleTargetProjection() {
	elimination, playerSets, adminCookies, _ := suite.createFixture(1, 4, nil)
	recorder, _ := suite.postBracket(elimination.ID, adminCookies)
	suite.Equal(http.StatusOK, recorder.Code)

	bracket := suite.loadBracket(elimination.ID)
	suite.markWinner(bracket, 0, 0, 0)
	suite.markWinner(bracket, 0, 1, 0)
	targetResultID := bracket.Stages[1].Matchs[0].MatchResults[0].ID
	conflictingPlayerSetID := playerSets[3].ID
	suite.Require().NoError(database.DB.Model(&database.MatchResult{}).Where("id = ?", targetResultID).Update("player_set_id", conflictingPlayerSetID).Error)

	recorder, _ = suite.postAdvance(bracket.Stages[0].ID, adminCookies)
	suite.Equal(http.StatusOK, recorder.Code)
	var target database.MatchResult
	suite.Require().NoError(database.DB.First(&target, targetResultID).Error)
	suite.NotNil(target.PlayerSetId)
	suite.Equal(*bracket.Stages[0].Matchs[0].MatchResults[0].PlayerSetId, *target.PlayerSetId)
}

func (suite *EliminationBracketIntegrationTestSuite) TestAdvanceBatchRepairsStaleSwappedSiblingTargets() {
	elimination, _, adminCookies, _ := suite.createFixture(1, 4, nil)
	recorder, _ := suite.postBracket(elimination.ID, adminCookies)
	suite.Equal(http.StatusOK, recorder.Code, recorder.Body.String())
	bracket := suite.loadBracket(elimination.ID)
	suite.markWinner(bracket, 0, 0, 0)
	suite.markWinner(bracket, 0, 1, 0)
	firstWinner := *bracket.Stages[0].Matchs[0].MatchResults[0].PlayerSetId
	secondWinner := *bracket.Stages[0].Matchs[1].MatchResults[0].PlayerSetId
	firstTarget := bracket.Stages[1].Matchs[0].MatchResults[0]
	secondTarget := bracket.Stages[1].Matchs[0].MatchResults[1]
	suite.Require().NoError(database.DB.Model(&database.MatchResult{}).Where("id = ?", firstTarget.ID).Update("player_set_id", secondWinner).Error)
	suite.Require().NoError(database.DB.Model(&database.MatchResult{}).Where("id = ?", secondTarget.ID).Update("player_set_id", firstWinner).Error)

	recorder, _ = suite.postAdvance(bracket.Stages[0].ID, adminCookies)
	suite.Equal(http.StatusOK, recorder.Code, recorder.Body.String())
	bracket = suite.loadBracket(elimination.ID)
	suite.Equal(firstWinner, *bracket.Stages[1].Matchs[0].MatchResults[0].PlayerSetId)
	suite.Equal(secondWinner, *bracket.Stages[1].Matchs[0].MatchResults[1].PlayerSetId)
}

func (suite *EliminationBracketIntegrationTestSuite) TestAdvanceIgnoresPlacementMetadataOnEmptyTargetSlot() {
	elimination, _, adminCookies, _ := suite.createFixture(1, 4, nil)
	recorder, _ := suite.postBracket(elimination.ID, adminCookies)
	suite.Equal(http.StatusOK, recorder.Code)

	bracket := suite.loadBracket(elimination.ID)
	suite.markWinner(bracket, 0, 0, 0)
	suite.markWinner(bracket, 0, 1, 0)
	winnerPlayerSetID := *bracket.Stages[0].Matchs[0].MatchResults[0].PlayerSetId
	targetResultID := bracket.Stages[1].Matchs[0].MatchResults[0].ID
	suite.Require().NoError(database.DB.Model(&database.MatchResult{}).Where("id = ?", targetResultID).Update("lane_number", 7).Error)

	recorder, _ = suite.postAdvance(bracket.Stages[0].ID, adminCookies)
	suite.Equal(http.StatusOK, recorder.Code)
	var target database.MatchResult
	suite.Require().NoError(database.DB.First(&target, targetResultID).Error)
	suite.NotNil(target.PlayerSetId)
	suite.Equal(winnerPlayerSetID, *target.PlayerSetId)
	suite.Equal(7, target.LaneNumber)
}

func (suite *EliminationBracketIntegrationTestSuite) TestCompleteBracketRejectsLegacyStructuralAndMedalWriters() {
	elimination, playerSets, adminCookies, _ := suite.createFixture(1, 4, nil)
	recorder, _ := suite.postBracket(elimination.ID, adminCookies)
	suite.Equal(http.StatusOK, recorder.Code)

	bracket := suite.loadBracket(elimination.ID)
	resultID := bracket.Stages[0].Matchs[0].MatchResults[0].ID
	var resultCountBefore, endCountBefore, scoreCountBefore int64
	suite.Require().NoError(database.DB.Model(&database.MatchResult{}).Count(&resultCountBefore).Error)
	suite.Require().NoError(database.DB.Model(&database.MatchEnd{}).Count(&endCountBefore).Error)
	suite.Require().NoError(database.DB.Model(&database.MatchScore{}).Count(&scoreCountBefore).Error)

	recorder = suite.request(http.MethodDelete, fmt.Sprintf("/matchresult/%d", resultID), nil)
	suite.Equal(http.StatusForbidden, recorder.Code)
	recorder = suite.request(http.MethodDelete, fmt.Sprintf("/matchresult/%d", resultID), adminCookies)
	suite.Equal(http.StatusConflict, recorder.Code)

	matchEndBody := map[string]any{"match_result_id": resultID, "team_size": elimination.TeamSize}
	recorder = suite.requestJSON(http.MethodPost, "/matchresult/matchend", matchEndBody, nil)
	suite.Equal(http.StatusForbidden, recorder.Code)
	recorder = suite.requestJSON(http.MethodPost, "/matchresult/matchend", matchEndBody, adminCookies)
	suite.Equal(http.StatusConflict, recorder.Code)

	medals, err := database.GetMedalInfoByEliminationId(elimination.ID)
	suite.Require().NoError(err)
	suite.Require().NotEmpty(medals)
	medalBody := map[string]any{"player_set_id": playerSets[0].ID}
	recorder = suite.requestJSON(http.MethodPatch, fmt.Sprintf("/medal/playersetid/%d", medals[0].ID), medalBody, nil)
	suite.Equal(http.StatusForbidden, recorder.Code)
	recorder = suite.requestJSON(http.MethodPatch, fmt.Sprintf("/medal/playersetid/%d", medals[0].ID), medalBody, adminCookies)
	suite.Equal(http.StatusConflict, recorder.Code)

	var resultCountAfter, endCountAfter, scoreCountAfter int64
	suite.Require().NoError(database.DB.Model(&database.MatchResult{}).Count(&resultCountAfter).Error)
	suite.Require().NoError(database.DB.Model(&database.MatchEnd{}).Count(&endCountAfter).Error)
	suite.Require().NoError(database.DB.Model(&database.MatchScore{}).Count(&scoreCountAfter).Error)
	suite.Equal(resultCountBefore, resultCountAfter)
	suite.Equal(endCountBefore, endCountAfter)
	suite.Equal(scoreCountBefore, scoreCountAfter)
	updatedMedal, err := database.GetMedalById(medals[0].ID)
	suite.Require().NoError(err)
	suite.Zero(updatedMedal.PlayerSetId)
}

func (suite *EliminationBracketIntegrationTestSuite) TestRosterOpenSyncSupportsRankSwapAndDelete() {
	elimination, playerSets, adminCookies, _ := suite.createFixture(1, 4, nil)
	recorder, _ := suite.postBracket(elimination.ID, adminCookies)
	suite.Equal(http.StatusOK, recorder.Code)

	err := withPlayerSetMutationLock(elimination.ID, func(tx *gorm.DB) error {
		if err := tx.Model(&database.PlayerSet{}).Where("id = ?", playerSets[0].ID).Update("rank", 4).Error; err != nil {
			return err
		}
		return tx.Model(&database.PlayerSet{}).Where("id = ?", playerSets[3].ID).Update("rank", 1).Error
	})
	suite.Require().NoError(err)
	bracket := suite.loadBracket(elimination.ID)
	suite.NotNil(bracket.Stages[0].Matchs[0].MatchResults[0].PlayerSetId)
	suite.Equal(playerSets[3].ID, *bracket.Stages[0].Matchs[0].MatchResults[0].PlayerSetId)

	err = withPlayerSetMutationLock(elimination.ID, func(tx *gorm.DB) error {
		return tx.Where("id = ?", playerSets[3].ID).Delete(&database.PlayerSet{}).Error
	})
	suite.Require().NoError(err)
	bracket = suite.loadBracket(elimination.ID)
	suite.Nil(bracket.Stages[0].Matchs[0].MatchResults[0].PlayerSetId)
}

func (suite *EliminationBracketIntegrationTestSuite) TestRosterMutationEndpointsRequireCompetitionAdmin() {
	elimination, playerSets, adminCookies, nonAdminCookies := suite.createFixture(1, 4, nil)
	recorder, _ := suite.postBracket(elimination.ID, adminCookies)
	suite.Equal(http.StatusOK, recorder.Code)
	foreignCompetition, err := database.PostCompetition(database.Competition{Title: "foreign", StartTime: time.Now(), EndTime: time.Now().Add(time.Hour)})
	suite.Require().NoError(err)
	foreignAdminUserID := uint(81003)
	_, err = database.CreateParticipant(database.Participant{UserID: foreignAdminUserID, CompetitionID: foreignCompetition.ID, Role: pkg.RoleToString(pkg.RAdmin), Status: "approved"})
	suite.Require().NoError(err)
	foreignAdminCookies := suite.login(foreignAdminUserID)

	postBody := map[string]any{"elimination_id": elimination.ID, "set_name": "", "player_ids": []uint{}}
	recorder = suite.requestJSON(http.MethodPost, "/playerset", postBody, nil)
	suite.Equal(http.StatusForbidden, recorder.Code)
	recorder = suite.requestJSON(http.MethodPost, "/playerset", postBody, nonAdminCookies)
	suite.Equal(http.StatusForbidden, recorder.Code)
	recorder = suite.requestJSON(http.MethodPost, "/playerset", postBody, foreignAdminCookies)
	suite.Equal(http.StatusForbidden, recorder.Code)

	deletePath := fmt.Sprintf("/playerset/%d", playerSets[0].ID)
	recorder = suite.request(http.MethodDelete, deletePath, nil)
	suite.Equal(http.StatusForbidden, recorder.Code)
	suite.True(database.GetPlayerSetIsExist(playerSets[0].ID))
	recorder = suite.request(http.MethodDelete, deletePath, nonAdminCookies)
	suite.Equal(http.StatusForbidden, recorder.Code)
	suite.True(database.GetPlayerSetIsExist(playerSets[0].ID))
	recorder = suite.request(http.MethodDelete, deletePath, foreignAdminCookies)
	suite.Equal(http.StatusForbidden, recorder.Code)
	suite.True(database.GetPlayerSetIsExist(playerSets[0].ID))
	recorder = suite.request(http.MethodDelete, deletePath, adminCookies)
	suite.Equal(http.StatusOK, recorder.Code)
	suite.False(database.GetPlayerSetIsExist(playerSets[0].ID))
}

func (suite *EliminationBracketIntegrationTestSuite) TestEmptySlotWritersRollbackWithoutLockingRoster() {
	elimination, _, adminCookies, _ := suite.createFixture(1, 0, nil)
	recorder, _ := suite.postBracket(elimination.ID, adminCookies)
	suite.Equal(http.StatusOK, recorder.Code)
	bracket := suite.loadBracket(elimination.ID)
	emptyResult := bracket.Stages[0].Matchs[0].MatchResults[0]
	emptyEnd := emptyResult.MatchEnds[0]
	scoreIDs := make([]uint, len(emptyEnd.MatchScores))
	scores := make([]int, len(emptyEnd.MatchScores))
	for index := range emptyEnd.MatchScores {
		scoreIDs[index] = emptyEnd.MatchScores[index].ID
		scores[index] = 10
	}
	removed := suite.requestJSON(http.MethodPatch, fmt.Sprintf("/matchresult/totalpoints/%d", emptyResult.ID), map[string]int{"total_points": 2}, nil)
	suite.Equal(http.StatusNotFound, removed.Code)

	writes := []struct {
		path    string
		body    any
		cookies []*http.Cookie
	}{
		{fmt.Sprintf("/matchresult/shootoffscore/%d", emptyResult.ID), map[string]int{"shoot_off_score": 10}, nil},
		{fmt.Sprintf("/matchresult/iswinner/%d", emptyResult.ID), map[string]bool{"is_winner": true}, adminCookies},
		{fmt.Sprintf("/matchresult/matchend/totalscore/%d", emptyEnd.ID), map[string]int{"total_scores": 30}, nil},
		{fmt.Sprintf("/matchresult/matchend/scores/%d", emptyEnd.ID), map[string]any{"total_scores": 30, "match_score_ids": scoreIDs, "scores": scores}, nil},
		{fmt.Sprintf("/matchresult/matchend/isconfirmed/%d", emptyEnd.ID), map[string]bool{"is_confirmed": true}, nil},
		{fmt.Sprintf("/matchresult/matchscore/score/%d", scoreIDs[0]), map[string]int{"score": 10}, nil},
	}
	for _, write := range writes {
		recorder = suite.requestJSON(http.MethodPatch, write.path, write.body, write.cookies)
		suite.Equal(http.StatusConflict, recorder.Code, write.path)
		stored, err := database.GetOnlyEliminationById(elimination.ID)
		suite.Require().NoError(err)
		suite.False(stored.BracketRosterLocked, write.path)
	}

	storedResult, err := database.GetMatchResultById(emptyResult.ID)
	suite.Require().NoError(err)
	suite.Equal(-1, storedResult.ShootOffScore)
	suite.False(storedResult.IsWinner)
	storedEnd, err := database.GetMatchEndById(emptyEnd.ID)
	suite.Require().NoError(err)
	suite.Equal(0, storedEnd.TotalScore)
	suite.False(storedEnd.IsConfirmed)
	for _, scoreID := range scoreIDs {
		storedScore, err := database.GetMatchScoreById(scoreID)
		suite.Require().NoError(err)
		suite.Equal(-1, storedScore.Score)
	}
}

func (suite *EliminationBracketIntegrationTestSuite) TestConfirmationValidatesThenLocksRosterAtomically() {
	elimination, _, adminCookies, _ := suite.createFixture(1, 4, []int{0, 1, 2, 3})
	recorder, _ := suite.postBracket(elimination.ID, adminCookies)
	suite.Equal(http.StatusOK, recorder.Code)
	bracket := suite.loadBracket(elimination.ID)
	matchEndID := bracket.Stages[0].Matchs[0].MatchResults[0].MatchEnds[0].ID

	recorder = suite.requestJSON(http.MethodPatch, fmt.Sprintf("/matchresult/matchend/isconfirmed/%d", matchEndID), map[string]bool{"is_confirmed": true}, nil)
	suite.Equal(http.StatusOK, recorder.Code)
	stored, err := database.GetOnlyEliminationById(elimination.ID)
	suite.Require().NoError(err)
	suite.True(stored.BracketRosterLocked)
}

func (suite *EliminationBracketIntegrationTestSuite) TestConfirmedMatchEndUpdatesRequireOwningCompetitionAdmin() {
	elimination, _, adminCookies, nonAdminCookies := suite.createFixture(1, 4, nil)
	recorder, _ := suite.postBracket(elimination.ID, adminCookies)
	suite.Require().Equal(http.StatusOK, recorder.Code, recorder.Body.String())
	bracket := suite.loadBracket(elimination.ID)
	end := bracket.Stages[0].Matchs[0].MatchResults[0].MatchEnds[0]
	suite.Require().Len(end.MatchScores, 3)

	// The ordinary scoring path can still confirm an unconfirmed end.
	recorder = suite.requestJSON(http.MethodPatch, fmt.Sprintf("/matchresult/matchend/isconfirmed/%d", end.ID), map[string]bool{"is_confirmed": true}, nil)
	suite.Require().Equal(http.StatusOK, recorder.Code, recorder.Body.String())

	foreignCompetition, err := database.PostCompetition(database.Competition{Title: "foreign scoring admin", StartTime: time.Now(), EndTime: time.Now().Add(time.Hour)})
	suite.Require().NoError(err)
	foreignAdminID := uint(81003)
	_, err = database.CreateParticipant(database.Participant{UserID: foreignAdminID, CompetitionID: foreignCompetition.ID, Role: pkg.RoleToString(pkg.RAdmin), Status: "approved"})
	suite.Require().NoError(err)
	foreignAdminCookies := suite.login(foreignAdminID)
	group, err := database.GetGroupInfoById(elimination.GroupId)
	suite.Require().NoError(err)
	pendingAdminID := uint(81004)
	_, err = database.CreateParticipant(database.Participant{UserID: pendingAdminID, CompetitionID: group.CompetitionId, Role: pkg.RoleToString(pkg.RAdmin), Status: "pending"})
	suite.Require().NoError(err)
	pendingAdminCookies := suite.login(pendingAdminID)

	newScores := []int{10, 9, 11}
	matchScoreIDs := make([]uint, len(end.MatchScores))
	for index := range end.MatchScores {
		matchScoreIDs[index] = end.MatchScores[index].ID
	}
	payload := map[string]any{"total_scores": 999, "match_score_ids": matchScoreIDs, "scores": newScores}
	assertUnchanged := func() {
		storedEnd, err := database.GetMatchEndById(end.ID)
		suite.Require().NoError(err)
		suite.True(storedEnd.IsConfirmed)
		suite.Equal(0, storedEnd.TotalScore)
		for _, matchScoreID := range matchScoreIDs {
			storedScore, err := database.GetMatchScoreById(matchScoreID)
			suite.Require().NoError(err)
			suite.Equal(-1, storedScore.Score)
		}
	}

	for _, cookies := range [][]*http.Cookie{nil, nonAdminCookies, foreignAdminCookies, pendingAdminCookies} {
		recorder = suite.requestJSON(http.MethodPatch, fmt.Sprintf("/matchresult/matchend/scores/%d", end.ID), payload, cookies)
		suite.Equal(http.StatusForbidden, recorder.Code, recorder.Body.String())
		assertUnchanged()
	}

	for _, incompletePayload := range []map[string]any{
		{"total_scores": 999, "match_score_ids": []uint{}, "scores": []int{}},
		{"total_scores": 999, "match_score_ids": matchScoreIDs[:2], "scores": newScores[:2]},
		{"total_scores": 999, "match_score_ids": []uint{matchScoreIDs[0], matchScoreIDs[0], matchScoreIDs[1]}, "scores": newScores},
	} {
		recorder = suite.requestJSON(http.MethodPatch, fmt.Sprintf("/matchresult/matchend/scores/%d", end.ID), incompletePayload, adminCookies)
		suite.Equal(http.StatusBadRequest, recorder.Code, recorder.Body.String())
		assertUnchanged()
	}

	// The legacy total-only endpoint cannot create a total/arrow mismatch once
	// an end is confirmed, even for its competition Admin.
	recorder = suite.requestJSON(http.MethodPatch, fmt.Sprintf("/matchresult/matchend/totalscore/%d", end.ID), map[string]int{"total_scores": 99}, adminCookies)
	suite.Equal(http.StatusBadRequest, recorder.Code, recorder.Body.String())
	assertUnchanged()

	recorder = suite.requestJSON(http.MethodPatch, fmt.Sprintf("/matchresult/matchend/scores/%d", end.ID), payload, adminCookies)
	suite.Require().Equal(http.StatusOK, recorder.Code, recorder.Body.String())
	storedEnd, err := database.GetMatchEndById(end.ID)
	suite.Require().NoError(err)
	suite.True(storedEnd.IsConfirmed)
	suite.Equal(29, storedEnd.TotalScore)
	for index, matchScoreID := range matchScoreIDs {
		storedScore, err := database.GetMatchScoreById(matchScoreID)
		suite.Require().NoError(err)
		suite.Equal(newScores[index], storedScore.Score)
	}

	// A confirmed end can only be reopened by the owning competition Admin.
	for _, cookies := range [][]*http.Cookie{nil, nonAdminCookies, foreignAdminCookies, pendingAdminCookies} {
		recorder = suite.requestJSON(http.MethodPatch, fmt.Sprintf("/matchresult/matchend/isconfirmed/%d", end.ID), map[string]bool{"is_confirmed": false}, cookies)
		suite.Equal(http.StatusForbidden, recorder.Code, recorder.Body.String())
		storedEnd, err = database.GetMatchEndById(end.ID)
		suite.Require().NoError(err)
		suite.True(storedEnd.IsConfirmed)
	}

	recorder = suite.requestJSON(http.MethodPatch, fmt.Sprintf("/matchresult/matchend/isconfirmed/%d", end.ID), map[string]bool{"is_confirmed": false}, adminCookies)
	suite.Require().Equal(http.StatusOK, recorder.Code, recorder.Body.String())
	storedEnd, err = database.GetMatchEndById(end.ID)
	suite.Require().NoError(err)
	suite.False(storedEnd.IsConfirmed)

	// Existing unconfirmed score editing stays available to the scoring flow.
	recorder = suite.requestJSON(http.MethodPatch, fmt.Sprintf("/matchresult/matchend/scores/%d", end.ID), map[string]any{"total_scores": 28, "match_score_ids": matchScoreIDs, "scores": []int{10, 9, 9}}, nil)
	suite.Require().Equal(http.StatusOK, recorder.Code, recorder.Body.String())
	storedEnd, err = database.GetMatchEndById(end.ID)
	suite.Require().NoError(err)
	suite.False(storedEnd.IsConfirmed)
	suite.Equal(28, storedEnd.TotalScore)
}

func (suite *EliminationBracketIntegrationTestSuite) TestConfirmationRejectsDuplicateUntilManualIdentityCorrection() {
	elimination, playerSets, adminCookies, _ := suite.createFixture(1, 4, nil)
	recorder, _ := suite.postBracket(elimination.ID, adminCookies)
	suite.Equal(http.StatusOK, recorder.Code)
	bracket := suite.loadBracket(elimination.ID)
	firstResult := bracket.Stages[0].Matchs[0].MatchResults[0]
	suite.Require().NoError(database.DB.Model(&database.MatchResult{}).Where("id = ?", firstResult.ID).Update("player_set_id", playerSets[1].ID).Error)
	recorder = suite.requestJSON(http.MethodPatch, fmt.Sprintf("/matchresult/matchend/isconfirmed/%d", firstResult.MatchEnds[0].ID), map[string]bool{"is_confirmed": true}, nil)
	suite.Equal(http.StatusConflict, recorder.Code, recorder.Body.String())
	stored, err := database.GetOnlyEliminationById(elimination.ID)
	suite.Require().NoError(err)
	suite.False(stored.BracketRosterLocked)

	recorder = suite.requestJSON(http.MethodPatch, fmt.Sprintf("/elimination/match/playerset/%d", bracket.Stages[0].Matchs[0].ID), map[string]any{"player_set_ids": []uint{playerSets[0].ID, playerSets[3].ID}}, adminCookies)
	suite.Equal(http.StatusOK, recorder.Code, recorder.Body.String())
	recorder = suite.requestJSON(http.MethodPatch, fmt.Sprintf("/matchresult/matchend/isconfirmed/%d", firstResult.MatchEnds[0].ID), map[string]bool{"is_confirmed": true}, nil)
	suite.Equal(http.StatusOK, recorder.Code, recorder.Body.String())
}

func (suite *EliminationBracketIntegrationTestSuite) TestStageAndMatchPlacementModesAndValidation() {
	elimination, _, adminCookies, nonAdminCookies := suite.createFixture(1, 4, nil)
	recorder, _ := suite.postBracket(elimination.ID, adminCookies)
	suite.Equal(http.StatusOK, recorder.Code)
	bracket := suite.loadBracket(elimination.ID)
	stageID := bracket.Stages[0].ID
	placementPath := fmt.Sprintf("/elimination/stage/placement/%d", stageID)
	recorder = suite.requestJSON(http.MethodPut, placementPath, map[string]any{
		"start_lane_number": 1, "end_lane_number": 4, "mode": "one_player_set_per_target",
	}, nil)
	suite.Equal(http.StatusForbidden, recorder.Code)
	recorder = suite.requestJSON(http.MethodPut, placementPath, map[string]any{
		"start_lane_number": 1, "end_lane_number": 4, "mode": "one_player_set_per_target",
	}, nonAdminCookies)
	suite.Equal(http.StatusForbidden, recorder.Code)
	recorder = suite.requestJSON(http.MethodPut, placementPath, map[string]any{
		"start_lane_number": 1, "end_lane_number": 4, "mode": "one_player_set_per_target",
	}, adminCookies)
	suite.Equal(http.StatusOK, recorder.Code)
	var stageResponse PlacementResponse
	suite.Require().NoError(json.Unmarshal(recorder.Body.Bytes(), &stageResponse))
	suite.Equal(4, stageResponse.RequiredTargetCount)
	suite.Equal(4, stageResponse.UsedEndLaneNumber)
	bracket = suite.loadBracket(elimination.ID)
	suite.Equal(1, bracket.Stages[0].Matchs[0].MatchResults[0].LaneNumber)
	suite.Equal(2, bracket.Stages[0].Matchs[0].MatchResults[1].LaneNumber)
	suite.Nil(bracket.Stages[0].Matchs[0].MatchResults[0].Target)

	recorder = suite.requestJSON(http.MethodPut, placementPath, map[string]any{
		"start_lane_number": 5, "end_lane_number": 9, "mode": "two_player_sets_per_target",
	}, adminCookies)
	suite.Equal(http.StatusOK, recorder.Code)
	suite.Require().NoError(json.Unmarshal(recorder.Body.Bytes(), &stageResponse))
	suite.Equal(2, stageResponse.RequiredTargetCount)
	suite.Equal(6, stageResponse.UsedEndLaneNumber)
	suite.True(stageResponse.Changed)
	bracket = suite.loadBracket(elimination.ID)
	suite.Equal(5, bracket.Stages[0].Matchs[0].MatchResults[0].LaneNumber)
	suite.Equal(5, bracket.Stages[0].Matchs[0].MatchResults[1].LaneNumber)
	suite.Equal("A", *bracket.Stages[0].Matchs[0].MatchResults[0].Target)
	suite.Equal("B", *bracket.Stages[0].Matchs[0].MatchResults[1].Target)

	match := bracket.Stages[0].Matchs[0]
	targetA := "A"
	recorder = suite.requestJSON(http.MethodPut, fmt.Sprintf("/elimination/match/placement/%d", match.ID), MatchPlacementRequest{Placements: []MatchResultPlacement{
		{MatchResultID: match.MatchResults[0].ID, LaneNumber: 9, Target: &targetA},
		{MatchResultID: match.MatchResults[1].ID, LaneNumber: 8, Target: &targetA},
	}}, adminCookies)
	suite.Equal(http.StatusOK, recorder.Code)
	bracket = suite.loadBracket(elimination.ID)
	suite.Equal(9, bracket.Stages[0].Matchs[0].MatchResults[0].LaneNumber)
	suite.Equal("A", *bracket.Stages[0].Matchs[0].MatchResults[0].Target)
	suite.Equal(8, bracket.Stages[0].Matchs[0].MatchResults[1].LaneNumber)
	suite.Equal("A", *bracket.Stages[0].Matchs[0].MatchResults[1].Target)
	recorder = suite.requestJSON(http.MethodPut, fmt.Sprintf("/elimination/match/placement/%d", match.ID), MatchPlacementRequest{Placements: []MatchResultPlacement{
		{MatchResultID: match.MatchResults[0].ID, LaneNumber: 9},
		{MatchResultID: match.MatchResults[1].ID, LaneNumber: 9},
	}}, adminCookies)
	suite.Equal(http.StatusOK, recorder.Code, recorder.Body.String())
	bracket = suite.loadBracket(elimination.ID)
	suite.Equal(9, bracket.Stages[0].Matchs[0].MatchResults[0].LaneNumber)
	suite.Nil(bracket.Stages[0].Matchs[0].MatchResults[0].Target)
	suite.Equal(9, bracket.Stages[0].Matchs[0].MatchResults[1].LaneNumber)
	suite.Nil(bracket.Stages[0].Matchs[0].MatchResults[1].Target)

	invalidTarget := "C"
	recorder = suite.requestJSON(http.MethodPut, fmt.Sprintf("/elimination/match/placement/%d", match.ID), MatchPlacementRequest{Placements: []MatchResultPlacement{
		{MatchResultID: match.MatchResults[0].ID, LaneNumber: 9, Target: &targetA},
		{MatchResultID: match.MatchResults[1].ID, LaneNumber: 9, Target: &invalidTarget},
	}}, adminCookies)
	suite.Equal(http.StatusBadRequest, recorder.Code)
	recorder = suite.requestJSON(http.MethodPut, fmt.Sprintf("/elimination/match/placement/%d", match.ID), MatchPlacementRequest{Placements: []MatchResultPlacement{
		{MatchResultID: match.MatchResults[0].ID, LaneNumber: -1},
		{MatchResultID: match.MatchResults[1].ID, LaneNumber: 9},
	}}, adminCookies)
	suite.Equal(http.StatusBadRequest, recorder.Code)
	recorder = suite.requestJSON(http.MethodPut, fmt.Sprintf("/elimination/match/placement/%d", match.ID), MatchPlacementRequest{Placements: []MatchResultPlacement{
		{MatchResultID: match.MatchResults[0].ID, LaneNumber: 9},
	}}, adminCookies)
	suite.Equal(http.StatusBadRequest, recorder.Code)
	recorder = suite.requestJSON(http.MethodPut, fmt.Sprintf("/elimination/match/placement/%d", match.ID), MatchPlacementRequest{Placements: []MatchResultPlacement{
		{MatchResultID: match.MatchResults[0].ID, LaneNumber: 9},
		{MatchResultID: match.MatchResults[0].ID, LaneNumber: 9},
	}}, adminCookies)
	suite.Equal(http.StatusBadRequest, recorder.Code)
	recorder = suite.requestJSON(http.MethodPut, fmt.Sprintf("/elimination/match/placement/%d", match.ID), MatchPlacementRequest{Placements: []MatchResultPlacement{
		{MatchResultID: match.MatchResults[0].ID, LaneNumber: 9},
		{MatchResultID: bracket.Stages[0].Matchs[1].MatchResults[0].ID, LaneNumber: 9},
	}}, adminCookies)
	suite.Equal(http.StatusBadRequest, recorder.Code)
}

func (suite *EliminationBracketIntegrationTestSuite) TestAdvanceHandlesZeroAndOneEntrantStages() {
	empty, _, emptyAdmin, _ := suite.createFixture(1, 0, nil)
	recorder, _ := suite.postBracket(empty.ID, emptyAdmin)
	suite.Equal(http.StatusOK, recorder.Code)
	emptyBracket := suite.loadBracket(empty.ID)
	recorder, advance := suite.postAdvance(emptyBracket.Stages[0].ID, emptyAdmin)
	suite.Equal(http.StatusOK, recorder.Code)
	suite.False(advance.Changed)

	one, _, oneAdmin, _ := suite.createFixture(1, 1, []int{1})
	recorder, _ = suite.postBracket(one.ID, oneAdmin)
	suite.Equal(http.StatusOK, recorder.Code)
	bracket := suite.loadBracket(one.ID)
	recorder, advance = suite.postAdvance(bracket.Stages[0].ID, oneAdmin)
	suite.Equal(http.StatusOK, recorder.Code)
	suite.True(advance.Changed)
	bracket = suite.loadBracket(one.ID)
	recorder, advance = suite.postAdvance(bracket.Stages[1].ID, oneAdmin)
	suite.Equal(http.StatusOK, recorder.Code)
	suite.True(advance.Finalized)
	medals, err := database.GetMedalInfoByEliminationId(one.ID)
	suite.Require().NoError(err)
	suite.NotZero(medals[0].PlayerSetId)
	suite.Zero(medals[1].PlayerSetId)
	suite.Zero(medals[2].PlayerSetId)
}
