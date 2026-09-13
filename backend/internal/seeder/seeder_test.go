//go:build integration

package seeder

import (
	"backend/internal/database"
	"fmt"
	"os"
	"testing"

	"gorm.io/gorm"
)

// This test intentionally requires an explicit disposable MySQL database. The
// project test initializer drops tables, so it must never run by accident.
func TestSeedScenarioInvariants(t *testing.T) {
	if os.Getenv("SEEDER_INTEGRATION_TEST") != "1" {
		t.Fatal("integration tests require scripts/test.sh go-integration")
	}
	if err := database.ResetTestDatabase("legacy"); err != nil {
		t.Fatal(err)
	}
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
		t.Fatal("integration tests require scripts/test.sh go-integration")
	}
	if err := database.ResetTestDatabase("legacy"); err != nil {
		t.Fatal(err)
	}
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
