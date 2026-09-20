package endpoint

import (
	. "backend/internal/endpoint"
	"fmt"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	. "github.com/smartystreets/goconvey/convey"
)

func TestConvert2int(t *testing.T) {
	testCases := []struct {
		name     string
		value    string
		expected int
	}{
		{"valid int string", "-17", -17},
		{"valid int string", "0", 0},
		{"valid int string", "1", 1},
		{"valid int string", "123", 123},
		{"valid int string", "2341234123", 2341234123},
	}

	Convey("Given a valid string representation of an integer", t, func() {
		for _, tc := range testCases {
			error_response := fmt.Sprintf("The result should be the integer value of the string, but got %s.", tc.value)
			c, _ := gin.CreateTestContext(httptest.NewRecorder())
			c.Params = append(c.Params, gin.Param{Key: "int", Value: tc.value})
			result := Convert2int(c, "int")
			Convey(error_response, func() {
				So(result, ShouldEqual, tc.expected)
			})
		}
	})
}

func TestConvert2Bool(t *testing.T) {
	testCases := []struct {
		name     string
		value    string
		expected bool
	}{
		{"valid bool string", "true", true},
		{"valid bool string", "false", false},
		{"valid bool string", "1", true},
		{"valid bool string", "0", false},
	}

	Convey("Given a valid string representation of an bool", t, func() {
		for _, tc := range testCases {
			error_response := fmt.Sprintf("The result should be the boolean value of the string, got %s.", tc.value)
			c, _ := gin.CreateTestContext(httptest.NewRecorder())
			c.Params = append(c.Params, gin.Param{Key: "bool", Value: tc.value})
			result := Convert2bool(c, "bool")
			Convey(error_response, func() {
				So(result, ShouldEqual, tc.expected)
			})
		}
	})
}

func TestConvert2uint(t *testing.T) {
	testCases := []struct {
		name     string
		value    string
		expected uint
	}{
		{"valid int string", "-17", 0},
		{"valid int string", "0", 0},
		{"valid int string", "1", 1},
		{"valid int string", "123", 123},
		{"valid int string", "2341234123", 2341234123},
	}

	Convey("Given a valid string representation of an uint", t, func() {
		for _, tc := range testCases {
			error_response := fmt.Sprintf("The result should be the unsigned int value of the string, got %s.", tc.value)
			c, _ := gin.CreateTestContext(httptest.NewRecorder())
			c.Params = append(c.Params, gin.Param{Key: "uint", Value: tc.value})
			result := Convert2uint(c, "uint")
			Convey(error_response, func() {
				So(result, ShouldEqual, tc.expected)
			})
		}
	})
}

func TestScorefmt(t *testing.T) {
	testcase := []struct {
		name     string
		score    int
		expected int
	}{
		{"score less than 0", -1, 0},
		{"score equal to 0", 0, 0},
		{"score between 0 and 10", 5, 5},
		{"score equal to 10", 10, 10},
		{"score greater than 10", 11, 10},
	}

	Convey("Given a score", t, func() {
		for _, tc := range testcase {
			error_response := fmt.Sprintf("The result should be the score value %s, got %d.", tc.name, tc.score)
			result := Scorefmt(tc.score)
			Convey(error_response, func() {
				So(result, ShouldEqual, tc.expected)
			})
		}
	})
}
