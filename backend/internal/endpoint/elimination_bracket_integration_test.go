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
	suite.router.POST("/elimination/stage/advance/:stageid", PostEliminationStageAdvance)
	suite.router.POST("/matchresult/matchend", PostMatchEnd)
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
	group, err := database.CreateGroupInfo(database.Group{CompetitionId: competition.ID, GroupName: "bracket", GroupIndex: 1})
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
	recorder := suite.request(http.MethodPost, fmt.Sprintf("/elimination/bracket/%d", eliminationID), cookies)
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

func (suite *EliminationBracketIntegrationTestSuite) loadBracket(eliminationID uint) database.Elimination {
	bracket, err := database.GetEliminationWScoresById(eliminationID)
	suite.Require().NoError(err)
	return bracket
}

func (suite *EliminationBracketIntegrationTestSuite) markWinner(bracket database.Elimination, stageIndex, matchIndex, resultIndex int) {
	resultID := bracket.Stages[stageIndex].Matchs[matchIndex].MatchResults[resultIndex].ID
	suite.Require().NoError(database.UpdateMatchResultIsWinnerById(resultID, true))
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
}

func (suite *EliminationBracketIntegrationTestSuite) TestInitializeRequiresCompetitionAdminAndValidEntrants() {
	elimination, _, _, nonAdminCookies := suite.createFixture(1, 4, nil)
	recorder, _ := suite.postBracket(elimination.ID, nil)
	suite.Equal(http.StatusForbidden, recorder.Code)
	recorder, _ = suite.postBracket(elimination.ID, nonAdminCookies)
	suite.Equal(http.StatusForbidden, recorder.Code)

	tooFew, _, tooFewAdmin, _ := suite.createFixture(1, 3, nil)
	recorder, _ = suite.postBracket(tooFew.ID, tooFewAdmin)
	suite.Equal(http.StatusBadRequest, recorder.Code)

	badRanks, _, badRanksAdmin, _ := suite.createFixture(1, 4, []int{1, 2, 2, 4})
	recorder, _ = suite.postBracket(badRanks.ID, badRanksAdmin)
	suite.Equal(http.StatusBadRequest, recorder.Code)

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
			responses <- suite.request(http.MethodPost, fmt.Sprintf("/elimination/bracket/%d", elimination.ID), concurrentAdminCookies)
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

func (suite *EliminationBracketIntegrationTestSuite) TestAdvanceRefusesTargetConflictWithoutOverwriting() {
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
	suite.Equal(http.StatusConflict, recorder.Code)
	var target database.MatchResult
	suite.Require().NoError(database.DB.First(&target, targetResultID).Error)
	suite.NotNil(target.PlayerSetId)
	suite.Equal(conflictingPlayerSetID, *target.PlayerSetId)
}

func (suite *EliminationBracketIntegrationTestSuite) TestAdvanceRefusesScoredEmptyTargetSlot() {
	elimination, _, adminCookies, _ := suite.createFixture(1, 4, nil)
	recorder, _ := suite.postBracket(elimination.ID, adminCookies)
	suite.Equal(http.StatusOK, recorder.Code)

	bracket := suite.loadBracket(elimination.ID)
	suite.markWinner(bracket, 0, 0, 0)
	suite.markWinner(bracket, 0, 1, 0)
	targetResultID := bracket.Stages[1].Matchs[0].MatchResults[0].ID
	suite.Require().NoError(database.DB.Model(&database.MatchResult{}).Where("id = ?", targetResultID).Update("lane_number", 7).Error)

	recorder, _ = suite.postAdvance(bracket.Stages[0].ID, adminCookies)
	suite.Equal(http.StatusConflict, recorder.Code)
	var target database.MatchResult
	suite.Require().NoError(database.DB.First(&target, targetResultID).Error)
	suite.Nil(target.PlayerSetId)
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
