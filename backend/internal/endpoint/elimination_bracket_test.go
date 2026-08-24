package endpoint

import (
	"backend/internal/database"
	"reflect"
	"testing"
)

func TestStandardSeedOrder(t *testing.T) {
	if got, want := standardSeedOrder(8), []int{1, 8, 4, 5, 2, 7, 3, 6}; !reflect.DeepEqual(got, want) {
		t.Fatalf("standardSeedOrder(8) = %v, want %v", got, want)
	}
}

func TestExpectedBracketMatchCounts(t *testing.T) {
	for bracketSize, want := range map[int][]int{
		4:  {2, 2},
		8:  {4, 2, 2},
		16: {8, 4, 2, 2},
	} {
		if got := expectedBracketMatchCounts(bracketSize); !reflect.DeepEqual(got, want) {
			t.Fatalf("expectedBracketMatchCounts(%d) = %v, want %v", bracketSize, got, want)
		}
	}
}

func TestBracketSizesAndStageShapes(t *testing.T) {
	for entrantCount, want := range map[int]struct {
		bracketSize int
		matches     []int
	}{
		4: {4, []int{2, 2}},
		5: {8, []int{4, 2, 2}},
		6: {8, []int{4, 2, 2}},
		8: {8, []int{4, 2, 2}},
		9: {16, []int{8, 4, 2, 2}},
	} {
		bracketSize := nextPowerOfTwo(entrantCount)
		if bracketSize != want.bracketSize {
			t.Fatalf("nextPowerOfTwo(%d) = %d, want %d", entrantCount, bracketSize, want.bracketSize)
		}
		if matches := expectedBracketMatchCounts(bracketSize); !reflect.DeepEqual(matches, want.matches) {
			t.Fatalf("entrant count %d matches = %v, want %v", entrantCount, matches, want.matches)
		}
	}
}

func TestMatchEndsAndArrowsByTeamSize(t *testing.T) {
	for teamSize, want := range map[int][2]int{
		1: {5, 3},
		2: {4, 4},
		3: {4, 6},
	} {
		ends, arrows, err := matchEndsAndArrows(teamSize)
		if err != nil {
			t.Fatalf("team size %d rejected: %v", teamSize, err)
		}
		if got := [2]int{ends, arrows}; got != want {
			t.Fatalf("team size %d grid = %v, want %v", teamSize, got, want)
		}
	}
}

func TestExpectedFirstRoundSlotsUsesStandardSeedOrderAndByes(t *testing.T) {
	playerSets := make([]database.PlayerSet, 5)
	for index := range playerSets {
		playerSets[index] = database.PlayerSet{ID: uint(100 + index), Rank: index + 1}
	}
	slots := expectedFirstRoundSlots(playerSets, 8)
	want := []*uint{
		&playerSets[0].ID, nil, &playerSets[3].ID, &playerSets[4].ID,
		&playerSets[1].ID, nil, &playerSets[2].ID, nil,
	}
	if len(slots) != len(want) {
		t.Fatalf("slot count = %d, want %d", len(slots), len(want))
	}
	for index := range want {
		if !sameOptionalID(slots[index], want[index]) {
			t.Fatalf("slot %d = %v, want %v", index, slots[index], want[index])
		}
	}
}

func TestExpectedFirstRoundSlotsHasOneByePerMissingEntrant(t *testing.T) {
	for _, entrantCount := range []int{4, 5, 6, 8, 9} {
		playerSets := make([]database.PlayerSet, entrantCount)
		for index := range playerSets {
			playerSets[index] = database.PlayerSet{ID: uint(index + 1), Rank: index + 1}
		}
		bracketSize := nextPowerOfTwo(entrantCount)
		nilCount := 0
		for _, slot := range expectedFirstRoundSlots(playerSets, bracketSize) {
			if slot == nil {
				nilCount++
			}
		}
		if want := bracketSize - entrantCount; nilCount != want {
			t.Fatalf("entrant count %d has %d BYEs, want %d", entrantCount, nilCount, want)
		}
	}
}

func TestWinnerAndLoserOnlyAllowsMissingOpponentForStructuralBye(t *testing.T) {
	playerSetID := uint(1)
	results := []database.MatchResult{
		{PlayerSetId: &playerSetID, IsWinner: true},
		{PlayerSetId: nil, IsWinner: false},
	}
	if _, _, err := winnerAndLoser(results, false); err == nil {
		t.Fatal("later-round pending opponent was accepted as a BYE")
	}
	winner, loser, err := winnerAndLoser(results, true)
	if err != nil || winner == nil || *winner != playerSetID || loser != nil {
		t.Fatalf("structural BYE rejected: winner=%v loser=%v err=%v", winner, loser, err)
	}
}

func TestValidateBracketEntrantsRequiresContinuousRanks(t *testing.T) {
	valid := []database.PlayerSet{{Rank: 1}, {Rank: 2}, {Rank: 3}, {Rank: 4}, {Rank: 5}}
	if err := validateBracketEntrants(valid); err != nil {
		t.Fatalf("valid entrants rejected: %v", err)
	}
	for _, invalid := range [][]database.PlayerSet{
		{{Rank: 1}, {Rank: 2}, {Rank: 3}},
		{{Rank: 1}, {Rank: 2}, {Rank: 2}, {Rank: 4}},
		{{Rank: 1}, {Rank: 2}, {Rank: 3}, {Rank: 5}},
	} {
		if err := validateBracketEntrants(invalid); err == nil {
			t.Fatalf("invalid entrants accepted: %+v", invalid)
		}
	}
}
