//go:build integration

package endpoint

import (
	"backend/internal/database"
	. "backend/internal/endpoint"
	"bytes"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"

	"github.com/stretchr/testify/require"
	"github.com/stretchr/testify/suite"
)

type PlayerTestSuite struct {
	suite.Suite
}

func (suite *PlayerTestSuite) SetupSuite() {
	suite.Require().NoError(database.ResetTestDatabase("legacy"))
}

func (suite *PlayerTestSuite) TearDownSuite() {

}

func (suite *PlayerTestSuite) SetupTest() {
	suite.Require().NoError(database.ResetTestDatabase("legacy"))
}

func (suite *PlayerTestSuite) TearDownTest() {

}

func TestPlayerTestSuite(t *testing.T) {
	if os.Getenv("ARCHERY_MYSQL_INTEGRATION") != "1" {
		t.Fatal("integration tests require scripts/test.sh go-integration")
	}
	suite.Run(t, new(PlayerTestSuite))
}

func (suite *PlayerTestSuite) TestPutPlayerScoreAuthorizationAndValidation() {
	router := newScoreTestRouter(suite.T())
	router.PATCH("/api/player/roundscore/:roundscoreid", PutPlayerScore)

	var score database.RoundScore
	suite.Require().NoError(database.DB.First(&score).Error)
	original := score.Score
	body := []byte(`{"score":10}`)

	suite.Run("approved competition Admin may update an arrow", func() {
		request := authenticatedScoreRequest(router, 1, http.MethodPatch, "/api/player/roundscore/"+uintString(score.ID), body)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		suite.Equal(http.StatusOK, recorder.Code)
		assertRoundScore(suite.T(), score.ID, 10)
	})

	suite.Run("anonymous request is denied without a write", func() {
		suite.Require().NoError(database.DB.Model(&database.RoundScore{}).Where("id = ?", score.ID).Update("score", original).Error)
		request := httptest.NewRequest(http.MethodPatch, "/api/player/roundscore/"+uintString(score.ID), bytes.NewReader(body))
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		suite.Equal(http.StatusForbidden, recorder.Code)
		assertRoundScore(suite.T(), score.ID, original)
	})

	for _, invalidScore := range []int{-2, 12} {
		suite.Run("invalid score is rejected", func() {
			suite.Require().NoError(database.DB.Model(&database.RoundScore{}).Where("id = ?", score.ID).Update("score", original).Error)
			request := authenticatedScoreRequest(router, 1, http.MethodPatch, "/api/player/roundscore/"+uintString(score.ID), []byte(`{"score":`+intString(invalidScore)+`}`))
			recorder := httptest.NewRecorder()
			router.ServeHTTP(recorder, request)
			suite.Equal(http.StatusBadRequest, recorder.Code)
			assertRoundScore(suite.T(), score.ID, original)
		})
	}
}

func assertRoundScore(t *testing.T, id uint, expected int) {
	t.Helper()
	var score database.RoundScore
	require.NoError(t, database.DB.First(&score, id).Error)
	require.Equal(t, expected, score.Score)
}
