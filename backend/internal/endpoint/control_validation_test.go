package endpoint

import (
	"backend/internal/database"
	"testing"
)

func TestIsCompetitionPhaseActive(t *testing.T) {
	competition := database.Competition{
		QualificationIsActive:    true,
		EliminationIsActive:      true,
		TeamEliminationIsActive:  false,
		MixedEliminationIsActive: true,
	}

	testCases := []struct {
		phase int
		want  bool
	}{
		{phase: 0, want: true},
		{phase: 1, want: true},
		{phase: 2, want: false},
		{phase: 3, want: true},
		{phase: -1, want: false},
		{phase: 4, want: false},
	}
	for _, testCase := range testCases {
		if got := isCompetitionPhaseActive(competition, testCase.phase); got != testCase.want {
			t.Errorf("phase %d: got %t, want %t", testCase.phase, got, testCase.want)
		}
	}
}

func TestHasCompetitionAdmin(t *testing.T) {
	if hasCompetitionAdmin([]database.Participant{{Role: "Player", Status: "approved"}, {Role: "Judge", Status: "approved"}}) {
		t.Error("non-admin participants must not receive competition control access")
	}
	if !hasCompetitionAdmin([]database.Participant{{Role: "Player", Status: "approved"}, {Role: "Admin", Status: "approved"}}) {
		t.Error("target competition admin must receive competition control access")
	}
	if hasCompetitionAdmin([]database.Participant{{Role: "Admin", Status: "pending"}}) {
		t.Error("pending admin participant must not receive competition control access")
	}
}

func TestValidateEliminationProgress(t *testing.T) {
	elimination := database.Elimination{
		CurrentStage: 0,
		TeamSize:     1,
		Stages: []*database.Stage{
			{Matchs: []*database.Match{{}}},
			{Matchs: []*database.Match{}},
		},
	}

	testCases := []struct {
		name  string
		stage int
		end   int
		want  bool
	}{
		{name: "individual first end", stage: 0, end: 0, want: true},
		{name: "individual final end", stage: 0, end: 4, want: true},
		{name: "individual end too large", stage: 0, end: 5, want: false},
		{name: "negative stage", stage: -1, end: 0, want: false},
		{name: "stage without matches", stage: 1, end: 0, want: false},
		{name: "stage out of range", stage: 2, end: 0, want: false},
		{name: "negative end", stage: 0, end: -1, want: false},
	}
	for _, testCase := range testCases {
		err := validateEliminationProgress(elimination, testCase.stage, testCase.end)
		if (err == nil) != testCase.want {
			t.Errorf("%s: error = %v, want valid = %t", testCase.name, err, testCase.want)
		}
	}

	for _, teamSize := range []int{2, 3} {
		elimination.TeamSize = teamSize
		if err := validateEliminationProgress(elimination, 0, 3); err != nil {
			t.Errorf("team_size %d, end 3: unexpected error: %v", teamSize, err)
		}
		if err := validateEliminationProgress(elimination, 0, 4); err == nil {
			t.Errorf("team_size %d, end 4: expected validation error", teamSize)
		}
	}
}

func TestProgressEndForStage(t *testing.T) {
	elimination := database.Elimination{CurrentStage: 1}
	if got := progressEndForStage(elimination, 1, 3); got != 3 {
		t.Errorf("same stage: got %d, want 3", got)
	}
	if got := progressEndForStage(elimination, 0, 3); got != 0 {
		t.Errorf("changed stage: got %d, want 0", got)
	}
}
