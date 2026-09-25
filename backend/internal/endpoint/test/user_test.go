package endpoint

import (
	"backend/internal/database"
	. "backend/internal/endpoint"
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"
	. "github.com/smartystreets/goconvey/convey"
	"github.com/stretchr/testify/suite"
)

type UserTestSuite struct {
	suite.Suite
}

func (suite *UserTestSuite) SetupSuite() {
	database.SetupDatabaseByMode("test")
}

func (suite *UserTestSuite) TearDownSuite() {

}

func (suite *UserTestSuite) SetupTest() {
	database.TestDBRestore()
}

func (suite *UserTestSuite) TearDownTest() {

}

func TestUserTestSuite(t *testing.T) {
	suite.Run(t, new(UserTestSuite))
}

func setUpRouter() *gin.Engine {
	router := gin.Default()
	return router
}

func (suite *UserTestSuite) TestRegister() {
	r := SetUpRouter()
	const httpMethod = "POST"
	const url = "/api/user"
	const resultStr = "result"
	const errorStr = "error"
	r.POST(url, Register)

	Convey("Unit test of user Register, not include error message response", suite.T(), func() {
		testcases := []struct {
			testName          string
			expectedCode      int
			expectedBodyField string
			expectedBody      string
			data              AccountInfo
		}{
			{testName: "Toy case", expectedCode: 200, expectedBodyField: "", expectedBody: "", data: AccountInfo{UserName: "A", RealName: "a", Password: "123", Email: "a@email", InstitutionID: 1, Overview: "base case overview"}},
			{testName: "Overview empty", expectedCode: 200, expectedBodyField: "", expectedBody: "", data: AccountInfo{UserName: "B", RealName: "b", Password: "123", Email: "b@email", InstitutionID: 1, Overview: ""}},
			{testName: "User name empty", expectedCode: 400, expectedBodyField: resultStr, expectedBody: "empty username", data: AccountInfo{UserName: "", RealName: "c", Password: "123", Email: "c@email", InstitutionID: 1, Overview: "base case overview"}},
			{testName: "User name repeated", expectedCode: 400, expectedBodyField: resultStr, expectedBody: "username repeated", data: AccountInfo{UserName: "A", RealName: "d", Password: "123", Email: "d@email", InstitutionID: 1, Overview: "base case overview"}},
			{testName: "Email empty", expectedCode: 400, expectedBodyField: resultStr, expectedBody: "empty email", data: AccountInfo{UserName: "E", RealName: "e", Password: "123", Email: "", InstitutionID: 1, Overview: "base case overview"}},
			{testName: "Email repeated", expectedCode: 400, expectedBodyField: resultStr, expectedBody: "email repeated", data: AccountInfo{UserName: "F", RealName: "f", Password: "123", Email: "a@email", InstitutionID: 1, Overview: "base case overview"}},
			{testName: "Password empty", expectedCode: 400, expectedBodyField: resultStr, expectedBody: "empty password", data: AccountInfo{UserName: "G", RealName: "g", Password: "", Email: "g@email", InstitutionID: 1, Overview: "base case overview"}},
			{testName: "Realname empty", expectedCode: 400, expectedBodyField: resultStr, expectedBody: "empty realname", data: AccountInfo{UserName: "H", RealName: "", Password: "123", Email: "h@email", InstitutionID: 1, Overview: "base case overview"}},
			{testName: "Institution not exist", expectedCode: 400, expectedBodyField: errorStr, expectedBody: "invalid ID(1000000000) : institution id when register", data: AccountInfo{UserName: "I", RealName: "i", Password: "123", Email: "i@email", InstitutionID: 1000000000, Overview: "base case overview"}},
			{testName: "5000 length overview", expectedCode: 400, expectedBodyField: resultStr, expectedBody: "overview string lenght over limit 3000", data: AccountInfo{UserName: "J", RealName: "j", Password: "123", Email: "j@email", InstitutionID: 1, Overview: strings.Repeat("A", 5000)}},
		}
		for _, tc := range testcases {
			Convey(tc.testName, func() {
				jsonValue, _ := json.Marshal(tc.data)
				w := httptest.NewRecorder()
				req, _ := http.NewRequest(httpMethod, url, bytes.NewBuffer(jsonValue))
				req.Header.Set("Content-Type", "application/json")

				r.ServeHTTP(w, req)
				So(w.Code, ShouldEqual, tc.expectedCode)

				var resp map[string]any
				err := json.Unmarshal(w.Body.Bytes(), &resp)
				So(err, ShouldBeNil)
				if tc.expectedBodyField != "" {
					result, ok := resp[tc.expectedBodyField].(string)
					So(ok, ShouldBeTrue)
					So(result, ShouldEqual, tc.expectedBody)
				}
			})
		}
	})
}
