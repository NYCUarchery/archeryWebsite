//go:build integration

package endpoint

import (
	"backend/internal/database"
	. "backend/internal/endpoint"
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"

	"github.com/gin-gonic/gin"
	. "github.com/smartystreets/goconvey/convey"
	"github.com/stretchr/testify/require"
	"github.com/stretchr/testify/suite"
)

type MatchResultTestSuite struct {
	suite.Suite
}

func (suite *MatchResultTestSuite) SetupSuite() {
	suite.Require().NoError(database.ResetTestDatabase("legacy"))
}

func (suite *MatchResultTestSuite) TearDownSuite() {

}

func (suite *MatchResultTestSuite) SetupTest() {
	suite.Require().NoError(database.ResetTestDatabase("legacy"))
}

func (suite *MatchResultTestSuite) TearDownTest() {

}

func TestMatchResultTestSuite(t *testing.T) {
	if os.Getenv("ARCHERY_MYSQL_INTEGRATION") != "1" {
		t.Fatal("integration tests require scripts/test.sh go-integration")
	}
	suite.Run(t, new(MatchResultTestSuite))
}

// setupMatchEndWithScores creates both occupied sides of a real match.  The
// old fixture had one MatchResult, which current bracket authorization rightly
// rejects as an empty slot before testing scoring behavior.
func setupMatchEndWithScores(t *testing.T, isConfirmed bool) (database.MatchEnd, []database.MatchScore) {
	t.Helper()
	elimination, err := database.CreateElimination(database.Elimination{GroupId: 2, TeamSize: 1})
	require.NoError(t, err)
	stage, err := database.CreateStage(database.Stage{EliminationId: elimination.ID})
	require.NoError(t, err)
	match, err := database.CreateMatch(database.Match{StageId: stage.ID})
	require.NoError(t, err)

	playerSetA, err := database.CreatePlayerSet(database.PlayerSet{EliminationId: elimination.ID, SetName: "test set A"})
	require.NoError(t, err)
	playerSetB, err := database.CreatePlayerSet(database.PlayerSet{EliminationId: elimination.ID, SetName: "test set B"})
	require.NoError(t, err)
	playerSetAID, playerSetBID := playerSetA.ID, playerSetB.ID
	matchResult, err := database.CreateMatchResult(database.MatchResult{MatchId: match.ID, PlayerSetId: &playerSetAID})
	require.NoError(t, err)
	opponent, err := database.CreateMatchResult(database.MatchResult{MatchId: match.ID, PlayerSetId: &playerSetBID})
	require.NoError(t, err)
	_, err = database.CreateMatchEnd(database.MatchEnd{MatchResultId: opponent.ID, TotalScore: 0})
	require.NoError(t, err)
	matchEnd, err := database.CreateMatchEnd(database.MatchEnd{MatchResultId: matchResult.ID, TotalScore: 0, IsConfirmed: isConfirmed})
	require.NoError(t, err)

	matchScores := make([]database.MatchScore, 0, 3)
	for index := 0; index < 3; index++ {
		matchScore, err := database.CreateMatchScore(database.MatchScore{MatchEndId: matchEnd.ID, Score: -1})
		require.NoError(t, err)
		matchScores = append(matchScores, matchScore)
	}
	return matchEnd, matchScores
}

func createApprovedJudge(t *testing.T) uint {
	t.Helper()
	judge, err := database.CreateUser(database.User{
		Role: "User", UserName: "integration.score.judge", RealName: "Integration Score Judge",
		Password: "not-used-by-session-helper", Email: "integration.score.judge@example.test",
	})
	require.NoError(t, err)
	participant, err := database.CreateParticipant(database.Participant{
		UserID: judge.ID, CompetitionID: 1, Role: "Judge", Status: "approved",
	})
	require.NoError(t, err)
	require.NotZero(t, participant.ID)
	// Judges are restricted to an active current stage.  The fixture's existing
	// competition is otherwise deliberately inactive.
	require.NoError(t, database.DB.Model(&database.Competition{}).Where("id = ?", 1).Update("elimination_is_active", true).Error)
	return judge.ID
}

