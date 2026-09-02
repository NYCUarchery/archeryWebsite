package database

import "testing"

func TestComputeMatchOutcomeTable(t *testing.T) {
	completeCompound := outcomeMatch(1, 5, 3)
	fillOutcomeMatch(completeCompound, repeatedOutcomeEnds(5, 3, 10), repeatedOutcomeEnds(5, 3, 9))
	incompleteCompound := outcomeMatch(1, 5, 3)
	fillOutcomeMatch(incompleteCompound, repeatedOutcomeEnds(5, 3, 10), repeatedOutcomeEnds(5, 3, 9))
	incompleteCompound.MatchResults[1].MatchEnds[4].MatchScores[2].Score = -1

	tests := []struct {
		name       string
		match      Match
		bowType    string
		teamSize   int
		wantStatus MatchOutcomeStatus
		wantWinner *uint
	}{
		{name: "compound individual winner", match: completeCompound, bowType: "Compound", teamSize: 1, wantStatus: MatchOutcomeWinner, wantWinner: ptrOutcomeID(1)},
		{name: "compound needs every arrow", match: incompleteCompound, bowType: "複合弓", teamSize: 1, wantStatus: MatchOutcomeIncomplete},
		{name: "unknown bow type", match: completeCompound, bowType: "Barebow", teamSize: 1, wantStatus: MatchOutcomeUnsupportedBowType},
		{name: "unsupported team size", match: completeCompound, bowType: "Compound", teamSize: 4, wantStatus: MatchOutcomeIncomplete},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			assertOutcome(t, ComputeMatchOutcome(test.match, test.bowType, test.teamSize), test.wantStatus, test.wantWinner)
		})
	}
}

func TestComputeMatchOutcomeCompoundRequiresEveryRegulationArrow(t *testing.T) {
	match := outcomeMatch(1, 5, 3)
	fillOutcomeMatch(match, [][]int{{10, 10, 10}, {9, 9, 9}, {10, 10, 10}, {9, 9, 9}, {10, 10, 10}}, [][]int{{9, 9, 9}, {9, 9, 9}, {9, 9, 9}, {9, 9, 9}, {9, 9, -1}})
	assertOutcome(t, ComputeMatchOutcome(match, "Compound", 1), MatchOutcomeIncomplete, nil)

	match.MatchResults[1].MatchEnds[4].MatchScores[2].Score = 9
	assertOutcome(t, ComputeMatchOutcome(match, "複合弓", 1), MatchOutcomeWinner, ptrOutcomeID(1))
}

func TestComputeMatchOutcomeCompoundCountsXAsTenAndTiesNeedShootOff(t *testing.T) {
	match := outcomeMatch(1, 5, 3)
	left, right := make([][]int, 5), make([][]int, 5)
	for index := range left {
		left[index] = []int{11, 10, 9}
		right[index] = []int{10, 10, 9}
	}
	fillOutcomeMatch(match, left, right)
	assertOutcome(t, ComputeMatchOutcome(match, "Compound", 1), MatchOutcomeShootOff, nil)
}

func TestComputeMatchOutcomeCompoundMixedAndTeamUseFourWaves(t *testing.T) {
	for _, teamSize := range []int{2, 3} {
		waves, arrows, _ := matchEndsAndArrowsForOutcome(teamSize)
		match := outcomeMatch(1, waves, arrows)
		left, right := make([][]int, waves), make([][]int, waves)
		for wave := 0; wave < waves; wave++ {
			left[wave] = repeatedOutcomeScore(arrows, 10)
			right[wave] = repeatedOutcomeScore(arrows, 9)
		}
		fillOutcomeMatch(match, left, right)
		assertOutcome(t, ComputeMatchOutcome(match, "複合弓", teamSize), MatchOutcomeWinner, ptrOutcomeID(1))
	}
}

func TestComputeMatchOutcomeRecurveIndividualWinsAsSoonAsSixPoints(t *testing.T) {
	match := outcomeMatch(1, 5, 3)
	fillOutcomeMatch(match,
		[][]int{{10, 10, 10}, {10, 10, 10}, {10, 10, 10}, {10, -1, -1}, {-1, -1, -1}},
		[][]int{{9, 9, 9}, {9, 9, 9}, {9, 9, 9}, {-1, -1, -1}, {-1, -1, -1}},
	)
	assertOutcome(t, ComputeMatchOutcome(match, "Recurve", 1), MatchOutcomeWinner, ptrOutcomeID(1))
}

