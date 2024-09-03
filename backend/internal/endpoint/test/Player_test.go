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

type PlayerTestSuite struct {
	suite.Suite
}

func (suite *PlayerTestSuite) SetupSuite() {
	database.SetupDatabaseByMode("test")
}

func (suite *PlayerTestSuite) TearDownSuite() {

}

func (suite *PlayerTestSuite) SetupTest() {
	database.TestDBRestore()
}

func (suite *PlayerTestSuite) TearDownTest() {

}

func TestPlayerTestSuite(t *testing.T) {
	suite.Run(t, new(PlayerTestSuite))
}

func SetUpRouter() *gin.Engine {
	router := gin.Default()
	return router
}

func (suite *PlayerTestSuite) TestUpdatePlayerScore() {
	/* bcc */
	/*
		| Characteristic     | b1           | b2          | b3             |
		| ------------------ | ------------ | ----------- | -------------- |
		| A:PlayerId valid   | True         | False       |                |
		| B:RoundId valid    | True         | False       |                |
		| C:RoundEndId valid | True         | False       |                |
		| D:Score            | less than -1 | -1 ≤ x ≤ 11 | larger than 11 |

		Base choice : A1 B1 C1 D2
		Number of tests = 1 + (1 + 1 + 1 + 2) = 6

		| Base | A1 B1 C1 D2 |
		| ---- | ----------- |
		| A    | A2 b1 c1 d2 |
		| B    | a1 B2 c1 d2 |
		| C    | a1 b1 C2 d2 |
		| D    | a1 b1 c1 D1 |
		| D    | a1 b1 c1 D3 |

	*/
	r := SetUpRouter()
	r.PUT("/api/player/roundscore/:id", PutPlayerScore)

	Convey("Test UpdatePlayerScore using BCC", suite.T(), func() {
		testcases := []struct {
			testName     string
			expectedCode int
			data         UpdateTotalScoreData
		}{
			{testName: "A1 B1 C1 D2", expectedCode: 200, data: UpdateTotalScoreData{PlayerId: 1, RoundId: 1, RoundEndId: 1, Score: 10}},
			{testName: "A2 b1 c1 d2", expectedCode: 400, data: UpdateTotalScoreData{PlayerId: 0, RoundId: 1, RoundEndId: 1, Score: 10}},
			{testName: "a1 B2 c1 d2", expectedCode: 400, data: UpdateTotalScoreData{PlayerId: 1, RoundId: 0, RoundEndId: 1, Score: 10}},
			{testName: "a1 b1 C2 d2", expectedCode: 400, data: UpdateTotalScoreData{PlayerId: 1, RoundId: 1, RoundEndId: 0, Score: 10}},
			{testName: "a1 b1 c1 D1", expectedCode: 200, data: UpdateTotalScoreData{PlayerId: 1, RoundId: 1, RoundEndId: 1, Score: -2}},
			{testName: "a1 b1 c1 D3", expectedCode: 200, data: UpdateTotalScoreData{PlayerId: 1, RoundId: 1, RoundEndId: 1, Score: 12}},
		}
		for _, tc := range testcases {
			Convey(tc.testName, func() {
				jsonValue, _ := json.Marshal(tc.data)
				w := httptest.NewRecorder()
				req, _ := http.NewRequest("PUT", "/api/player/roundscore/"+fmt.Sprint(tc.data.PlayerId), bytes.NewBuffer(jsonValue))
				r.ServeHTTP(w, req)
				So(w.Code, ShouldEqual, tc.expectedCode)
			})
		}
	})
}
