package endpoint

import (
	"strings"
	"testing"

	"backend/internal/database"
)

func TestParseBulkRegisterCSV(t *testing.T) {
	previous := database.NoInstitutionID
	database.NoInstitutionID = 42
	t.Cleanup(func() { database.NoInstitutionID = previous })
	csvText := "\ufeffreal_name,password,user_name,email\r\n\"陳,甲\", secret ,a01,\r\n乙,pass2,a02,b@example.test\r\n"
	rows, preview, issues := parseBulkRegisterCSV(csvText, "team-")
	if len(issues) != 0 {
		t.Fatalf("unexpected issues: %+v", issues)
	}
	if len(rows) != 2 || len(preview) != 2 {
		t.Fatalf("rows=%d preview=%d, want 2", len(rows), len(preview))
	}
	if rows[0].Line != 2 || rows[0].UserName != "team-a01" || rows[0].RealName != "陳,甲" || rows[0].Password != " secret " || rows[0].Email != nil || rows[0].InstitutionID != 42 {
		t.Fatalf("first row parsed incorrectly: %+v", rows[0])
	}
	if rows[1].Line != 3 || rows[1].Email == nil || *rows[1].Email != "b@example.test" {
		t.Fatalf("second row parsed incorrectly: %+v", rows[1])
	}
}

func TestParseBulkRegisterCSVRejectsInvalidBatch(t *testing.T) {
	for _, test := range []struct {
		name, input, field string
	}{
		{"missing header", "user_name,real_name\na,甲", "password"},
		{"duplicate transformed name", "user_name,real_name,password\nA,甲,p\nA,乙,p", "user_name"},
		{"missing password", "user_name,real_name,password\na,甲,", "password"},
		{"oversize password", "user_name,real_name,password\na,甲," + strings.Repeat("密", 25), "password"},
		{"malformed row", "user_name,real_name,password\na,甲", "csv"},
		{"empty batch", "user_name,real_name,password\n", "csv"},
	} {
		t.Run(test.name, func(t *testing.T) {
			_, _, issues := parseBulkRegisterCSV(test.input, "prefix-")
			found := false
			for _, issue := range issues {
				if issue.Field == test.field {
					found = true
				}
			}
			if !found {
				t.Fatalf("issues=%+v, want field %q", issues, test.field)
			}
		})
	}
}

func TestParseBulkRegisterCSVLimit(t *testing.T) {
	input := "user_name,real_name,password\n" + strings.Repeat("a,甲,p\n", bulkRowLimit+1)
	_, _, issues := parseBulkRegisterCSV(input, "")
	if len(issues) == 0 || issues[len(issues)-1].Message != "每批最多 100 筆" {
		t.Fatalf("issues=%+v, want row limit", issues)
	}
}
