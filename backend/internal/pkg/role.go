package pkg

type Role int
type RoleType int

const (
	RoleSystem RoleType = iota
)

const ( // System Roles
	RGuest Role = iota
	RUser
	RInstitutionAdmin
	RPro
	RDictator
)
const TopSystemRole = RDictator
var systemRoleSet = []Role{RNone, RGuest, RUser, RInstitutionAdmin, RPro, RDictator}
