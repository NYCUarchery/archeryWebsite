package endpoint

import (
	"backend/internal/database"
	"reflect"
	"testing"

	"github.com/gin-gonic/gin/binding"
)

func TestBitReversedSeedOrderPairsOddLeftAndEvenRight(t *testing.T) {
	exact := map[int][]int{
		4:  {1, 4, 3, 2},
		8:  {1, 8, 5, 4, 3, 6, 7, 2},
		16: {1, 16, 9, 8, 5, 12, 13, 4, 3, 14, 11, 6, 7, 10, 15, 2},
		32: {1, 32, 17, 16, 9, 24, 25, 8, 5, 28, 21, 12, 13, 20, 29, 4, 3, 30, 19, 14, 11, 22, 27, 6, 7, 26, 23, 10, 15, 18, 31, 2},
	}
	for _, size := range []int{4, 8, 16, 32, 64, 128} {
		got := bitReversedSeedOrder(size)
		if len(got) != size {
			t.Fatalf("bitReversedSeedOrder(%d) length = %d", size, len(got))
		}
		seen := make(map[int]bool, size)
		for matchIndex := 0; matchIndex < size/2; matchIndex++ {
			left, right := got[matchIndex*2], got[matchIndex*2+1]
			if left%2 != 1 || right != size+1-left || seen[left] || seen[right] {
				t.Fatalf("size %d invalid pair %d: %d,%d", size, matchIndex, left, right)
			}
			seen[left], seen[right] = true, true
		}
		if want, ok := exact[size]; ok && !reflect.DeepEqual(got, want) {
			t.Fatalf("bitReversedSeedOrder(%d) = %v, want %v", size, got, want)
		}
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

func TestFinalStageMatchOnlyRecognizesTerminalMatches(t *testing.T) {
	bracket := []bracketStage{
		{Matches: []bracketMatch{{Match: database.Match{ID: 10}}}},
		{Matches: []bracketMatch{{Match: database.Match{ID: 20}}, {Match: database.Match{ID: 21}}}},
	}
	for _, matchID := range []uint{20, 21} {
		final, ok := finalStageMatch(bracket, matchID)
		if !ok || len(final.Matches) != 2 {
			t.Fatalf("final match %d was not recognized", matchID)
		}
	}
	if _, ok := finalStageMatch(bracket, 10); ok {
		t.Fatal("non-final match was treated as a medal-correctable final")
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

func TestExpectedFirstRoundSlotsPreservesRankGaps(t *testing.T) {
	playerSets := make([]database.PlayerSet, 5)
	for index := range playerSets {
		playerSets[index] = database.PlayerSet{ID: uint(100 + index), Rank: index + 1}
	}
	slots := expectedFirstRoundSlots(playerSets, 8)
	want := []*uint{&playerSets[0].ID, nil, &playerSets[4].ID, &playerSets[3].ID, &playerSets[2].ID, nil, nil, &playerSets[1].ID}
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

func TestValidateRosterForLock(t *testing.T) {
	tests := []struct {
		name      string
		roster    []database.PlayerSet
		seedCount int
		wantErr   bool
	}{
		{name: "allows rank gaps", roster: []database.PlayerSet{{Rank: 1}, {Rank: 3}, {Rank: 5}}, seedCount: 8},
		{name: "rejects unranked player set", roster: []database.PlayerSet{{Rank: 0}}, seedCount: 8, wantErr: true},
		{name: "rejects negative rank", roster: []database.PlayerSet{{Rank: -1}}, seedCount: 8, wantErr: true},
		{name: "rejects rank above seed count", roster: []database.PlayerSet{{Rank: 9}}, seedCount: 8, wantErr: true},
		{name: "rejects duplicate rank", roster: []database.PlayerSet{{Rank: 1}, {Rank: 1}}, seedCount: 8, wantErr: true},
		{name: "rejects more player sets than seeds", roster: []database.PlayerSet{{Rank: 1}, {Rank: 2}, {Rank: 3}, {Rank: 4}, {Rank: 5}}, seedCount: 4, wantErr: true},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			err := validateRosterForLock(test.roster, test.seedCount)
			if (err != nil) != test.wantErr {
				t.Fatalf("validateRosterForLock(%+v, %d) error = %v, wantErr %v", test.roster, test.seedCount, err, test.wantErr)
			}
		})
	}
}

func TestValidateRosterForSetup(t *testing.T) {
	tests := []struct {
		name      string
		roster    []database.PlayerSet
		seedCount int
		wantErr   bool
	}{
		{name: "allows unranked placeholders and rank gaps", roster: []database.PlayerSet{{Rank: 0}, {Rank: 1}, {Rank: 4}}, seedCount: 8},
		{name: "rejects negative rank", roster: []database.PlayerSet{{Rank: -1}}, seedCount: 8, wantErr: true},
		{name: "rejects rank above seed count", roster: []database.PlayerSet{{Rank: 9}}, seedCount: 8, wantErr: true},
		{name: "rejects duplicate rank", roster: []database.PlayerSet{{Rank: 1}, {Rank: 1}}, seedCount: 8, wantErr: true},
		{name: "rejects more player sets than seeds", roster: []database.PlayerSet{{Rank: 0}, {Rank: 1}, {Rank: 2}, {Rank: 3}, {Rank: 4}}, seedCount: 4, wantErr: true},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			err := validateRosterForSetup(test.roster, test.seedCount)
			if (err != nil) != test.wantErr {
				t.Fatalf("validateRosterForSetup(%+v, %d) error = %v, wantErr %v", test.roster, test.seedCount, err, test.wantErr)
			}
		})
	}
}

func TestPlacementPairValidation(t *testing.T) {
	targetA, targetB := "A", "B"
	valid := [][]MatchResultPlacement{
		{{LaneNumber: 0}, {LaneNumber: 0}},
		{{LaneNumber: 1}, {LaneNumber: 2}},
		{{LaneNumber: 3, Target: &targetA}, {LaneNumber: 3, Target: &targetB}},
		{{LaneNumber: 1, Target: &targetA}, {LaneNumber: 9, Target: &targetB}},
		{{LaneNumber: 3}, {LaneNumber: 3}},
		{{LaneNumber: 5, Target: &targetA}, {LaneNumber: 5, Target: &targetA}},
	}
	for _, placement := range valid {
		if err := validatePlacementPair(placement); err != nil {
			t.Fatalf("valid placement rejected: %v", err)
		}
	}
	invalid := [][]MatchResultPlacement{
		{{LaneNumber: -1}, {LaneNumber: 1}},
		{{LaneNumber: 1}},
		{{LaneNumber: 1}, {LaneNumber: 2}, {LaneNumber: 3}},
	}
	for _, placement := range invalid {
		if err := validatePlacementPair(placement); err == nil {
			t.Fatalf("invalid placement accepted: %+v", placement)
		}
	}
}

func TestMatchPlacementBindingAllowsZeroLaneNumber(t *testing.T) {
	var request MatchPlacementRequest
	err := binding.JSON.BindBody([]byte(`{"placements":[{"match_result_id":1,"lane_number":0},{"match_result_id":2,"lane_number":0,"target":"A"}]}`), &request)
	if err != nil {
		t.Fatalf("zero lane_number rejected: %v", err)
	}
	if request.Placements[0].LaneNumber != 0 || request.Placements[1].LaneNumber != 0 {
		t.Fatalf("zero lane_number was not bound: %+v", request.Placements)
	}
	for _, body := range [][]byte{
		[]byte(`{"placements":[{"match_result_id":1},{"match_result_id":2,"lane_number":0}]}`),
		[]byte(`{"placements":[{"match_result_id":1,"lane_number":null},{"match_result_id":2,"lane_number":0}]}`),
	} {
		err = binding.JSON.BindBody(body, &request)
		if err == nil {
			t.Fatalf("missing or null lane_number accepted: %s", body)
		}
	}

	var placement MatchResultPlacement
	err = binding.JSON.BindBody([]byte(`{"match_result_id":1,"lane_number":-1}`), &placement)
	if err == nil {
		t.Fatal("negative lane_number accepted")
	}
}
