package database

// The name for the "No Institution" Institution.
var NoInstitutionName string = "No Institution"

// Creates an institution "No Institution".
// Users are assigned to this when they are not in a valid institution.
func CreateNoInstitution() {
	var noInstitution Institution
	DB.Where("name = ?", NoInstitutionName).First(&noInstitution)
	if noInstitution.ID != 0 {
		NoInstitutionID = noInstitution.ID
		return
	}
	noInstitution.Name = NoInstitutionName
	AddInstitution(&noInstitution)
	NoInstitutionID = noInstitution.ID
}

// Stores the dynamic ID of "No Institution".
// For users to access when they should be assigned to this.
// Note: The ID can be dynamic when CreateNoInstitution is called.
var NoInstitutionID uint = 1
