package endpoint

import (
	"backend/internal/database"
	. "backend/internal/endpoint"
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	. "github.com/smartystreets/goconvey/convey"
	"github.com/stretchr/testify/suite"
)

type MatchResultTestSuite struct {
	suite.Suite
}

func (suite *MatchResultTestSuite) SetupSuite() {
	database.SetupDatabaseByMode("test")
}

func (suite *MatchResultTestSuite) TearDownSuite() {

}

func (suite *MatchResultTestSuite) SetupTest() {
	database.TestDBRestore()
}

func (suite *MatchResultTestSuite) TearDownTest() {

}

func TestMatchResultTestSuite(t *testing.T) {
	suite.Run(t, new(MatchResultTestSuite))
}

// 建立一組可用來測試 PutMatchEndsScoresById 的最小資料鏈：
// Elimination -> Stage -> Match -> PlayerSet -> MatchResult -> MatchEnd -> MatchScore(s)
// 回傳建立好的 MatchEnd 與其底下的 MatchScore 清單
func setupMatchEndWithScores(isConfirmed bool) (database.MatchEnd, []database.MatchScore) {
	elimination, _ := database.CreateElimination(database.Elimination{GroupId: 1, TeamSize: 1})
	stage, _ := database.CreateStage(database.Stage{EliminationId: elimination.ID})
	match, _ := database.CreateMatch(database.Match{StageId: stage.ID})
	playerSet, _ := database.CreatePlayerSet(database.PlayerSet{EliminationId: elimination.ID, SetName: "test set"})
	playerSetID := playerSet.ID
	matchResult, _ := database.CreateMatchResult(database.MatchResult{MatchId: match.ID, PlayerSetId: &playerSetID})
	matchEnd, _ := database.CreateMatchEnd(database.MatchEnd{MatchResultId: matchResult.ID, TotalScore: 0, IsConfirmed: isConfirmed})

	var matchScores []database.MatchScore
	for i := 0; i < 3; i++ {
		matchScore, _ := database.CreateMatchScore(database.MatchScore{MatchEndId: matchEnd.ID, Score: -1})
		matchScores = append(matchScores, matchScore)
	}
	return matchEnd, matchScores
}

// 驗證已確認局拒絕改分、未確認局改分照常成功
func (suite *MatchResultTestSuite) TestPutMatchEndsScoresByIdConfirmedLock() {
	r := gin.Default()
	r.PATCH("/matchresult/matchend/scores/:id", PutMatchEndsScoresById)

	Convey("Test PutMatchEndsScoresById is_confirmed lock", suite.T(), func() {
		Convey("已確認局應拒絕改分", func() {
			matchEnd, matchScores := setupMatchEndWithScores(true)

			body := gin.H{
				"total_scores":    10,
				"match_score_ids": []uint{matchScores[0].ID, matchScores[1].ID, matchScores[2].ID},
				"scores":          []int{10, 9, 8},
			}
			jsonValue, _ := json.Marshal(body)
			w := httptest.NewRecorder()
			req, _ := http.NewRequest("PATCH", fmt.Sprintf("/matchresult/matchend/scores/%d", matchEnd.ID), bytes.NewBuffer(jsonValue))
			r.ServeHTTP(w, req)

			So(w.Code, ShouldEqual, http.StatusBadRequest)

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

		Convey("未確認局改分應照常成功", func() {
			matchEnd, matchScores := setupMatchEndWithScores(false)

			body := gin.H{
				"total_scores":    27,
				"match_score_ids": []uint{matchScores[0].ID, matchScores[1].ID, matchScores[2].ID},
				"scores":          []int{10, 9, 8},
			}
			jsonValue, _ := json.Marshal(body)
			w := httptest.NewRecorder()
			req, _ := http.NewRequest("PATCH", fmt.Sprintf("/matchresult/matchend/scores/%d", matchEnd.ID), bytes.NewBuffer(jsonValue))
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
	})
}
