package pkg

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

type Role int
type RoleType int

const (
	RoleSystem RoleType = iota
	RoleGame
)

const (
	// System Roles
	RGuest Role = iota
	RUser
	RInstitutionAdmin
	RPro
	RDictator
	// Game Roles
	RViewer
	RPlayer
	RJudge
	RAdmin
)

const TopSystemRole = RDictator
const TopGameRole = RAdmin
const RNone Role = -1

var systemRoleSet = []Role{RGuest, RUser, RInstitutionAdmin, RPro, RDictator}
var gameRoleSet = []Role{RViewer, RPlayer, RJudge, RAdmin}

var roleMap = map[Role]string{
	RGuest:            "Guest",
	RUser:             "User",
	RInstitutionAdmin: "InstitutionAdmin",
	RPro:              "Pro",
	RDictator:         "Dictator",

	RViewer: "Viewer",
	RPlayer: "Player",
	RJudge:  "Judge",
	RAdmin:  "Admin",

	RNone: "None",
}

var roleMapReverse = make(map[string]Role)

func RBACMiddleware(roleType RoleType, roles ...Role) gin.HandlerFunc {
	return func(c *gin.Context) {
		role := RNone
		if roleType == RoleSystem {
			role = Role(QuerySession(c, "systemrole").(int))
		} else if roleType == RoleGame {
			role = Role(QuerySession(c, "gamerole").(int))
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid role type"})
			c.Abort()
			return
		}
		if role == RNone {
			c.JSON(http.StatusForbidden, gin.H{"error": "Require login"})
			c.Abort()
			return
		}
		if ((roleType == RoleSystem) && (role == TopSystemRole)) ||
			((roleType == RoleGame) && (role == TopGameRole)) {
			c.Next()
			return
		}
		for _, r := range roles {
			if role == r {
				c.Next()
				return
			}
		}
		c.JSON(http.StatusForbidden, gin.H{"error": "Permission denied"})
		c.Abort()
	}
}

func EnsureRoleInSystemRoleSet(role Role) bool {
	if role == RNone {
		return false
	}
	for _, r := range systemRoleSet {
		if r == role {
			return true
		}
	}
	return false
}

func EnsureRoleInGameRoleSet(role Role) bool {
	if role == RNone {
		return false
	}
	for _, r := range gameRoleSet {
		if r == role {
			return true
		}
	}
	return false
}

func RoleToString(role Role) string {
	if r, ok := roleMap[role]; ok {
		return r
	}
	return "Unknown"
}

func init() { // special function in golang
	for k, v := range roleMap {
		roleMapReverse[v] = k
	}
}

func StringToRole(role string) Role {
	if r, ok := roleMapReverse[role]; ok {
		return r
	}
	return RNone
}
