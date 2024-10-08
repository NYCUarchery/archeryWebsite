package database

// The name for the "No Institution" Institution.
var NoInstitutionName string = "No Institution"

// Creates an institution "No Institution".
// Users are assigned to this when they are not in a valid institution.
func CreateNoInstitution() {
	var noInstitution Institution
	noInstitution.Name = NoInstitutionName

	if !GetInstitutionIsExistByName(NoInstitutionName) {
		AddInstitution(&noInstitution)
		NoInstitutionID = noInstitution.ID
	}
}

// Stores the dynamic ID of "No Institution".
// For users to access when they should be assigned to this.
var NoInstitutionID uint
