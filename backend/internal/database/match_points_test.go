package database

import "testing"

func TestComputeMatchPointsAwardsWinsAndTiesByEndIndex(t *testing.T) {
	match := Match{MatchResults: []*MatchResult{
		{MatchEnds: []*MatchEnd{
			matchEnd(false, 0, 10, 9, 8),
			matchEnd(false, 99, 8, 8, 8),
			matchEnd(false, 99, 7, 7, 7),
		}},
		{MatchEnds: []*MatchEnd{
			matchEnd(false, 99, 9, 9, 8),
			matchEnd(false, 0, 8, 8, 8),
			matchEnd(false, 0, 8, 8, 8),
		}},
	}}

	match = ComputeMatchPoints(match)

	assertEndPoints(t, match.MatchResults[0].MatchEnds[0], 2, 2)
	assertEndPoints(t, match.MatchResults[1].MatchEnds[0], 0, 0)
	assertEndPoints(t, match.MatchResults[0].MatchEnds[1], 1, 3)
	assertEndPoints(t, match.MatchResults[1].MatchEnds[1], 1, 1)
	assertEndPoints(t, match.MatchResults[0].MatchEnds[2], 0, 3)
	assertEndPoints(t, match.MatchResults[1].MatchEnds[2], 2, 3)
	if match.MatchResults[0].TotalPoints != 3 || match.MatchResults[1].TotalPoints != 3 {
		t.Fatalf("TotalPoints = %d/%d, want 3/3", match.MatchResults[0].TotalPoints, match.MatchResults[1].TotalPoints)
	}
}

func TestComputeMatchPointsIgnoresConfirmation(t *testing.T) {
	match := Match{MatchResults: []*MatchResult{
		{MatchEnds: []*MatchEnd{matchEnd(false, 0, 10, 10, 10)}},
		{MatchEnds: []*MatchEnd{matchEnd(false, 30, 9, 9, 9)}},
	}}

	match = ComputeMatchPoints(match)

	assertEndPoints(t, match.MatchResults[0].MatchEnds[0], 2, 2)
	assertEndPoints(t, match.MatchResults[1].MatchEnds[0], 0, 0)
}

func TestComputeMatchPointsCountsXAsTen(t *testing.T) {
	match := Match{MatchResults: []*MatchResult{
		{MatchEnds: []*MatchEnd{matchEnd(true, 0, 11, 9)}},
		{MatchEnds: []*MatchEnd{matchEnd(true, 0, 10, 10)}},
	}}

	match = ComputeMatchPoints(match)

	assertEndPoints(t, match.MatchResults[0].MatchEnds[0], 0, 0)
	assertEndPoints(t, match.MatchResults[1].MatchEnds[0], 2, 2)
}

func TestComputeMatchPointsLeavesIncompleteEndsUnawarded(t *testing.T) {
	match := Match{MatchResults: []*MatchResult{
		{TotalPoints: 50, MatchEnds: []*MatchEnd{
			matchEnd(true, 0, 10, 9, 8),
			matchEnd(true, 0, 10, -1, 8),
			matchEnd(true, 0, 10, 9),
			matchEnd(true, 0),
			matchEnd(true, 0, 10, 10, 10),
		}},
		{TotalPoints: 50, MatchEnds: []*MatchEnd{
			matchEnd(true, 0, 9, 9, 8),
			matchEnd(true, 0, 9, 9, 9),
			matchEnd(true, 0, 9, 9, 9),
			matchEnd(true, 0),
		}},
	}}

	match = ComputeMatchPoints(match)

	assertEndPoints(t, match.MatchResults[0].MatchEnds[0], 2, 2)
	assertEndPoints(t, match.MatchResults[1].MatchEnds[0], 0, 0)
	for index := 1; index < 4; index++ {
		assertIncompleteEnd(t, match.MatchResults[0].MatchEnds[index], 2)
		assertIncompleteEnd(t, match.MatchResults[1].MatchEnds[index], 0)
	}
	assertIncompleteEnd(t, match.MatchResults[0].MatchEnds[4], 2)
	if match.MatchResults[0].TotalPoints != 2 || match.MatchResults[1].TotalPoints != 0 {
		t.Fatalf("TotalPoints = %d/%d, want 2/0", match.MatchResults[0].TotalPoints, match.MatchResults[1].TotalPoints)
	}
}

