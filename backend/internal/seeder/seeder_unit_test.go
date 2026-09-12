//go:build !integration

package seeder

import (
	"fmt"
	"sort"
	"testing"
)

func TestParseScenario(t *testing.T) {
	for _, scenario := range AllScenarios() {
		if _, err := ParseScenario(string(scenario)); err != nil {
			t.Fatalf("ParseScenario(%q): %v", scenario, err)
		}
	}
	if _, err := ParseScenario("production"); err == nil {
		t.Fatal("unknown scenario was accepted")
	}
}

func TestItemSpecificationsAreDisjoint(t *testing.T) {
	if len(itemSpecs) < 3 {
		t.Fatalf("every seeded competition needs at least three items, got %d", len(itemSpecs))
	}
	if playersPerItem != lanesPerItem*playersPerLane {
		t.Fatalf("%d archers cannot fill %d lanes with %d per lane", playersPerItem, lanesPerItem, playersPerLane)
	}
	names := make(map[string]bool, len(itemSpecs))
	usedLanes := make(map[int]int, totalLanes())
	usedArchers := make(map[int]int, seededUserCount())
	for index, spec := range itemSpecs {
		if names[spec.GroupName] {
			t.Fatalf("item %d reuses group name %q", index, spec.GroupName)
		}
		names[spec.GroupName] = true
		lanes := itemLaneNumbers(index)
		if len(lanes) != lanesPerItem {
			t.Fatalf("item %d must use %d lanes, got %d", index, lanesPerItem, len(lanes))
		}
		for _, lane := range lanes {
			if lane < 1 || lane > totalLanes() {
				t.Fatalf("item %d uses lane %d outside 1-%d", index, lane, totalLanes())
			}
			if previous, taken := usedLanes[lane]; taken {
				t.Fatalf("lane %d is shared by items %d and %d", lane, previous, index)
			}
			usedLanes[lane] = index
		}
		for archer := index * playersPerItem; archer < (index+1)*playersPerItem; archer++ {
			if previous, taken := usedArchers[archer]; taken {
				t.Fatalf("archer %d is shared by items %d and %d", archer, previous, index)
			}
			usedArchers[archer] = index
		}
	}
	if len(usedLanes) != totalLanes() {
		t.Fatalf("items must cover lanes 1-%d exactly once, covered %d", totalLanes(), len(usedLanes))
	}
	if len(usedArchers) != seededUserCount() {
		t.Fatalf("items must cover all %d archers exactly once, covered %d", seededUserCount(), len(usedArchers))
	}
}

func TestCompoundItemSpecification(t *testing.T) {
	const compoundItemIndex = 3
	if len(itemSpecs) != 4 {
		t.Fatalf("seeded competition must have four formal items, got %d", len(itemSpecs))
	}
	if totalLanes() != 16 || seededUserCount() != 32 {
		t.Fatalf("four items must provide 16 lanes and 32 archer accounts, got %d lanes and %d accounts", totalLanes(), seededUserCount())
	}
	spec := itemSpecs[compoundItemIndex]
	if spec.GroupName != "公開男子複合弓組" || spec.GroupRange != "公開男子" || spec.BowType != "Compound" {
		t.Fatalf("compound item specification = %+v", spec)
	}
	if lanes := itemLaneNumbers(compoundItemIndex); fmt.Sprint(lanes) != "[13 14 15 16]" {
		t.Fatalf("compound item lanes = %v, want [13 14 15 16]", lanes)
	}
	firstArcher := compoundItemIndex*playersPerItem + 1
	lastArcher := (compoundItemIndex + 1) * playersPerItem
	if firstArcher != 25 || lastArcher != 32 || fmt.Sprintf("seeder.archer.%02d", firstArcher) != "seeder.archer.25" || fmt.Sprintf("seeder.archer.%02d", lastArcher) != "seeder.archer.32" {
		t.Fatalf("compound item accounts = seeder.archer.%02d through seeder.archer.%02d, want seeder.archer.25 through seeder.archer.32", firstArcher, lastArcher)
	}
}

func TestQualificationSeedScoresAreRankedAndRepresentable(t *testing.T) {
	maximum := endsPerRound * arrowsPerEnd * 10
	seen := make(map[int]string, len(itemSpecs)*playersPerItem)
	for item := range itemSpecs {
		previous := maximum + 1
		for rank := 0; rank < playersPerItem; rank++ {
			score := qualificationScore(item, rank)
			if score < 0 || score > maximum {
				t.Fatalf("item %d rank %d score %d cannot be shot with %d arrows", item, rank+1, score, endsPerRound*arrowsPerEnd)
			}
			if score >= previous {
				t.Fatalf("item %d rank %d score %d does not rank below rank %d", item, rank+1, score, rank)
			}
			previous = score
			where := fmt.Sprintf("item %d rank %d", item, rank+1)
			if owner, taken := seen[score]; taken {
				t.Fatalf("score %d is used by both %s and %s", score, owner, where)
			}
			seen[score] = where
		}
	}
}

func TestSeedJudgeAccountContract(t *testing.T) {
	if seedJudgeUserName != "seeder.judge" || seedJudgeEmail != "seeder.judge@example.invalid" {
		t.Fatalf("judge account = %q / %q", seedJudgeUserName, seedJudgeEmail)
	}
	if seedPassword != "archery-seed-password" {
		t.Fatalf("judge password contract changed")
	}
}

func TestBracketRoundsIsAConsistentEightArcherBracket(t *testing.T) {
	if got := []int{len(bracketRounds[0]), len(bracketRounds[1]), len(bracketRounds[2])}; len(bracketRounds) != 3 || got[0] != 4 || got[1] != 2 || got[2] != 2 {
		t.Fatalf("bracket must be 4, 2 and 2 matches deep, got %v", got)
	}
	seeds := func(matches []bracketMatch) []int {
		collected := make([]int, 0, len(matches)*2)
		for _, match := range matches {
			collected = append(collected, match.First, match.Second)
		}
		sort.Ints(collected)
		return collected
	}
	winners := func(matches []bracketMatch) []int {
		collected := make([]int, 0, len(matches))
		for _, match := range matches {
			collected = append(collected, [2]int{match.First, match.Second}[match.WinnerIndex])
		}
		sort.Ints(collected)
		return collected
	}
	losers := func(matches []bracketMatch) []int {
		collected := make([]int, 0, len(matches))
		for _, match := range matches {
			collected = append(collected, [2]int{match.First, match.Second}[1-match.WinnerIndex])
		}
		sort.Ints(collected)
		return collected
	}
	assertSame := func(name string, got, want []int) {
		if fmt.Sprint(got) != fmt.Sprint(want) {
			t.Fatalf("%s: got %v, want %v", name, got, want)
		}
	}
	assertSame("first round seeds", seeds(bracketRounds[0]), []int{0, 1, 2, 3, 4, 5, 6, 7})
	assertSame("semifinal entrants", seeds(bracketRounds[1]), winners(bracketRounds[0]))
	assertSame("gold match entrants", seeds(bracketRounds[2][:1]), winners(bracketRounds[1]))
	assertSame("bronze match entrants", seeds(bracketRounds[2][1:]), losers(bracketRounds[1]))
	gold, silver, bronze := winners(bracketRounds[2][:1]), losers(bracketRounds[2][:1]), winners(bracketRounds[2][1:])
	if gold[0] != 0 || silver[0] != 1 || bronze[0] != 2 {
		t.Fatalf("medals must go to seeds 1, 2 and 3, got %v, %v and %v", gold, silver, bronze)
	}
}
