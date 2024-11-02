package response

import (
	. "backend/internal/response"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	. "github.com/smartystreets/goconvey/convey"
)

func TestAcceptDeleteSuccess(t *testing.T) {
	tc := []struct {
		id              uint
		isChanged       bool
		message         string
		testName        string
		expectedMessage string
		expectedStatus  int
	}{
		{1, true, "\"test message\"", "if delete success", "{\n    \"message\": \"Delete ID(1): \\\"test message\\\" delete success\"\n}", 200},
		{2, false, "\"test message\"", "if delete fail", "{\n    \"message\": \"Delete ID(2): \\\"test message\\\" delete failed\"\n}", 400},
	}
	Convey("TestAcceptDeleteSuccess", t, func() {
		for _, tc := range tc {
			w := httptest.NewRecorder()
			c, _ := gin.CreateTestContext(w)
			Convey(tc.testName, func() {
				AcceptDeleteSuccess(c, tc.id, tc.isChanged, tc.message)
				So(w.Code, ShouldEqual, tc.expectedStatus)
				So(w.Body.String(), ShouldEqual, tc.expectedMessage)
			})
		}
	})
}

func TestAcceptNotChange(t *testing.T) {
	tc := []struct {
		id             uint
		isChange       bool
		testName       string
		expectedStatus int
		expectedReturn bool
	}{
		{1, false, "if not change", 204, true},
		{2, true, "if change", 200, false},
	}
	Convey("TestAcceptNotChange", t, func() {
		for _, tc := range tc {
			w := httptest.NewRecorder()
			c, _ := gin.CreateTestContext(w)
			Convey(tc.testName, func() {
				result := AcceptNotChange(c, tc.id, tc.isChange)
				So(w.Code, ShouldEqual, tc.expectedStatus)
				So(result, ShouldEqual, !tc.isChange)
			})
		}
	})
}