func TestComputeMatchPointsRequiresExactlyTwoResults(t *testing.T) {
	points := 2
	match := Match{MatchResults: []*MatchResult{{
		TotalPoints: 5,
		MatchEnds: []*MatchEnd{{
			Points:           &points,
			CumulativePoints: 5,
			MatchScores:      []*MatchScore{{Score: 10}},
		}},
	}}}

	match = ComputeMatchPoints(match)

	if match.MatchResults[0].TotalPoints != 0 {
		t.Fatalf("TotalPoints = %d, want 0", match.MatchResults[0].TotalPoints)
	}
	assertIncompleteEnd(t, match.MatchResults[0].MatchEnds[0], 0)
}

func TestComputeMatchPointsSortsResultsAndEndsWithoutMutatingInput(t *testing.T) {
	original := Match{MatchResults: []*MatchResult{
		{ID: 20, MatchEnds: []*MatchEnd{
			{ID: 204, MatchScores: []*MatchScore{{Score: 10}}},
			{ID: 202, MatchScores: []*MatchScore{{Score: 8}}},
		}},
		{ID: 10, MatchEnds: []*MatchEnd{
			{ID: 203, MatchScores: []*MatchScore{{Score: 9}}},
			{ID: 201, MatchScores: []*MatchScore{{Score: 10}}},
		}},
	}}

	computed := ComputeMatchPoints(original)

	if computed.MatchResults[0].ID != 10 || computed.MatchResults[1].ID != 20 {
		t.Fatalf("result order = %d/%d, want 10/20", computed.MatchResults[0].ID, computed.MatchResults[1].ID)
	}
	if computed.MatchResults[0].MatchEnds[0].ID != 201 || computed.MatchResults[0].MatchEnds[1].ID != 203 {
		t.Fatalf("left end order = %d/%d, want 201/203", computed.MatchResults[0].MatchEnds[0].ID, computed.MatchResults[0].MatchEnds[1].ID)
	}
	if computed.MatchResults[1].MatchEnds[0].ID != 202 || computed.MatchResults[1].MatchEnds[1].ID != 204 {
		t.Fatalf("right end order = %d/%d, want 202/204", computed.MatchResults[1].MatchEnds[0].ID, computed.MatchResults[1].MatchEnds[1].ID)
	}
	assertEndPoints(t, computed.MatchResults[0].MatchEnds[0], 2, 2)
	assertEndPoints(t, computed.MatchResults[1].MatchEnds[0], 0, 0)
	assertEndPoints(t, computed.MatchResults[0].MatchEnds[1], 0, 2)
	assertEndPoints(t, computed.MatchResults[1].MatchEnds[1], 2, 2)

	if original.MatchResults[0].ID != 20 || original.MatchResults[0].MatchEnds[0].ID != 204 {
		t.Fatal("ComputeMatchPoints mutated input ordering")
	}
	if original.MatchResults[0].MatchEnds[0].Points != nil || original.MatchResults[0].TotalPoints != 0 {
		t.Fatal("ComputeMatchPoints mutated input values")
	}
}

func matchEnd(confirmed bool, totalScore int, scores ...int) *MatchEnd {
	end := &MatchEnd{IsConfirmed: confirmed, TotalScore: totalScore}
	for _, score := range scores {
		end.MatchScores = append(end.MatchScores, &MatchScore{Score: score})
	}
	return end
}

func assertEndPoints(t *testing.T, end *MatchEnd, points, cumulative int) {
	t.Helper()
	if end.Points == nil || *end.Points != points {
		if end.Points == nil {
			t.Fatalf("Points = nil, want %d", points)
		}
		t.Fatalf("Points = %d, want %d", *end.Points, points)
	}
	if end.CumulativePoints != cumulative {
		t.Fatalf("CumulativePoints = %d, want %d", end.CumulativePoints, cumulative)
	}
}

func assertIncompleteEnd(t *testing.T, end *MatchEnd, cumulative int) {
	t.Helper()
	if end.Points != nil {
		t.Fatalf("Points = %d, want nil", *end.Points)
	}
	if end.CumulativePoints != cumulative {
		t.Fatalf("CumulativePoints = %d, want %d", end.CumulativePoints, cumulative)
	}
}
