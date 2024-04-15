package endpoint

import (
	"backend/internal/endpoint"
	"fmt"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	. "github.com/smartystreets/goconvey/convey"
)

func TestConvert2Int(t *testing.T) {
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
			result := endpoint.Convert2int(c, "int")
			Convey(error_response, func() {
				So(result, ShouldEqual, tc.expected)
			})
		}
	})
}
