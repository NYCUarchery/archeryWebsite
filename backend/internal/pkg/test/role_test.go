package pkg

import (
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"

	. "backend/internal/pkg"

	"github.com/gin-contrib/sessions"
	"github.com/gin-gonic/gin"
	. "github.com/smartystreets/goconvey/convey"
)

func TestRBACMiddleware(t *testing.T) {
	testcases := []struct {
		name            string
		roleType        RoleType
		roles           []Role
		testRoles       []Role
		expectedCode    int
		expectedContent string
	}{
		{"invalid role type", RoleType(-1),
			[]Role{RNone},
			[]Role{RNone},
			500, "Invalid role type"},

		{"invalid system role", RoleSystem,
			[]Role{RNone},
			[]Role{RNone},
			403, "Invalid system role"},
		{"invalid game role", RoleGame,
			[]Role{RNone},
			[]Role{RNone},
			403, "Invalid game role"},

		{"valid system RDictator role", RoleSystem,
			[]Role{},
			[]Role{RDictator},
			200, "success"},
		{"valid game RAdmin role", RoleGame,
			[]Role{},
			[]Role{RAdmin},
			200, "success"},
		{"valid top system role", RoleSystem,
			[]Role{TopSystemRole},
			[]Role{TopSystemRole},
			200, "success"},
		{"valid top game role", RoleGame,
			[]Role{TopGameRole},
			[]Role{TopGameRole},
			200, "success"},

		{"valid system RPro role", RoleSystem,
			[]Role{RPro},
			[]Role{RPro},
			200, "success"},
		{"valid game RPlayer role", RoleGame,
			[]Role{RPlayer},
			[]Role{RPlayer},
			200, "success"},

		{"invalid system RPro role", RoleSystem,
			[]Role{RGuest, RUser, RInstitutionAdmin, RDictator},
			[]Role{RPro},
			403, "Permission denied"},
		{"invalid game RPlayer role", RoleGame,
			[]Role{RViewer, RJudge, RAdmin},
			[]Role{RPlayer},
			403, "Permission denied"},
	}
	for _, tc := range testcases {
		message := fmt.Sprintf("Testcase %s", tc.name)
		roleType := ""
		if tc.roleType == RoleSystem {
			roleType = "systemrole"
		} else {
			roleType = "gamerole"
		}
		Convey(message, t, func() {
			for _, testrole := range tc.testRoles {
				context, server, writer := setmockRouterWithSession(t)
				server.Use(func(c *gin.Context) {
					session := sessions.Default(c)
					session.Set(roleType, int(testrole))
					session.Save()
					c.Next()
				})
				server.Use(RBACMiddleware(tc.roleType, tc.roles...))
				server.GET("/test", func(c *gin.Context) {
					c.JSON(tc.expectedCode, gin.H{"error": tc.expectedContent})
				})
				req := httptest.NewRequestWithContext(context, http.MethodGet, "/test", nil)
				server.ServeHTTP(writer, req)
				So(writer.Code, ShouldEqual, tc.expectedCode)
				So(writer.Body.String(), ShouldEqual, fmt.Sprintf("{\"error\":\"%s\"}", tc.expectedContent))
			}
		})
	}
}

func TestEnsureRoleInSystemRoleSet(t *testing.T) {
	testcases := []struct {
		name     string
		role     Role
		expected bool
	}{
		{"valid guest role", RGuest, true},
		{"valid user role", RUser, true},
		{"valid institution admin role", RInstitutionAdmin, true},
		{"valid pro role", RPro, true},
		{"valid dictator role", RDictator, true},
		{"valid top system role", TopSystemRole, true},

		{"invalid role", RNone, false},
		{"invalid small int", min(RGuest, RUser, RInstitutionAdmin, RPro, RDictator) - 1, false},
		{"invalid big int", max(RGuest, RUser, RInstitutionAdmin, RPro, RDictator) + 1, false},
	}
	Convey("Given a system role", t, func() {
		for _, tc := range testcases {
			message := fmt.Sprintf("The role %v should be in the system role set", tc.name)
			Convey(message, func() {
				result := EnsureRoleInSystemRoleSet(tc.role)
				So(result, ShouldEqual, tc.expected)
			})
		}
	})
}

func TestEnsureRoleInGameRoleSet(t *testing.T) {
	testcases := []struct {
		name     string
		role     Role
		expected bool
	}{
		{"valid viewer role", RViewer, true},
		{"valid player role", RPlayer, true},
		{"valid judge role", RJudge, true},
		{"valid admin role", RAdmin, true},
		{"valid top game role", TopGameRole, true},

		{"invalid role", RNone, false},
		{"invalid small int", min(RViewer, RPlayer, RJudge, RAdmin) - 1, false},
		{"invalid big int", max(RViewer, RPlayer, RJudge, RAdmin) + 1, false},
	}
	Convey("Given a game role", t, func() {
		for _, tc := range testcases {
			message := fmt.Sprintf("The role %v should be in the game role set", tc.name)
			Convey(message, func() {
				result := EnsureRoleInGameRoleSet(tc.role)
				So(result, ShouldEqual, tc.expected)
			})
		}
	})
}

func TestRoleToString(t *testing.T) {
	testcases := []struct {
		name     string
		role     Role
		expected string
	}{
		{"Guest", RGuest, "Guest"},
		{"User", RUser, "User"},
		{"InstitutionAdmin", RInstitutionAdmin, "InstitutionAdmin"},
		{"Pro", RPro, "Pro"},
		{"Dictator", RDictator, "Dictator"},
		{"TopSystemRole", TopSystemRole, "Dictator"},
		{"Viewer", RViewer, "Viewer"},
		{"Player", RPlayer, "Player"},
		{"Judge", RJudge, "Judge"},
		{"Admin", RAdmin, "Admin"},
		{"TopGameRole", TopGameRole, "Admin"},
		{"None", RNone, "None"},
		{"invalid role", RNone - 1, "Unknown"},
	}
	Convey("Given a role(int)", t, func() {
		for _, tc := range testcases {
			message := fmt.Sprintf("The role %v should be converted to %v", tc.name, tc.expected)
			Convey(message, func() {
				result := RoleToString(tc.role)
				So(result, ShouldEqual, tc.expected)
			})
		}
	})
}

func TestStringToRole(t *testing.T) {
	testcases := []struct {
		name     string
		role     string
		expected Role
	}{
		{"Guest", "Guest", RGuest},
		{"User", "User", RUser},
		{"InstitutionAdmin", "InstitutionAdmin", RInstitutionAdmin},
		{"Pro", "Pro", RPro},
		{"Dictator", "Dictator", RDictator},
		{"Viewer", "Viewer", RViewer},
		{"Player", "Player", RPlayer},
		{"Judge", "Judge", RJudge},
		{"Admin", "Admin", RAdmin},
		{"None", "None", RNone},
		{"invalid role", "InvalidRole", RNone},
	}
	Convey("Given a string role", t, func() {
		for _, tc := range testcases {
			message := fmt.Sprintf("The string role %v should be converted to %v", tc.name, tc.expected)
			Convey(message, func() {
				result := StringToRole(tc.role)
				So(result, ShouldEqual, tc.expected)
			})
		}
	})
}
