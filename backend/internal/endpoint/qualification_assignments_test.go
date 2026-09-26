package endpoint

import "testing"

func TestParseQualificationAssignmentCSV(t *testing.T) {
	rows, issues := parseQualificationAssignmentCSV("\ufeffposition,group_name,player_name\n1a, A , Alice \n2D,B,Bob\n")
	if len(issues) != 0 {
		t.Fatalf("issues = %#v", issues)
	}
	if len(rows) != 2 || rows[0].PlayerName != "Alice" || rows[0].GroupName != "A" || rows[0].Position != "1A" || rows[0].laneNumber != 1 || rows[0].order != 1 || rows[1].order != 4 {
		t.Fatalf("rows = %#v", rows)
	}
}
func TestParseQualificationAssignmentCSVRejectsDuplicatePlayerAndSlot(t *testing.T) {
	_, issues := parseQualificationAssignmentCSV("player_name,group_name,position\nAlice,A,1A\nAlice,B,2A\nBob,A,1A\n")
	if len(issues) != 2 {
		t.Fatalf("issues = %#v", issues)
	}
	if issues[0].Line != 3 || issues[0].Field != "player_name" || issues[1].Line != 4 || issues[1].Field != "position" {
		t.Fatalf("issues = %#v", issues)
	}
}
func TestParseQualificationAssignmentCSVRequiresExactColumnsAndPosition(t *testing.T) {
	_, issues := parseQualificationAssignmentCSV("player_name,group_name,position,extra\nAlice,A,0E,x\n")
	if len(issues) == 0 || issues[0].Line != 1 {
		t.Fatalf("issues = %#v", issues)
	}
	_, issues = parseQualificationAssignmentCSV("player_name,group_name,position\nAlice,A,1E\n")
	if len(issues) != 1 || issues[0].Field != "position" {
		t.Fatalf("issues = %#v", issues)
	}
}