// 驗證已確認局需要所屬賽事管理員、未確認局改分照常成功
func (suite *MatchResultTestSuite) TestPutMatchEndsScoresByIdConfirmedLock() {
	r := newScoreTestRouter(suite.T())
	r.PATCH("/matchresult/matchend/scores/:id", PutMatchEndsScoresById)

	Convey("Test PutMatchEndsScoresById confirmed authorization", suite.T(), func() {
		Convey("未登入者不得修改已確認局", func() {
			matchEnd, matchScores := setupMatchEndWithScores(suite.T(), true)

			body := gin.H{
				"total_scores":    10,
				"match_score_ids": []uint{matchScores[0].ID, matchScores[1].ID, matchScores[2].ID},
				"scores":          []int{10, 9, 8},
			}
			jsonValue, _ := json.Marshal(body)
			w := httptest.NewRecorder()
			req, _ := http.NewRequest("PATCH", fmt.Sprintf("/matchresult/matchend/scores/%d", matchEnd.ID), bytes.NewBuffer(jsonValue))
			r.ServeHTTP(w, req)

			So(w.Code, ShouldEqual, http.StatusForbidden)

			// 分數不應被更動
			for _, ms := range matchScores {
				refreshed, err := database.GetMatchScoreById(ms.ID)
				So(err, ShouldBeNil)
				So(refreshed.Score, ShouldEqual, -1)
			}
			refreshedEnd, err := database.GetMatchEndById(matchEnd.ID)
			So(err, ShouldBeNil)
			So(refreshedEnd.TotalScore, ShouldEqual, 0)
		})

		Convey("已核對局可由所屬賽事 Judge 更正", func() {
			matchEnd, matchScores := setupMatchEndWithScores(suite.T(), true)
			judgeID := createApprovedJudge(suite.T())

			body := gin.H{
				"total_scores":    27,
				"match_score_ids": []uint{matchScores[0].ID, matchScores[1].ID, matchScores[2].ID},
				"scores":          []int{10, 9, 8},
			}
			jsonValue, _ := json.Marshal(body)
			w := httptest.NewRecorder()
			req := authenticatedScoreRequest(r, judgeID, http.MethodPatch, fmt.Sprintf("/matchresult/matchend/scores/%d", matchEnd.ID), jsonValue)
			r.ServeHTTP(w, req)

			So(w.Code, ShouldEqual, http.StatusOK)

			refreshedEnd, err := database.GetMatchEndById(matchEnd.ID)
			So(err, ShouldBeNil)
			So(refreshedEnd.TotalScore, ShouldEqual, 27)

			expectedScores := map[uint]int{
				matchScores[0].ID: 10,
				matchScores[1].ID: 9,
				matchScores[2].ID: 8,
			}
			for id, expected := range expectedScores {
				refreshed, err := database.GetMatchScoreById(id)
				So(err, ShouldBeNil)
				So(refreshed.Score, ShouldEqual, expected)
			}
		})

		Convey("無效箭分在寫入前被拒絕", func() {
			matchEnd, matchScores := setupMatchEndWithScores(suite.T(), false)
			body := gin.H{
				"total_scores":    27,
				"match_score_ids": []uint{matchScores[0].ID, matchScores[1].ID, matchScores[2].ID},
				"scores":          []int{10, -2, 8},
			}
			jsonValue, err := json.Marshal(body)
			suite.Require().NoError(err)
			w := httptest.NewRecorder()
			req := authenticatedScoreRequest(r, 1, http.MethodPatch, fmt.Sprintf("/matchresult/matchend/scores/%d", matchEnd.ID), jsonValue)
			r.ServeHTTP(w, req)
			So(w.Code, ShouldEqual, http.StatusBadRequest)
			for _, score := range matchScores {
				refreshed, err := database.GetMatchScoreById(score.ID)
				So(err, ShouldBeNil)
				So(refreshed.Score, ShouldEqual, -1)
			}
		})
	})
}