func TestComputeMatchOutcomeRecurveRegulationTiesNeedShootOff(t *testing.T) {
	individual := outcomeMatch(1, 5, 3)
	fillOutcomeMatch(individual,
		[][]int{{10, 10, 10}, {9, 9, 9}, {10, 10, 10}, {10, 10, 10}, {9, 9, 9}},
		[][]int{{9, 9, 9}, {10, 10, 10}, {10, 10, 10}, {9, 9, 9}, {10, 10, 10}},
	)
	assertOutcome(t, ComputeMatchOutcome(individual, "反曲弓", 1), MatchOutcomeShootOff, nil)

	team := outcomeMatch(1, 4, 4)
	fillOutcomeMatch(team,
		[][]int{{10, 10, 10, 10}, {9, 9, 9, 9}, {10, 10, 10, 10}, {10, 10, 10, 10}},
		[][]int{{9, 9, 9, 9}, {10, 10, 10, 10}, {10, 10, 10, 10}, {10, 10, 10, 10}},
	)
	assertOutcome(t, ComputeMatchOutcome(team, "Recurve", 2), MatchOutcomeShootOff, nil)
}

func TestComputeMatchOutcomeRecurveTeamWinsAtFivePoints(t *testing.T) {
	match := outcomeMatch(1, 4, 6)
	fillOutcomeMatch(match,
		[][]int{{10, 10, 10, 10, 10, 10}, {10, 10, 10, 10, 10, 10}, {10, 10, 10, 10, 10, 10}, {-1, -1, -1, -1, -1, -1}},
		[][]int{{9, 9, 9, 9, 9, 9}, {9, 9, 9, 9, 9, 9}, {9, 9, 9, 9, 9, 9}, {-1, -1, -1, -1, -1, -1}},
	)
	assertOutcome(t, ComputeMatchOutcome(match, "反曲弓", 3), MatchOutcomeWinner, ptrOutcomeID(1))
}

func TestComputeMatchOutcomeUnknownBowTypeDoesNotInferWinner(t *testing.T) {
	match := outcomeMatch(1, 5, 3)
	fillOutcomeMatch(match, repeatedOutcomeEnds(5, 3, 10), repeatedOutcomeEnds(5, 3, 9))
	assertOutcome(t, ComputeMatchOutcome(match, "barebow", 1), MatchOutcomeUnsupportedBowType, nil)
}

func TestComputeMatchOutcomeRejectsOutOfRangeArrowScore(t *testing.T) {
	match := outcomeMatch(1, 5, 3)
	fillOutcomeMatch(match, repeatedOutcomeEnds(5, 3, 10), repeatedOutcomeEnds(5, 3, 9))
	match.MatchResults[0].MatchEnds[4].MatchScores[2].Score = 12
	assertOutcome(t, ComputeMatchOutcome(match, "Compound", 1), MatchOutcomeIncomplete, nil)
}

func outcomeMatch(startID uint, waves, arrows int) Match {
	leftSet, rightSet := uint(100), uint(200)
	match := Match{MatchResults: []*MatchResult{
		{ID: startID, PlayerSetId: &leftSet},
		{ID: startID + 1, PlayerSetId: &rightSet},
	}}
	for resultIndex, result := range match.MatchResults {
		for wave := 0; wave < waves; wave++ {
			end := &MatchEnd{ID: uint(resultIndex*waves + wave + 1)}
			for arrow := 0; arrow < arrows; arrow++ {
				end.MatchScores = append(end.MatchScores, &MatchScore{ID: uint((resultIndex*waves+wave)*arrows + arrow + 1), Score: -1})
			}
			result.MatchEnds = append(result.MatchEnds, end)
		}
	}
	return match
}

func fillOutcomeMatch(match Match, left, right [][]int) {
	for resultIndex, waves := range [][][]int{left, right} {
		for waveIndex, scores := range waves {
			for scoreIndex, score := range scores {
				match.MatchResults[resultIndex].MatchEnds[waveIndex].MatchScores[scoreIndex].Score = score
			}
		}
	}
}

func repeatedOutcomeScore(count, score int) []int {
	result := make([]int, count)
	for index := range result {
		result[index] = score
	}
	return result
}

func repeatedOutcomeEnds(waves, arrows, score int) [][]int {
	result := make([][]int, waves)
	for index := range result {
		result[index] = repeatedOutcomeScore(arrows, score)
	}
	return result
}

func ptrOutcomeID(value uint) *uint { return &value }

func assertOutcome(t *testing.T, outcome MatchOutcome, wantStatus MatchOutcomeStatus, wantWinner *uint) {
	t.Helper()
	if outcome.Status != wantStatus {
		t.Fatalf("status = %q, want %q", outcome.Status, wantStatus)
	}
	if wantWinner == nil {
		if outcome.WinnerMatchResultID != nil {
			t.Fatalf("winner = %d, want nil", *outcome.WinnerMatchResultID)
		}
		return
	}
	if outcome.WinnerMatchResultID == nil || *outcome.WinnerMatchResultID != *wantWinner {
		if outcome.WinnerMatchResultID == nil {
			t.Fatalf("winner = nil, want %d", *wantWinner)
		}
		t.Fatalf("winner = %d, want %d", *outcome.WinnerMatchResultID, *wantWinner)
	}
}
