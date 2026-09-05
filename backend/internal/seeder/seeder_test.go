package seeder

import (
	"backend/internal/database"
	"fmt"
	"os"
	"sort"
	"testing"

	"gorm.io/gorm"
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
		// The seeded users are sliced by the same arithmetic Seed uses.
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
			// Distinct scores keep the items from sharing one ranking table.
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
	// The last stage holds the gold match first and the bronze match second,
	// which is the order frontend/src/utils/parseStagesToTree.ts reads.
	assertSame("gold match entrants", seeds(bracketRounds[2][:1]), winners(bracketRounds[1]))
	assertSame("bronze match entrants", seeds(bracketRounds[2][1:]), losers(bracketRounds[1]))
	gold := winners(bracketRounds[2][:1])
	silver := losers(bracketRounds[2][:1])
	bronze := winners(bracketRounds[2][1:])
	if gold[0] != 0 || silver[0] != 1 || bronze[0] != 2 {
		t.Fatalf("medals must go to seeds 1, 2 and 3, got %v, %v and %v", gold, silver, bronze)
	}
}

// This test intentionally requires an explicit disposable MySQL database. The
// project test initializer drops tables, so it must never run by accident.
func TestSeedScenarioInvariants(t *testing.T) {
	if os.Getenv("SEEDER_INTEGRATION_TEST") != "1" {
		t.Skip("set SEEDER_INTEGRATION_TEST=1 with a disposable backend test database")
	}
	database.SetupDatabaseByMode("test")
	competitions := make(map[Scenario]uint, len(AllScenarios()))
	for _, scenario := range AllScenarios() {
		result, err := Seed(database.DB, scenario)
		if err != nil {
			t.Fatalf("seed %s: %v", scenario, err)
		}
		if !result.Created {
			t.Fatalf("first run of %s did not create data", scenario)
		}
		if result.Items != len(itemSpecs) || result.Players != seededUserCount() {
			t.Fatalf("%s reported %d items and %d archers, want %d and %d", scenario, result.Items, result.Players, len(itemSpecs), seededUserCount())
		}
		if err := AssertInvariants(database.DB, scenario, result.CompetitionID); err != nil {
			t.Fatalf("%s invariants: %v", scenario, err)
		}
		assertScenarioCounts(t, scenario, result.CompetitionID)

		repeated, err := Seed(database.DB, scenario)
		if err != nil {
			t.Fatalf("repeat %s: %v", scenario, err)
		}
		if repeated.Created || repeated.CompetitionID != result.CompetitionID {
			t.Fatalf("repeat %s was not idempotent: %#v", scenario, repeated)
		}
		if err := AssertInvariants(database.DB, scenario, repeated.CompetitionID); err != nil {
			t.Fatalf("%s invariants after repeat: %v", scenario, err)
		}
		competitions[scenario] = result.CompetitionID
	}
	assertScenariosDoNotShareRows(t, competitions)
}

// This is deliberately separate from the successful all-scenarios test: an
// account collision must abort before the first fixture can be created.
func TestSeedRejectsConflictingJudgeAccount(t *testing.T) {
	if os.Getenv("SEEDER_INTEGRATION_TEST") != "1" {
		t.Skip("set SEEDER_INTEGRATION_TEST=1 with a disposable backend test database")
	}
	database.SetupDatabaseByMode("test")
	conflicting := database.User{
		Role:          "User",
		UserName:      seedJudgeUserName,
		RealName:      "not the fixture judge",
		Password:      "not-a-seeder-password",
		Email:         seedJudgeEmail,
		InstitutionID: database.NoInstitutionID,
	}
	if err := database.DB.Create(&conflicting).Error; err != nil {
		t.Fatalf("create conflicting judge account: %v", err)
	}
	if _, err := Seed(database.DB, Registered); err == nil {
		t.Fatal("seed accepted a conflicting judge account")
	}
	var competitions int64
	if err := database.DB.Model(&database.Competition{}).Where("script = ?", marker(Registered)).Count(&competitions).Error; err != nil {
		t.Fatalf("count competitions after rejected collision: %v", err)
	}
	if competitions != 0 {
		t.Fatalf("collision must roll back fixture creation, got %d competitions", competitions)
	}
}

