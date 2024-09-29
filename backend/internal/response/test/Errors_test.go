package response

import (
	. "backend/internal/response"
	"fmt"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	. "github.com/smartystreets/goconvey/convey"
)

func TestErrorReceiveDataTest(t *testing.T) {
	testcases := []struct {
		id              uint
		message         string
		err             error
		testName        string
		expected        bool
		expectedStatus  int
		expectedMessage string
	}{
		{1, "\"test message\"", nil, "receive data has no error", false, 200, ""},
		{2, "\"test message\"", fmt.Errorf("\"error\""), "receive data has error", true, 400, "{\n    \"error\": \"bad request data ID(2): \\\"test message\\\" \\\"error\\\"\"\n}"},
	}
	Convey("TestErrorReceiveDataTest", t, func() {
		for _, tc := range testcases {
			w := httptest.NewRecorder()
			c, _ := gin.CreateTestContext(w)
			Convey(tc.testName, func() {
				result := ErrorReceiveDataTest(c, tc.id, tc.message, tc.err)
				So(result, ShouldEqual, tc.expected)
				So(w.Code, ShouldEqual, tc.expectedStatus)
				So(w.Body.String(), ShouldEqual, tc.expectedMessage)
			})
		}
	})
}

func TestErrorReceiveDataFormat(t *testing.T) {
	testcases := []struct {
		message         string
		testName        string
		expectedStatus  int
		expectedMessage string
	}{
		{"\"test message\"", "receive data format has error", 400, "{\n    \"error\": \"bad request data: \\\"test message\\\"\"\n}"},
	}
	Convey("TestErrorReceiveDataFormat", t, func() {
		for _, tc := range testcases {
			w := httptest.NewRecorder()
			c, _ := gin.CreateTestContext(w)
			Convey(tc.testName, func() {
				ErrorReceiveDataFormat(c, tc.message)
				So(w.Code, ShouldEqual, tc.expectedStatus)
				So(w.Body.String(), ShouldEqual, tc.expectedMessage)
			})
		}
	})
}

func TestErrorReceiveDataNilTest(t *testing.T) {
	testcases := []struct {
		id              uint
		data            interface{}
		message         string
		testName        string
		expected        bool
		expectedStatus  int
		expectedMessage string
	}{
		{1, nil, "\"test message\"", "receive data is nil", true, 400, "{\n    \"error\": \"bad request data is nil ID(1): \\\"test message\\\" \"\n}"},
		{2, "\"has data\"", "\"test message\"", "receive data is not nil", false, 200, ""},
	}
	Convey("TestErrorReceiveDataNilTest", t, func() {
		for _, tc := range testcases {
			w := httptest.NewRecorder()
			c, _ := gin.CreateTestContext(w)
			Convey(tc.testName, func() {
				result := ErrorReceiveDataNilTest(c, tc.id, tc.data, tc.message)
				So(result, ShouldEqual, tc.expected)
				So(w.Code, ShouldEqual, tc.expectedStatus)
				So(w.Body.String(), ShouldEqual, tc.expectedMessage)
			})
		}
	})
}

func TestErrorIdTest(t *testing.T) {
	testcases := []struct {
		id              uint
		isExist         bool
		message         string
		testName        string
		expected        bool
		expectedStatus  int
		expectedMessage string
	}{
		{1, true, "\"test message\"", "id exist", false, 200, ""},
		{2, false, "\"test message\"", "id not exist", true, 400, "{\n    \"error\": \"invalid ID(2) : \\\"test message\\\"\"\n}"},
	}
	Convey("TestErrorIdTest", t, func() {
		for _, tc := range testcases {
			w := httptest.NewRecorder()
			c, _ := gin.CreateTestContext(w)
			Convey(tc.testName, func() {
				result := ErrorIdTest(c, tc.id, tc.isExist, tc.message)
				So(result, ShouldEqual, tc.expected)
				So(w.Code, ShouldEqual, tc.expectedStatus)
				So(w.Body.String(), ShouldEqual, tc.expectedMessage)
			})
		}
	})
}

func TestErrorInternalErrorTest(t *testing.T) {
	testCases := []struct {
		id              uint
		message         string
		err             error
		testName        string
		expected        bool
		expectedStatus  int
		expectedMessage string
	}{
		{1, "\"test message\"", nil, "internal error has no error", false, 200, ""},
		{2, "\"test message\"", fmt.Errorf("\"error\""), "internal error has error", true, 500, "{\n    \"error\": \"\\\"test message\\\" need fix ID(2) : \\\"error\\\"\"\n}"},
	}

	Convey("TestErrorInternalErrorTest", t, func() {
		for _, tc := range testCases {
			w := httptest.NewRecorder()
			c, _ := gin.CreateTestContext(w)
			Convey(tc.testName, func() {
				result := ErrorInternalErrorTest(c, tc.id, tc.message, tc.err)
				So(result, ShouldEqual, tc.expected)
				So(w.Code, ShouldEqual, tc.expectedStatus)
				So(w.Body.String(), ShouldEqual, tc.expectedMessage)
			})
		}
	})
}
