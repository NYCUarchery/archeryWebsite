package endpoint

import (
	"backend/internal/database"
	"testing"
)

func TestLoadedOutcomeMutationIsLockedSupportsLegacySingleFinal(t *testing.T) {
	setID := uint(10)
	elimination := database.Elimination{Stages: []*database.Stage{
		{Matchs: []*database.Match{{MatchResults: []*database.MatchResult{{}, {}}}, {MatchResults: []*database.MatchResult{{}, {}}}}},
		{Matchs: []*database.Match{{MatchResults: []*database.MatchResult{{PlayerSetId: &setID}, {}}}}},
	}}
	if !loadedOutcomeMutationIsLocked(elimination, 0, 0, 1, false) {
		t.Fatal("legacy single-final target slot should lock its source result")
	}
	if loadedOutcomeMutationIsLocked(elimination, 0, 1, 1, false) {
		t.Fatal("unpopulated legacy single-final target slot should remain editable")
	}
}

func TestLoadedOutcomeMutationIsLockedReportsAwardedFinal(t *testing.T) {
	elimination := database.Elimination{Stages: []*database.Stage{{Matchs: []*database.Match{{MatchResults: []*database.MatchResult{{}, {}}}}}}}
	if !loadedOutcomeMutationIsLocked(elimination, 0, 0, 0, true) {
		t.Fatal("awarded final should be locked")
	}
}

func TestShootOffWithManualWinnerIsNotDecoratedAsLockedConflict(t *testing.T) {
	leftSetID, rightSetID := uint(10), uint(20)
	left := &database.MatchResult{ID: 1, PlayerSetId: &leftSetID, IsWinner: true}
	right := &database.MatchResult{ID: 2, PlayerSetId: &rightSetID}
	for wave := 0; wave < 5; wave++ {
		leftEnd := &database.MatchEnd{ID: uint(wave + 1)}
		rightEnd := &database.MatchEnd{ID: uint(wave + 6)}
		for arrow := 0; arrow < 3; arrow++ {
			leftEnd.MatchScores = append(leftEnd.MatchScores, &database.MatchScore{Score: 10})
			rightEnd.MatchScores = append(rightEnd.MatchScores, &database.MatchScore{Score: 10})
		}
		left.MatchEnds = append(left.MatchEnds, leftEnd)
		right.MatchEnds = append(right.MatchEnds, rightEnd)
	}
	elimination := database.Elimination{TeamSize: 1, Stages: []*database.Stage{
		{Matchs: []*database.Match{{MatchResults: []*database.MatchResult{left, right}}}},
		{Matchs: []*database.Match{{MatchResults: []*database.MatchResult{{PlayerSetId: &leftSetID}, {}}}}},
	}}

	decorateEliminationOutcomeStatuses(&elimination, "Compound", false)
	if got := elimination.Stages[0].Matchs[0].OutcomeStatus; got != database.MatchOutcomeShootOff {
		t.Fatalf("outcome status = %q, want %q", got, database.MatchOutcomeShootOff)
	}
}