// assertScenarioCounts spells out the per-item row counts the scenarios promise,
// independently of AssertInvariants walking the same graph.
func assertScenarioCounts(t *testing.T, scenario Scenario, competitionID uint) {
	t.Helper()
	var judge database.User
	if err := database.DB.Where("user_name = ?", seedJudgeUserName).First(&judge).Error; err != nil {
		t.Fatalf("%s find judge user: %v", scenario, err)
	}
	countIs(t, fmt.Sprintf("%s approved judge participant", scenario), 1,
		database.DB.Model(&database.Participant{}).Where("competition_id = ? AND user_id = ? AND role = ? AND status = ?", competitionID, judge.ID, "Judge", "approved"))
	countIs(t, fmt.Sprintf("%s judge players", scenario), 0,
		database.DB.Model(&database.Player{}).
			Joins("JOIN participants ON participants.id = players.participant_id").
			Where("participants.competition_id = ? AND participants.user_id = ?", competitionID, judge.ID))
	groupIDs := itemGroupIDs(t, competitionID)
	if len(groupIDs) != len(itemSpecs) {
		t.Fatalf("%s must have %d item groups, got %d", scenario, len(itemSpecs), len(groupIDs))
	}
	for index, groupID := range groupIDs {
		countIs(t, fmt.Sprintf("%s item %d players", scenario, index+1), playersPerItem,
			database.DB.Model(&database.Player{}).Where("group_id = ?", groupID))
		countIs(t, fmt.Sprintf("%s item %d lanes", scenario, index+1), lanesPerItem,
			database.DB.Model(&database.Lane{}).Where("competition_id = ? AND qualification_id = ?", competitionID, groupID))
		countIs(t, fmt.Sprintf("%s item %d unscored arrows", scenario, index+1), unscoredArrows(scenario),
			roundScoresOfGroup(groupID).Where("round_scores.score = ?", -1))

		var elimination database.Elimination
		if err := database.DB.Where("group_id = ? AND team_size = ?", groupID, 1).First(&elimination).Error; err != nil {
			t.Fatalf("%s item %d elimination: %v", scenario, index+1, err)
		}
		stages, matches, results, sets := 0, 0, 0, 0
		if scenario == EliminationFinished {
			stages, matches, results, sets = 3, 8, 16, playersPerItem
		}
		countIs(t, fmt.Sprintf("%s item %d stages", scenario, index+1), stages,
			database.DB.Model(&database.Stage{}).Where("elimination_id = ?", elimination.ID))
		countIs(t, fmt.Sprintf("%s item %d matches", scenario, index+1), matches,
			database.DB.Model(&database.Match{}).Joins("JOIN stages ON stages.id = matches.stage_id").Where("stages.elimination_id = ?", elimination.ID))
		countIs(t, fmt.Sprintf("%s item %d match results", scenario, index+1), results,
			database.DB.Model(&database.MatchResult{}).
				Joins("JOIN matches ON matches.id = match_results.match_id").
				Joins("JOIN stages ON stages.id = matches.stage_id").
				Where("stages.elimination_id = ?", elimination.ID))
		countIs(t, fmt.Sprintf("%s item %d player sets", scenario, index+1), sets,
			database.DB.Model(&database.PlayerSet{}).Where("elimination_id = ?", elimination.ID))
		countIs(t, fmt.Sprintf("%s item %d medals", scenario, index+1), 3,
			database.DB.Model(&database.Medal{}).Where("elimination_id = ?", elimination.ID))
	}
}

// assertScenariosDoNotShareRows checks that no scenario reaches into another
// one's rows, which would make one competition's data depend on another.
func assertScenariosDoNotShareRows(t *testing.T, competitions map[Scenario]uint) {
	t.Helper()
	owners := map[string]map[uint]Scenario{}
	claim := func(table string, scenario Scenario, ids []uint) {
		if owners[table] == nil {
			owners[table] = map[uint]Scenario{}
		}
		for _, id := range ids {
			if previous, taken := owners[table][id]; taken {
				t.Fatalf("%s row %d is shared by scenarios %s and %s", table, id, previous, scenario)
			}
			owners[table][id] = scenario
		}
	}
	for scenario, competitionID := range competitions {
		groupIDs := itemGroupIDs(t, competitionID)
		claim("groups", scenario, groupIDs)
		claim("lanes", scenario, pluck(t, database.DB.Model(&database.Lane{}).Where("competition_id = ?", competitionID), "lanes.id"))
		claim("participants", scenario, pluck(t, database.DB.Model(&database.Participant{}).Where("competition_id = ?", competitionID), "participants.id"))
		claim("players", scenario, pluck(t, database.DB.Model(&database.Player{}).Where("group_id IN ?", groupIDs), "players.id"))
		eliminationIDs := pluck(t, database.DB.Model(&database.Elimination{}).Where("group_id IN ?", groupIDs), "eliminations.id")
		claim("eliminations", scenario, eliminationIDs)
		claim("player_sets", scenario, pluck(t, database.DB.Model(&database.PlayerSet{}).Where("elimination_id IN ?", eliminationIDs), "player_sets.id"))
		claim("medals", scenario, pluck(t, database.DB.Model(&database.Medal{}).Where("elimination_id IN ?", eliminationIDs), "medals.id"))
		claim("stages", scenario, pluck(t, database.DB.Model(&database.Stage{}).Where("elimination_id IN ?", eliminationIDs), "stages.id"))
	}
}

func itemGroupIDs(t *testing.T, competitionID uint) []uint {
	t.Helper()
	var ids []uint
	if err := database.DB.Table("groups").
		Where("competition_id = ? AND group_index >= 0", competitionID).
		Order("group_index ASC").
		Pluck("id", &ids).Error; err != nil {
		t.Fatalf("find item groups of competition %d: %v", competitionID, err)
	}
	return ids
}

func roundScoresOfGroup(groupID uint) *gorm.DB {
	return database.DB.Model(&database.RoundScore{}).
		Joins("JOIN round_ends ON round_ends.id = round_scores.round_end_id").
		Joins("JOIN rounds ON rounds.id = round_ends.round_id").
		Joins("JOIN players ON players.id = rounds.player_id").
		Where("players.group_id = ?", groupID)
}

// unscoredArrows is every arrow of the item before the qualification is shot,
// and none once it is finished.
func unscoredArrows(scenario Scenario) int {
	if scenario == Registered {
		return playersPerItem * roundsNum * endsPerRound * arrowsPerEnd
	}
	return 0
}

func countIs(t *testing.T, name string, expected int, query *gorm.DB) {
	t.Helper()
	var count int64
	if err := query.Count(&count).Error; err != nil {
		t.Fatalf("count %s: %v", name, err)
	}
	if count != int64(expected) {
		t.Fatalf("%s: got %d, want %d", name, count, expected)
	}
}

func pluck(t *testing.T, query *gorm.DB, column string) []uint {
	t.Helper()
	var ids []uint
	if err := query.Pluck(column, &ids).Error; err != nil {
		t.Fatalf("pluck %s: %v", column, err)
	}
	return ids
}
