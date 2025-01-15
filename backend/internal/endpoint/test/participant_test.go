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

	. "github.com/smartystreets/goconvey/convey"
	"github.com/stretchr/testify/suite"
)

type ParticipantTestSuite struct {
	suite.Suite
}

func (suite *ParticipantTestSuite) SetupSuite() {
	database.SetupDatabaseByMode("test")
}

func (suite *ParticipantTestSuite) TearDownSuite() {

}

func (suite *ParticipantTestSuite) SetupTest() {
	database.TestDBRestore()
}

func (suite *ParticipantTestSuite) TearDownTest() {

}

func TestParticipantTestSuite(t *testing.T) {
	suite.Run(t, new(ParticipantTestSuite))
}

func (suite *ParticipantTestSuite) TestPatchParticipants() {
	r := SetUpRouter()
	r.PATCH("/api/participant/bulk/roles/status/:competitionid", PatchParticipants)

	Convey("Test PatchParticipants", suite.T(), func() {
		testcases := []struct {
			testName         string
			URLCompetitionID int
			data             []PutParticipantData
			expectedCode     int
			expectedJSONData string
		}{
			{
				testName:         "Test with multiple test cases",
				URLCompetitionID: 1,
				data: []PutParticipantData{
					{ID: 1, Role: "Admin", Status: "admin cannot be edit"},
					{ID: 2, Role: "ErrorRole", Status: "error role type"},
					{ID: 3, Role: "Admin", Status: "second admin is not allowed"},
					{ID: 9, Role: "Player", Status: "new status"},
					{ID: 12, Role: "Player", Status: "other competition"},
					{ID: 100, Role: "Player", Status: "outrange participant id"},
				},
				expectedCode:     200,
				expectedJSONData: "{\n    \"processedNum\": 6,\n    \"successNum\": 1,\n    \"failNum\": 5,\n    \"errorData\": [\n        {\n            \"errorMessage\": \"Admin cannot be updated\",\n            \"putParticipantData\": {\n                \"id\": 1,\n                \"role\": \"Admin\",\n                \"status\": \"admin cannot be edit\"\n            }\n        },\n        {\n            \"errorMessage\": \"role is not defined\",\n            \"putParticipantData\": {\n                \"id\": 2,\n                \"role\": \"ErrorRole\",\n                \"status\": \"error role type\"\n            }\n        },\n        {\n            \"errorMessage\": \"Admin cannot be added\",\n            \"putParticipantData\": {\n                \"id\": 3,\n                \"role\": \"Admin\",\n                \"status\": \"second admin is not allowed\"\n            }\n        },\n        {\n            \"errorMessage\": \"invalid participant id | participant not in competition\",\n            \"putParticipantData\": {\n                \"id\": 12,\n                \"role\": \"Player\",\n                \"status\": \"other competition\"\n            }\n        },\n        {\n            \"errorMessage\": \"invalid participant id | participant not in competition\",\n            \"putParticipantData\": {\n                \"id\": 100,\n                \"role\": \"Player\",\n                \"status\": \"outrange participant id\"\n            }\n        }\n    ]\n}",
			},
		}
		for _, tc := range testcases {
			Convey(tc.testName, func() {
				jsonValue, _ := json.Marshal(tc.data)
				w := httptest.NewRecorder()
				req, _ := http.NewRequest("PATCH", "/api/participant/bulk/roles/status/"+fmt.Sprint(tc.URLCompetitionID), bytes.NewBuffer(jsonValue))
				r.ServeHTTP(w, req)
				So(w.Code, ShouldEqual, tc.expectedCode)
				So(w.Body.String(), ShouldEqual, tc.expectedJSONData)
			})
		}
	})
}
