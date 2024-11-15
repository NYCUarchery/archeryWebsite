package pkg

import (
	"fmt"
	"testing"

	. "backend/internal/pkg"

	. "github.com/smartystreets/goconvey/convey"
)

func TestEncryptPassword(t *testing.T) {
	testCases := []struct {
		name  string
		value string
	}{
		{"valid string", "plaintext"},
		{"valid number", "12345678"},
		{"valid special character", "!@#$%^&*()_+"},
	}
	something := "something"

	Convey("Given a valid string to be encrypted with unknown salt", t, func() {
		for _, tc := range testCases {
			cipher := EncryptPassword(tc.value)
			result := Compare(cipher, tc.value)
			message := fmt.Sprintf("Test case %s", tc.name)
			Convey(message, func() {
				So(result == nil, ShouldBeTrue)
			})
		}
	})
	Convey("Given a valid string but not equal to cipher", t, func() {
		for _, tc := range testCases {
			cipher := EncryptPassword(tc.value)
			result := Compare(cipher, something)
			message := fmt.Sprintf("Test case %s", tc.name)
			Convey(message, func() {
				So(result != nil, ShouldBeTrue)
			})
		}
	})
}
