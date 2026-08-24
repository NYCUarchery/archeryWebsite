// Package seeder creates isolated, repeatable development competitions.
package seeder

import (
	"backend/internal/database"
	pkg "backend/internal/pkg"
	"errors"
	"fmt"
	"strings"
	"time"

	"gorm.io/gorm"
)

// Scenario identifies one independently runnable development data set.
type Scenario string

const (
	Registered            Scenario = "registered"
	QualificationFinished Scenario = "qualification_finished"
	EliminationFinished   Scenario = "elimination_finished"

	seedPassword = "archery-seed-password"
	seedPrefix   = "development-seeder/"

	// One qualification round of six ends with six arrows each, exactly what
	// the application creates for a competition whose RoundsNum is one.
	roundsNum    = 1
	endsPerRound = 6
	arrowsPerEnd = 6

	// Every item is an eight archer field spread over four exclusive lanes,
	// two archers per lane with shooting orders one and two.
	playersPerItem = 8
	lanesPerItem   = 4
	playersPerLane = playersPerItem / lanesPerItem
	advancingNum   = playersPerItem

	// A finished individual bracket is three stages deep and five ends wide.
	finishedStages    = 3
	finishedMatchEnd  = 5
	arrowsPerMatchEnd = 3
)

// itemSpec describes one competition item. An item is a formal Group: the data
// model hangs Qualification (which shares the Group id), Lane, Player and
// Elimination rows off a Group, so a Group is the only per-item container that
// exists. Lane range and archer range are derived from the item's position.
type itemSpec struct {
	GroupName  string
	GroupRange string
	BowType    string
}

var itemSpecs = []itemSpec{
	{GroupName: "公開男子反曲弓組", GroupRange: "公開男子", BowType: "Recurve"},
	{GroupName: "公開女子反曲弓組", GroupRange: "公開女子", BowType: "Recurve"},
	{GroupName: "新人反曲弓組", GroupRange: "新人", BowType: "Recurve"},
}

var scenarios = []Scenario{Registered, QualificationFinished, EliminationFinished}

type Result struct {
	Scenario      Scenario
	CompetitionID uint
	Created       bool
	Items         int
	Players       int
}

// seededItem collects everything one item owns, so later steps never have to
// guess which group a lane, player or bracket row belongs to.
type seededItem struct {
	Index       int
	Spec        itemSpec
	Group       database.Group
	Elimination database.Elimination
	Lanes       []database.Lane
	Players     []database.Player
}

// ParseScenario only accepts the explicit scenarios exposed by the command.
func ParseScenario(value string) (Scenario, error) {
	scenario := Scenario(value)
	for _, candidate := range scenarios {
		if scenario == candidate {
			return scenario, nil
		}
	}
	return "", fmt.Errorf("unknown scenario %q (use registered, qualification_finished, elimination_finished, or all)", value)
}

func AllScenarios() []Scenario {
	return append([]Scenario(nil), scenarios...)
}

func marker(scenario Scenario) string {
	return seedPrefix + string(scenario)
}

func title(scenario Scenario) string {
	return "Seeder - " + strings.ReplaceAll(string(scenario), "_", " ")
}

// itemStartLane and itemEndLane keep the lane ranges contiguous and disjoint:
// item 0 shoots lanes 1-4, item 1 lanes 5-8, item 2 lanes 9-12. Lane 0 stays
// the competition wide unassigned lane.
func itemStartLane(index int) int {
	return index*lanesPerItem + 1
}

func itemEndLane(index int) int {
	return itemStartLane(index) + lanesPerItem - 1
}

func itemLaneNumbers(index int) []int {
	numbers := make([]int, 0, lanesPerItem)
	for number := itemStartLane(index); number <= itemEndLane(index); number++ {
		numbers = append(numbers, number)
	}
	return numbers
}

func totalLanes() int {
	return len(itemSpecs) * lanesPerItem
}

func seededUserCount() int {
	return len(itemSpecs) * playersPerItem
}

// Seed creates one scenario in a transaction. A previously completed scenario is
// left untouched, so repeating the command never overwrites seeded or user data.
func Seed(db *gorm.DB, scenario Scenario) (Result, error) {
	if _, err := ParseScenario(string(scenario)); err != nil {
		return Result{}, err
	}
	if db == nil {
		return Result{}, errors.New("database is not initialized")
	}

	result := Result{Scenario: scenario, Items: len(itemSpecs), Players: seededUserCount()}
	err := db.Transaction(func(tx *gorm.DB) error {
		var existing database.Competition
		err := tx.Where("script = ?", marker(scenario)).First(&existing).Error
		if err == nil {
			if err := AssertInvariants(tx, scenario, existing.ID); err != nil {
				return fmt.Errorf("existing %s scenario is incomplete or invalid: %w", scenario, err)
			}
			result.CompetitionID = existing.ID
			return nil
		}
		if !errors.Is(err, gorm.ErrRecordNotFound) {
			return fmt.Errorf("find existing %s scenario: %w", scenario, err)
		}

		host, err := firstDictator(tx)
		if err != nil {
			return err
		}
		users, err := ensurePlayers(tx)
		if err != nil {
			return err
		}
		competition, err := createCompetition(tx, scenario, host.ID)
		if err != nil {
			return err
		}
		if err := addHostAdmin(tx, competition.ID, host.ID); err != nil {
			return err
		}
		for index, spec := range itemSpecs {
			item, err := createItem(tx, competition, index, spec)
			if err != nil {
				return err
			}
			itemUsers := users[index*playersPerItem : (index+1)*playersPerItem]
			if err := addItemPlayers(tx, competition, item, itemUsers, scenario != Registered); err != nil {
				return err
			}
			if scenario == EliminationFinished {
				if err := createFinishedElimination(tx, item); err != nil {
					return err
				}
			}
		}
		result.CompetitionID = competition.ID
		result.Created = true
		return nil
	})
	return result, err
}

func firstDictator(tx *gorm.DB) (database.User, error) {
	var dictator database.User
	if err := tx.Where("role = ?", pkg.RoleToString(pkg.RDictator)).Order("id ASC").First(&dictator).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return dictator, errors.New("no Dictator user exists; configure dictator.yaml and initialize the backend first")
		}
		return dictator, fmt.Errorf("find first Dictator user: %w", err)
	}
	return dictator, nil
}

func ensurePlayers(tx *gorm.DB) ([]database.User, error) {
	players := make([]database.User, 0, seededUserCount())
	for index := 1; index <= seededUserCount(); index++ {
		username := fmt.Sprintf("seeder.archer.%02d", index)
		email := fmt.Sprintf("%s@example.invalid", username)
		var user database.User
		err := tx.Where("user_name = ?", username).First(&user).Error
		switch {
		case err == nil:
			if user.Role != pkg.RoleToString(pkg.RUser) || user.Email != email || user.InstitutionID != database.NoInstitutionID || pkg.Compare(user.Password, seedPassword) != nil {
				return nil, fmt.Errorf("existing user %q is not this seeder's development account; refusing to modify it", username)
			}
		case errors.Is(err, gorm.ErrRecordNotFound):
			user = database.User{
				Role:          pkg.RoleToString(pkg.RUser),
				UserName:      username,
				RealName:      fmt.Sprintf("種子選手%02d", index),
				Password:      pkg.EncryptPassword(seedPassword),
				Email:         email,
				InstitutionID: database.NoInstitutionID,
				Overview:      "development seeder account",
			}
			if err := tx.Create(&user).Error; err != nil {
				return nil, fmt.Errorf("create %q: %w", username, err)
			}
		default:
			return nil, fmt.Errorf("find %q: %w", username, err)
		}
		players = append(players, user)
	}
	return players, nil
}

// createCompetition builds the competition shell: the unassigned group with its
// qualification and lane 0. Item groups, item lanes and brackets are added by
// createItem so a new item never needs a second code path.
func createCompetition(tx *gorm.DB, scenario Scenario, hostID uint) (database.Competition, error) {
	competition := database.Competition{
		Title:        title(scenario),
		SubTitle:     "Development-only seeder data",
		StartTime:    time.Date(2030, time.January, 1, 9, 0, 0, 0, time.UTC),
		EndTime:      time.Date(2030, time.January, 1, 18, 0, 0, 0, time.UTC),
		HostID:       hostID,
		RoundsNum:    roundsNum,
		GroupsNum:    len(itemSpecs),
		LanesNum:     totalLanes(),
		Script:       marker(scenario),
		CurrentPhase: 0,
	}
	if scenario != Registered {
		competition.QualificationIsActive = true
		competition.QualificationCurrentEnd = roundsNum * endsPerRound
	}
	if scenario == EliminationFinished {
		competition.EliminationIsActive = true
		competition.CurrentPhase = 1
	}
	if err := tx.Create(&competition).Error; err != nil {
		return competition, fmt.Errorf("create competition: %w", err)
	}

	unassigned := database.Group{CompetitionId: competition.ID, GroupName: "unassigned", GroupIndex: -1}
	if err := tx.Table("groups").Create(&unassigned).Error; err != nil {
		return competition, fmt.Errorf("create unassigned group: %w", err)
	}
	if err := createQualification(tx, unassigned.ID, 0, 0, 0); err != nil {
		return competition, err
	}
	unassignedLane := database.Lane{CompetitionId: competition.ID, QualificationId: unassigned.ID, LaneNumber: 0}
	if err := tx.Create(&unassignedLane).Error; err != nil {
		return competition, fmt.Errorf("create unassigned lane: %w", err)
	}
	competition.UnassignedGroupId = unassigned.ID
	competition.UnassignedLaneId = unassignedLane.ID
	if err := tx.Model(&database.Competition{}).Where("id = ?", competition.ID).Updates(map[string]interface{}{
		"unassigned_group_id": unassigned.ID,
		"unassigned_lane_id":  unassignedLane.ID,
	}).Error; err != nil {
		return competition, fmt.Errorf("link unassigned group and lane: %w", err)
	}
	return competition, nil
}

// createItem creates one item: its group, the qualification sharing the group
// id, the individual elimination with its three empty medals, and the four
// lanes only this item shoots on.
func createItem(tx *gorm.DB, competition database.Competition, index int, spec itemSpec) (*seededItem, error) {
	group := database.Group{
		CompetitionId: competition.ID,
		GroupName:     spec.GroupName,
		GroupRange:    spec.GroupRange,
		BowType:       spec.BowType,
		GroupIndex:    index,
	}
	if err := tx.Table("groups").Create(&group).Error; err != nil {
		return nil, fmt.Errorf("create group %q: %w", spec.GroupName, err)
	}
	// Endpoints use Group.ID as Qualification.ID. Set it explicitly instead of
	// relying on two unrelated auto-increment sequences remaining aligned.
	if err := createQualification(tx, group.ID, advancingNum, itemStartLane(index), itemEndLane(index)); err != nil {
		return nil, err
	}
	// PostGroupInfo creates this default individual elimination and its three
	// medals. Keep it in every scenario, then only fill it for the finished one.
	elimination, err := createIndividualElimination(tx, group.ID)
	if err != nil {
		return nil, err
	}
	lanes := make([]database.Lane, 0, lanesPerItem)
	for _, number := range itemLaneNumbers(index) {
		lane := database.Lane{CompetitionId: competition.ID, QualificationId: group.ID, LaneNumber: number}
		if err := tx.Create(&lane).Error; err != nil {
			return nil, fmt.Errorf("create lane %d for %q: %w", number, spec.GroupName, err)
		}
		lanes = append(lanes, lane)
	}
	return &seededItem{Index: index, Spec: spec, Group: group, Elimination: elimination, Lanes: lanes}, nil
}

func createQualification(tx *gorm.DB, id uint, advancing, startLane, endLane int) error {
	qualification := database.Qualification{ID: id, AdvancingNum: advancing, StartLaneNumber: startLane, EndLaneNumber: endLane}
	if err := tx.Create(&qualification).Error; err != nil {
		return fmt.Errorf("create qualification for group %d: %w", id, err)
	}
	return nil
}

func addHostAdmin(tx *gorm.DB, competitionID, hostID uint) error {
	host := database.Participant{UserID: hostID, CompetitionID: competitionID, Role: pkg.RoleToString(pkg.RAdmin), Status: "approved"}
	if err := tx.Create(&host).Error; err != nil {
		return fmt.Errorf("add Dictator as competition admin: %w", err)
	}
	return nil
}

// addItemPlayers approves one participant per user and gives it exactly one
// player in this item. Two archers share a lane with orders one and two.
func addItemPlayers(tx *gorm.DB, competition database.Competition, item *seededItem, users []database.User, completedQualification bool) error {
	if len(users) != playersPerItem {
		return fmt.Errorf("item %q needs exactly %d archers, got %d", item.Spec.GroupName, playersPerItem, len(users))
	}
	item.Players = make([]database.Player, 0, len(users))
	for index, user := range users {
		participant := database.Participant{UserID: user.ID, CompetitionID: competition.ID, Role: pkg.RoleToString(pkg.RPlayer), Status: "approved"}
		if err := tx.Create(&participant).Error; err != nil {
			return fmt.Errorf("add player participant %q: %w", user.UserName, err)
		}
		player := database.Player{
			GroupId:       item.Group.ID,
			LaneId:        item.Lanes[index%lanesPerItem].ID,
			ParticipantId: participant.ID,
			Name:          user.RealName,
			ShootOffScore: -1,
			Order:         index/lanesPerItem + 1,
		}
		if completedQualification {
			player.TotalScore = qualificationScore(item.Index, index)
			player.Rank = index + 1
		}
		if err := tx.Create(&player).Error; err != nil {
			return fmt.Errorf("create player %q: %w", user.UserName, err)
		}
		if err := createQualificationRound(tx, player, completedQualification); err != nil {
			return err
		}
		item.Players = append(item.Players, player)
	}
	return nil
}

// qualificationScore is strictly descending inside an item, so ranks 1 to 8 are
// unambiguous, and shifted one point per item so no two items share a score.
// The shift stays smaller than the six point rank step, which keeps the scores
// unique for up to six items; TestQualificationSeedScoresAreRankedAndRepresentable
// fails if another item breaks that.
func qualificationScore(itemIndex, rankIndex int) int {
	return 354 - rankIndex*6 - itemIndex
}

func createQualificationRound(tx *gorm.DB, player database.Player, finished bool) error {
	round := database.Round{PlayerId: player.ID}
	if finished {
		round.TotalScore = player.TotalScore
	}
	if err := tx.Create(&round).Error; err != nil {
		return fmt.Errorf("create qualification round for player %d: %w", player.ID, err)
	}
	scores := make([]int, endsPerRound*arrowsPerEnd)
	for index := range scores {
		scores[index] = -1
	}
	if finished {
		remaining := player.TotalScore
		for index := range scores {
			score := min(10, remaining)
			scores[index] = score
			remaining -= score
		}
	}
	for end := 0; end < endsPerRound; end++ {
		roundEnd := database.RoundEnd{RoundId: round.ID, IsConfirmed: finished}
		if err := tx.Create(&roundEnd).Error; err != nil {
			return fmt.Errorf("create qualification end for player %d: %w", player.ID, err)
		}
		for arrow := 0; arrow < arrowsPerEnd; arrow++ {
			if err := tx.Create(&database.RoundScore{RoundEndId: roundEnd.ID, Score: scores[end*arrowsPerEnd+arrow]}).Error; err != nil {
				return fmt.Errorf("create qualification score for player %d: %w", player.ID, err)
			}
		}
	}
	return nil
}

func createIndividualElimination(tx *gorm.DB, groupID uint) (database.Elimination, error) {
	elimination := database.Elimination{GroupId: groupID, TeamSize: 1}
	if err := tx.Create(&elimination).Error; err != nil {
		return database.Elimination{}, fmt.Errorf("create individual elimination: %w", err)
	}
	for medalType := 0; medalType < 3; medalType++ {
		if err := tx.Create(&database.Medal{EliminationId: elimination.ID, Type: medalType}).Error; err != nil {
			return database.Elimination{}, fmt.Errorf("create default medal %d: %w", medalType, err)
		}
	}
	return elimination, nil
}

// bracketMatch pairs two seeds of the item by their qualification rank index.
type bracketMatch struct {
	First       int
	Second      int
	WinnerIndex int
}

// bracketRounds is a standard eight archer bracket. The final stage keeps the
// gold match first and the bronze match second, which is the order
// frontend/src/utils/parseStagesToTree.ts reads them back in.
var bracketRounds = [][]bracketMatch{
	{{0, 7, 0}, {3, 4, 0}, {1, 6, 0}, {2, 5, 0}},
	{{0, 3, 0}, {1, 2, 0}},
	{{0, 1, 0}, {3, 2, 1}},
}

func createFinishedElimination(tx *gorm.DB, item *seededItem) error {
	if len(item.Players) != playersPerItem {
		return fmt.Errorf("finished elimination needs exactly %d players, got %d", playersPerItem, len(item.Players))
	}
	elimination := item.Elimination
	if err := tx.Model(&database.Elimination{}).Where("id = ?", elimination.ID).Updates(map[string]interface{}{
		"current_stage": finishedStages,
		"current_end":   finishedMatchEnd,
	}).Error; err != nil {
		return fmt.Errorf("complete individual elimination %d: %w", elimination.ID, err)
	}
	item.Elimination.CurrentStage = finishedStages
	item.Elimination.CurrentEnd = finishedMatchEnd

	sets := make([]database.PlayerSet, len(item.Players))
	for index, player := range item.Players {
		sets[index] = database.PlayerSet{EliminationId: elimination.ID, TotalScore: player.TotalScore, Rank: player.Rank, SetName: player.Name}
		if err := tx.Create(&sets[index]).Error; err != nil {
			return fmt.Errorf("create player set for player %d: %w", player.ID, err)
		}
		if err := tx.Create(&database.PlayerSetMatchTable{PlayerId: player.ID, PlayerSetId: sets[index].ID}).Error; err != nil {
			return fmt.Errorf("link player %d to player set: %w", player.ID, err)
		}
	}
	// Gold, silver and bronze follow from the bracket below: the top seed wins
	// out, the runner up loses the final, the bronze match winner is seed four.
	if err := assignMedals(tx, elimination.ID, sets[0].ID, sets[1].ID, sets[2].ID); err != nil {
		return err
	}

	for roundIndex, round := range bracketRounds {
		stage := database.Stage{EliminationId: elimination.ID}
		if err := tx.Create(&stage).Error; err != nil {
			return fmt.Errorf("create elimination stage %d: %w", roundIndex+1, err)
		}
		for _, match := range round {
			if err := createFinishedMatch(tx, stage.ID, sets[match.First], sets[match.Second], match.WinnerIndex); err != nil {
				return err
			}
		}
	}
	return nil
}

func assignMedals(tx *gorm.DB, eliminationID, gold, silver, bronze uint) error {
	medalSets := []uint{gold, silver, bronze}
	for medalType, playerSetID := range medalSets {
		result := tx.Model(&database.Medal{}).
			Where("elimination_id = ? AND type = ?", eliminationID, medalType).
			Update("player_set_id", playerSetID)
		if result.Error != nil || result.RowsAffected != 1 {
			if result.Error != nil {
				return fmt.Errorf("assign medal %d: %w", medalType, result.Error)
			}
			return fmt.Errorf("assign medal %d: expected one row, updated %d", medalType, result.RowsAffected)
		}
	}
	return nil
}

func createFinishedMatch(tx *gorm.DB, stageID uint, first, second database.PlayerSet, winnerIndex int) error {
	match := database.Match{StageId: stageID}
	if err := tx.Create(&match).Error; err != nil {
		return fmt.Errorf("create match: %w", err)
	}
	sets := []database.PlayerSet{first, second}
	for index, playerSet := range sets {
		winner := index == winnerIndex
		playerSetID := playerSet.ID
		result := database.MatchResult{
			MatchId:       match.ID,
			PlayerSetId:   &playerSetID,
			TotalPoints:   map[bool]int{true: 6, false: 4}[winner],
			ShootOffScore: -1,
			IsWinner:      winner,
			LaneNumber:    index + 1,
		}
		if err := tx.Create(&result).Error; err != nil {
			return fmt.Errorf("create match result: %w", err)
		}
		for endNumber := 0; endNumber < finishedMatchEnd; endNumber++ {
			total := 24
			// A complete five-end match gives its winner ends 1, 3, and 5
			// (six set points); the other side wins ends 2 and 4 (four).
			if winner == (endNumber%2 == 0) {
				total = 30
			}
			// Scores are complete, but every end stays unconfirmed so the
			// elimination scoring screens can be exercised on filled in data
			// that still needs a referee confirmation.
			end := database.MatchEnd{MatchResultId: result.ID, TotalScore: total, IsConfirmed: false}
			if err := tx.Create(&end).Error; err != nil {
				return fmt.Errorf("create match end: %w", err)
			}
			arrowScore := total / arrowsPerMatchEnd
			for arrow := 0; arrow < arrowsPerMatchEnd; arrow++ {
				if err := tx.Create(&database.MatchScore{MatchEndId: end.ID, Score: arrowScore}).Error; err != nil {
					return fmt.Errorf("create match score: %w", err)
				}
			}
		}
	}
	return nil
}

// AssertInvariants is deliberately read-only. It is used by the optional
// integration test and is useful to callers that want to validate a database.
// It checks the whole competition: shape, lanes, participants, then every item
// in isolation, so a marker that exists with incomplete data is reported as an
// error instead of being mistaken for a finished scenario.
func AssertInvariants(db *gorm.DB, scenario Scenario, competitionID uint) error {
	competition, groups, err := assertCompetitionShape(db, scenario, competitionID)
	if err != nil {
		return err
	}
	lanes, err := assertLanes(db, competition, groups)
	if err != nil {
		return err
	}
	if err := assertParticipantsAndUsers(db, competition); err != nil {
		return err
	}
	for index, group := range groups {
		if err := assertItem(db, scenario, competition, index, group, lanes); err != nil {
			return fmt.Errorf("item %d (%s): %w", index+1, group.GroupName, err)
		}
	}
	return nil
}

// assertCompetitionShape returns the formal item groups ordered by GroupIndex.
func assertCompetitionShape(db *gorm.DB, scenario Scenario, competitionID uint) (database.Competition, []database.Group, error) {
	var competition database.Competition
	if err := db.First(&competition, competitionID).Error; err != nil {
		return competition, nil, err
	}
	if competition.Script != marker(scenario) {
		return competition, nil, fmt.Errorf("competition %d has unexpected scenario marker %q", competitionID, competition.Script)
	}
	var dictator database.User
	if err := db.Where("id = ? AND role = ?", competition.HostID, pkg.RoleToString(pkg.RDictator)).First(&dictator).Error; err != nil {
		return competition, nil, fmt.Errorf("competition host is not a Dictator: %w", err)
	}
	if competition.RoundsNum != roundsNum || competition.LanesNum != totalLanes() || competition.GroupsNum != len(itemSpecs) {
		return competition, nil, fmt.Errorf("competition must have rounds=%d lanes=%d groups=%d, got rounds=%d lanes=%d groups=%d",
			roundsNum, totalLanes(), len(itemSpecs), competition.RoundsNum, competition.LanesNum, competition.GroupsNum)
	}

	var allGroups []database.Group
	if err := db.Table("groups").Where("competition_id = ?", competition.ID).Order("group_index ASC").Find(&allGroups).Error; err != nil {
		return competition, nil, fmt.Errorf("find competition groups: %w", err)
	}
	if len(allGroups) != len(itemSpecs)+1 {
		return competition, nil, fmt.Errorf("competition must have one unassigned group and %d item groups, got %d groups", len(itemSpecs), len(allGroups))
	}
	// Every group, unassigned included, owns the qualification that shares its id.
	for _, candidate := range allGroups {
		var qualification database.Qualification
		if err := db.First(&qualification, candidate.ID).Error; err != nil || qualification.ID != candidate.ID {
			return competition, nil, fmt.Errorf("Group.ID must equal Qualification.ID for group %d: %w", candidate.ID, err)
		}
	}

	unassigned := make([]database.Group, 0, 1)
	groups := make([]database.Group, 0, len(itemSpecs))
	for _, candidate := range allGroups {
		if candidate.GroupIndex < 0 {
			unassigned = append(unassigned, candidate)
			continue
		}
		groups = append(groups, candidate)
	}
	if len(unassigned) != 1 || unassigned[0].ID != competition.UnassignedGroupId {
		return competition, nil, fmt.Errorf("competition must have exactly one unassigned group linked from the competition, got %d", len(unassigned))
	}
	if len(groups) != len(itemSpecs) {
		return competition, nil, fmt.Errorf("competition must have %d item groups, got %d", len(itemSpecs), len(groups))
	}
	for index, group := range groups {
		spec := itemSpecs[index]
		if group.GroupIndex != index || group.GroupName != spec.GroupName || group.GroupRange != spec.GroupRange || group.BowType != spec.BowType {
			return competition, nil, fmt.Errorf("item group %d does not match its specification: %+v", index, group)
		}
	}
	return competition, groups, nil
}

// assertLanes checks that lane 0 stays unassigned and that each item owns the
// four lanes of its own range and no others.
func assertLanes(db *gorm.DB, competition database.Competition, groups []database.Group) (map[int]database.Lane, error) {
	var lanes []database.Lane
	if err := db.Where("competition_id = ?", competition.ID).Order("lane_number ASC").Find(&lanes).Error; err != nil {
		return nil, fmt.Errorf("find competition lanes: %w", err)
	}
	if len(lanes) != totalLanes()+1 {
		return nil, fmt.Errorf("competition must have lane 0 plus %d item lanes, got %d lanes", totalLanes(), len(lanes))
	}
	byNumber := make(map[int]database.Lane, len(lanes))
	for _, lane := range lanes {
		if _, duplicated := byNumber[lane.LaneNumber]; duplicated {
			return nil, fmt.Errorf("lane number %d is duplicated", lane.LaneNumber)
		}
		byNumber[lane.LaneNumber] = lane
	}
	unassignedLane, found := byNumber[0]
	if !found || unassignedLane.ID != competition.UnassignedLaneId || unassignedLane.QualificationId != competition.UnassignedGroupId {
		return nil, errors.New("lane 0 must be the unassigned lane of the unassigned group")
	}
	for index, group := range groups {
		for _, number := range itemLaneNumbers(index) {
			lane, found := byNumber[number]
			if !found {
				return nil, fmt.Errorf("item %d is missing lane %d", index+1, number)
			}
			if lane.QualificationId != group.ID {
				return nil, fmt.Errorf("lane %d belongs to qualification %d, expected item %d qualification %d", number, lane.QualificationId, index+1, group.ID)
			}
		}
		owned := 0
		for _, lane := range lanes {
			if lane.QualificationId == group.ID {
				owned++
			}
		}
		if owned != lanesPerItem {
			return nil, fmt.Errorf("item %d must own exactly %d lanes, got %d", index+1, lanesPerItem, owned)
		}
	}
	return byNumber, nil
}

// assertParticipantsAndUsers checks the competition wide participant counts and
// that every seeded account is an approved player of this competition exactly
// once.
func assertParticipantsAndUsers(db *gorm.DB, competition database.Competition) error {
	var hostAdmins, playerParticipants, seededUsers, seededParticipants, players, distinctParticipants int64
	if err := db.Model(&database.Participant{}).
		Where("competition_id = ? AND user_id = ? AND role = ? AND status = ?", competition.ID, competition.HostID, pkg.RoleToString(pkg.RAdmin), "approved").
		Count(&hostAdmins).Error; err != nil || hostAdmins != 1 {
		return fmt.Errorf("competition must have one approved Dictator admin participant, got %d: %w", hostAdmins, err)
	}
	if err := db.Model(&database.Participant{}).
		Where("competition_id = ? AND role = ? AND status = ?", competition.ID, pkg.RoleToString(pkg.RPlayer), "approved").
		Count(&playerParticipants).Error; err != nil || playerParticipants != int64(seededUserCount()) {
		return fmt.Errorf("competition must have %d approved player participants, got %d: %w", seededUserCount(), playerParticipants, err)
	}
	if err := db.Model(&database.User{}).
		Where("user_name LIKE ? AND institution_id = ?", "seeder.archer.%", database.NoInstitutionID).
		Count(&seededUsers).Error; err != nil || seededUsers != int64(seededUserCount()) {
		return fmt.Errorf("%d seeder users must belong to No Institution, got %d: %w", seededUserCount(), seededUsers, err)
	}
	if err := db.Model(&database.Participant{}).
		Joins("JOIN users ON users.id = participants.user_id").
		Where("participants.competition_id = ? AND participants.role = ? AND participants.status = ? AND users.user_name LIKE ?",
			competition.ID, pkg.RoleToString(pkg.RPlayer), "approved", "seeder.archer.%").
		Count(&seededParticipants).Error; err != nil || seededParticipants != int64(seededUserCount()) {
		return fmt.Errorf("every seeder account must be an approved player of this competition, got %d: %w", seededParticipants, err)
	}
	// Every participant is used by exactly one player, and every player of this
	// competition belongs to one of its own groups.
	if err := db.Model(&database.Player{}).
		Joins("JOIN `groups` ON `groups`.id = players.group_id").
		Where("`groups`.competition_id = ?", competition.ID).
		Count(&players).Error; err != nil || players != int64(seededUserCount()) {
		return fmt.Errorf("competition must have %d players, got %d: %w", seededUserCount(), players, err)
	}
	if err := db.Model(&database.Player{}).
		Joins("JOIN `groups` ON `groups`.id = players.group_id").
		Where("`groups`.competition_id = ?", competition.ID).
		Distinct("players.participant_id").
		Count(&distinctParticipants).Error; err != nil || distinctParticipants != players {
		return fmt.Errorf("each participant must map to exactly one player, got %d participants for %d players: %w", distinctParticipants, players, err)
	}
	return nil
}

// assertItem validates one item end to end: its qualification, lane occupancy,
// scores, ranking and bracket. Everything is scoped by the item's own group and
// elimination ids, so a foreign key leaking into another item fails here.
func assertItem(db *gorm.DB, scenario Scenario, competition database.Competition, index int, group database.Group, lanes map[int]database.Lane) error {
	var qualification database.Qualification
	if err := db.First(&qualification, group.ID).Error; err != nil {
		return fmt.Errorf("find qualification: %w", err)
	}
	if qualification.AdvancingNum != advancingNum || qualification.StartLaneNumber != itemStartLane(index) || qualification.EndLaneNumber != itemEndLane(index) {
		return fmt.Errorf("qualification must advance %d archers on lanes %d-%d, got %d on %d-%d",
			advancingNum, itemStartLane(index), itemEndLane(index), qualification.AdvancingNum, qualification.StartLaneNumber, qualification.EndLaneNumber)
	}

	var players []database.Player
	if err := db.Where("group_id = ?", group.ID).Order("id ASC").Find(&players).Error; err != nil {
		return fmt.Errorf("find players: %w", err)
	}
	if len(players) != playersPerItem {
		return fmt.Errorf("item must have %d players, got %d", playersPerItem, len(players))
	}
	if err := assertItemLaneOccupancy(index, players, lanes); err != nil {
		return err
	}
	for _, player := range players {
		var participant database.Participant
		if err := db.First(&participant, player.ParticipantId).Error; err != nil {
			return fmt.Errorf("find participant of player %d: %w", player.ID, err)
		}
		if participant.CompetitionID != competition.ID || participant.Role != pkg.RoleToString(pkg.RPlayer) || participant.Status != "approved" {
			return fmt.Errorf("player %d is not backed by an approved player participant of this competition", player.ID)
		}
	}
	if err := assertItemQualificationScores(db, scenario, competition, index, players); err != nil {
		return err
	}
	return assertItemElimination(db, scenario, competition, group, players)
}

// assertItemLaneOccupancy checks that the item fills each of its own lanes with
// two archers whose orders are 1 and 2.
func assertItemLaneOccupancy(index int, players []database.Player, lanes map[int]database.Lane) error {
	ordersByLane := make(map[uint][]int, lanesPerItem)
	for _, player := range players {
		ordersByLane[player.LaneId] = append(ordersByLane[player.LaneId], player.Order)
	}
	if len(ordersByLane) != lanesPerItem {
		return fmt.Errorf("item must spread its archers over %d lanes, got %d", lanesPerItem, len(ordersByLane))
	}
	for _, number := range itemLaneNumbers(index) {
		orders, found := ordersByLane[lanes[number].ID]
		if !found {
			return fmt.Errorf("lane %d has no archers", number)
		}
		if len(orders) != playersPerLane {
			return fmt.Errorf("lane %d must hold %d archers, got %d", number, playersPerLane, len(orders))
		}
		seen := make(map[int]bool, playersPerLane)
		for _, order := range orders {
			if order < 1 || order > playersPerLane || seen[order] {
				return fmt.Errorf("lane %d has invalid or duplicated shooting order %d", number, order)
			}
			seen[order] = true
		}
	}
	return nil
}

// assertItemQualificationScores checks arrow, end, round and player totals plus
// the item local ranking. Registered keeps every arrow at -1 and every end
// unconfirmed; the finished scenarios must agree on every total.
func assertItemQualificationScores(db *gorm.DB, scenario Scenario, competition database.Competition, index int, players []database.Player) error {
	finished := scenario != Registered
	if finished && (!competition.QualificationIsActive || competition.QualificationCurrentEnd != roundsNum*endsPerRound) {
		return fmt.Errorf("finished qualification must be active with %d ends completed, got active=%t end=%d",
			roundsNum*endsPerRound, competition.QualificationIsActive, competition.QualificationCurrentEnd)
	}
	if !finished && (competition.QualificationIsActive || competition.QualificationCurrentEnd != 0) {
		return errors.New("registered qualification must be inactive with no completed end")
	}
	ranks := make(map[int]bool, len(players))
	for position, player := range players {
		expectedScore, expectedRank := 0, 0
		if finished {
			expectedScore, expectedRank = qualificationScore(index, position), position+1
		}
		if player.TotalScore != expectedScore || player.Rank != expectedRank {
			return fmt.Errorf("player %d must have score %d and rank %d, got %d and %d", player.ID, expectedScore, expectedRank, player.TotalScore, player.Rank)
		}
		if finished {
			if ranks[player.Rank] {
				return fmt.Errorf("rank %d is duplicated inside the item", player.Rank)
			}
			ranks[player.Rank] = true
		}

		var rounds []database.Round
		if err := db.Where("player_id = ?", player.ID).Order("id ASC").Find(&rounds).Error; err != nil {
			return fmt.Errorf("find rounds of player %d: %w", player.ID, err)
		}
		if len(rounds) != roundsNum {
			return fmt.Errorf("player %d must have %d qualification round, got %d", player.ID, roundsNum, len(rounds))
		}
		playerTotal := 0
		for _, round := range rounds {
			var ends []database.RoundEnd
			if err := db.Where("round_id = ?", round.ID).Order("id ASC").Find(&ends).Error; err != nil {
				return fmt.Errorf("find ends of round %d: %w", round.ID, err)
			}
			if len(ends) != endsPerRound {
				return fmt.Errorf("round %d must have %d ends, got %d", round.ID, endsPerRound, len(ends))
			}
			roundTotal := 0
			for _, end := range ends {
				if end.IsConfirmed != finished {
					return fmt.Errorf("end %d confirmation must be %t", end.ID, finished)
				}
				var scores []database.RoundScore
				if err := db.Where("round_end_id = ?", end.ID).Order("id ASC").Find(&scores).Error; err != nil {
					return fmt.Errorf("find arrows of end %d: %w", end.ID, err)
				}
				if len(scores) != arrowsPerEnd {
					return fmt.Errorf("end %d must have %d arrows, got %d", end.ID, arrowsPerEnd, len(scores))
				}
				for _, score := range scores {
					if !finished {
						if score.Score != -1 {
							return fmt.Errorf("registered arrow %d must stay unscored, got %d", score.ID, score.Score)
						}
						continue
					}
					if score.Score < 0 || score.Score > 10 {
						return fmt.Errorf("finished arrow %d has invalid score %d", score.ID, score.Score)
					}
					roundTotal += score.Score
				}
			}
			expectedRoundTotal := 0
			if finished {
				expectedRoundTotal = roundTotal
			}
			if round.TotalScore != expectedRoundTotal {
				return fmt.Errorf("round %d total %d does not match its arrows %d", round.ID, round.TotalScore, roundTotal)
			}
			playerTotal += round.TotalScore
		}
		if playerTotal != player.TotalScore {
			return fmt.Errorf("player %d total %d does not match its rounds %d", player.ID, player.TotalScore, playerTotal)
		}
	}
	return nil
}

// assertItemElimination validates the item's individual elimination. Before the
// finished scenario it must exist with three empty medals and nothing else; in
// the finished scenario the whole bracket must agree with bracketRounds and the
// medals must point at the sets that bracket produces.
func assertItemElimination(db *gorm.DB, scenario Scenario, competition database.Competition, group database.Group, players []database.Player) error {
	var eliminations []database.Elimination
	if err := db.Where("group_id = ?", group.ID).Order("id ASC").Find(&eliminations).Error; err != nil {
		return fmt.Errorf("find eliminations: %w", err)
	}
	if len(eliminations) != 1 || eliminations[0].TeamSize != 1 {
		return fmt.Errorf("item must have exactly one individual elimination, got %d", len(eliminations))
	}
	elimination := eliminations[0]

	var medals []database.Medal
	if err := db.Where("elimination_id = ?", elimination.ID).Order("type ASC").Find(&medals).Error; err != nil {
		return fmt.Errorf("find medals: %w", err)
	}
	if len(medals) != 3 {
		return fmt.Errorf("elimination must have three medals, got %d", len(medals))
	}
	for index, medal := range medals {
		if medal.Type != index {
			return fmt.Errorf("medal types must be 0, 1 and 2, got %d at position %d", medal.Type, index)
		}
	}
	var stageCount, playerSetCount int64
	if err := db.Model(&database.Stage{}).Where("elimination_id = ?", elimination.ID).Count(&stageCount).Error; err != nil {
		return fmt.Errorf("count stages: %w", err)
	}
	if err := db.Model(&database.PlayerSet{}).Where("elimination_id = ?", elimination.ID).Count(&playerSetCount).Error; err != nil {
		return fmt.Errorf("count player sets: %w", err)
	}

	if scenario != EliminationFinished {
		if competition.EliminationIsActive {
			return errors.New("elimination must stay inactive before the elimination_finished scenario")
		}
		if elimination.CurrentStage != 0 || elimination.CurrentEnd != 0 {
			return fmt.Errorf("elimination progress must be zero, got stage=%d end=%d", elimination.CurrentStage, elimination.CurrentEnd)
		}
		if stageCount != 0 || playerSetCount != 0 {
			return fmt.Errorf("no bracket may exist yet, got stages=%d player sets=%d", stageCount, playerSetCount)
		}
		for _, medal := range medals {
			if medal.PlayerSetId != 0 {
				return fmt.Errorf("medal %d must stay unassigned before the bracket exists", medal.Type)
			}
		}
		return nil
	}

	if !competition.EliminationIsActive {
		return errors.New("finished elimination must be active on the competition")
	}
	if elimination.CurrentStage != finishedStages || elimination.CurrentEnd != finishedMatchEnd {
		return fmt.Errorf("finished elimination must be at stage %d end %d, got stage=%d end=%d",
			finishedStages, finishedMatchEnd, elimination.CurrentStage, elimination.CurrentEnd)
	}
	if playerSetCount != int64(playersPerItem) {
		return fmt.Errorf("finished elimination must have %d player sets, got %d", playersPerItem, playerSetCount)
	}
	sets, err := assertItemPlayerSets(db, elimination, players)
	if err != nil {
		return err
	}

	var stages []database.Stage
	if err := db.Where("elimination_id = ?", elimination.ID).Order("id ASC").Find(&stages).Error; err != nil {
		return fmt.Errorf("find stages: %w", err)
	}
	if len(stages) != len(bracketRounds) {
		return fmt.Errorf("finished elimination must have %d stages, got %d", len(bracketRounds), len(stages))
	}
	totalMatches, totalResults := 0, 0
	for stageIndex, round := range bracketRounds {
		var matches []database.Match
		if err := db.Where("stage_id = ?", stages[stageIndex].ID).Order("id ASC").Find(&matches).Error; err != nil {
			return fmt.Errorf("find matches of stage %d: %w", stageIndex+1, err)
		}
		if len(matches) != len(round) {
			return fmt.Errorf("stage %d must have %d matches, got %d", stageIndex+1, len(round), len(matches))
		}
		for matchIndex, expected := range round {
			if err := assertFinishedMatch(db, matches[matchIndex].ID, sets[expected.First], sets[expected.Second], expected.WinnerIndex); err != nil {
				return fmt.Errorf("stage %d match %d: %w", stageIndex+1, matchIndex+1, err)
			}
			totalResults += 2
		}
		totalMatches += len(matches)
	}
	if totalMatches != 8 || totalResults != 16 {
		return fmt.Errorf("finished bracket must have 8 matches and 16 results, got %d and %d", totalMatches, totalResults)
	}
	// No match of this item may score a player set owned by another item.
	var foreignResults int64
	if err := db.Model(&database.MatchResult{}).
		Joins("JOIN matches ON matches.id = match_results.match_id").
		Joins("JOIN stages ON stages.id = matches.stage_id").
		Joins("JOIN player_sets ON player_sets.id = match_results.player_set_id").
		Where("stages.elimination_id = ? AND player_sets.elimination_id <> ?", elimination.ID, elimination.ID).
		Count(&foreignResults).Error; err != nil || foreignResults != 0 {
		return fmt.Errorf("bracket references %d player sets of another elimination: %w", foreignResults, err)
	}
	// Gold, silver and bronze must be the sets the last stage produced.
	expectedMedalSets := []database.PlayerSet{sets[0], sets[1], sets[2]}
	for index, expected := range expectedMedalSets {
		if medals[index].PlayerSetId != expected.ID {
			return fmt.Errorf("medal %d must be player set %d, got %d", index, expected.ID, medals[index].PlayerSetId)
		}
	}
	var finalStageMatches []database.Match
	if err := db.Where("stage_id = ?", stages[len(stages)-1].ID).Order("id ASC").Find(&finalStageMatches).Error; err != nil {
		return fmt.Errorf("find final stage matches: %w", err)
	}
	if err := assertMatchWinnerIs(db, finalStageMatches[0].ID, sets[0].ID); err != nil {
		return fmt.Errorf("gold medallist: %w", err)
	}
	if err := assertMatchLoserIs(db, finalStageMatches[0].ID, sets[1].ID); err != nil {
		return fmt.Errorf("silver medallist: %w", err)
	}
	if err := assertMatchWinnerIs(db, finalStageMatches[1].ID, sets[2].ID); err != nil {
		return fmt.Errorf("bronze medallist: %w", err)
	}
	return nil
}

// assertItemPlayerSets returns the item's player sets indexed by seed, that is
// by qualification rank, and checks each one is linked to exactly one player of
// this item.
func assertItemPlayerSets(db *gorm.DB, elimination database.Elimination, players []database.Player) ([]database.PlayerSet, error) {
	var sets []database.PlayerSet
	if err := db.Where("elimination_id = ?", elimination.ID).Order("`rank` ASC").Find(&sets).Error; err != nil {
		return nil, fmt.Errorf("find player sets: %w", err)
	}
	if len(sets) != len(players) {
		return nil, fmt.Errorf("elimination must have %d player sets, got %d", len(players), len(sets))
	}
	playersByID := make(map[uint]database.Player, len(players))
	for _, player := range players {
		playersByID[player.ID] = player
	}
	for index, set := range sets {
		expected := players[index]
		if set.Rank != index+1 || set.TotalScore != expected.TotalScore || set.SetName != expected.Name {
			return nil, fmt.Errorf("player set %d does not mirror the rank %d archer", set.ID, index+1)
		}
		var links []database.PlayerSetMatchTable
		if err := db.Where("player_set_id = ?", set.ID).Find(&links).Error; err != nil {
			return nil, fmt.Errorf("find players of player set %d: %w", set.ID, err)
		}
		if len(links) != 1 {
			return nil, fmt.Errorf("player set %d must contain one archer, got %d", set.ID, len(links))
		}
		if _, found := playersByID[links[0].PlayerId]; !found {
			return nil, fmt.Errorf("player set %d contains player %d of another item", set.ID, links[0].PlayerId)
		}
		if links[0].PlayerId != expected.ID {
			return nil, fmt.Errorf("player set %d must contain player %d, got %d", set.ID, expected.ID, links[0].PlayerId)
		}
	}
	return sets, nil
}

// assertFinishedMatch checks one match: its two results, its single winner, and
// that points, ends and arrows all agree. Every end keeps its scores while
// staying unconfirmed, matching what createFinishedMatch writes.
func assertFinishedMatch(db *gorm.DB, matchID uint, first, second database.PlayerSet, winnerIndex int) error {
	var results []database.MatchResult
	if err := db.Where("match_id = ?", matchID).Order("id ASC").Find(&results).Error; err != nil {
		return fmt.Errorf("find match results: %w", err)
	}
	if len(results) != 2 {
		return fmt.Errorf("match must have exactly two results, got %d", len(results))
	}
	expectedSets := []database.PlayerSet{first, second}
	winnerCount := 0
	for index, result := range results {
		if result.PlayerSetId == nil || *result.PlayerSetId != expectedSets[index].ID {
			return fmt.Errorf("result %d must score player set %d, got %d", index+1, expectedSets[index].ID, result.PlayerSetId)
		}
		if result.LaneNumber != index+1 {
			return fmt.Errorf("result %d must shoot lane %d, got %d", index+1, index+1, result.LaneNumber)
		}
		winner := index == winnerIndex
		if result.IsWinner != winner {
			return fmt.Errorf("result %d winner flag must be %t", index+1, winner)
		}
		if winner {
			winnerCount++
		}
		expectedPoints, expectedWonEnds := 4, 2
		if winner {
			expectedPoints, expectedWonEnds = 6, 3
		}
		if result.TotalPoints != expectedPoints {
			return fmt.Errorf("result %d must hold %d set points, got %d", index+1, expectedPoints, result.TotalPoints)
		}
		var ends []database.MatchEnd
		if err := db.Where("match_result_id = ?", result.ID).Order("id ASC").Find(&ends).Error; err != nil {
			return fmt.Errorf("find match ends: %w", err)
		}
		if len(ends) != finishedMatchEnd {
			return fmt.Errorf("result %d must have %d ends, got %d", index+1, finishedMatchEnd, len(ends))
		}
		wonEnds := 0
		for _, end := range ends {
			if end.IsConfirmed {
				return fmt.Errorf("end %d must stay unconfirmed", end.ID)
			}
			if end.TotalScore != 30 && end.TotalScore != 24 {
				return fmt.Errorf("end %d has unexpected total %d", end.ID, end.TotalScore)
			}
			if end.TotalScore == 30 {
				wonEnds++
			}
			var scores []database.MatchScore
			if err := db.Where("match_end_id = ?", end.ID).Order("id ASC").Find(&scores).Error; err != nil {
				return fmt.Errorf("find match scores: %w", err)
			}
			if len(scores) != arrowsPerMatchEnd {
				return fmt.Errorf("end %d must have %d arrows, got %d", end.ID, arrowsPerMatchEnd, len(scores))
			}
			arrowTotal := 0
			for _, score := range scores {
				arrowTotal += score.Score
			}
			if arrowTotal != end.TotalScore {
				return fmt.Errorf("end %d total %d does not match its arrows %d", end.ID, end.TotalScore, arrowTotal)
			}
		}
		if wonEnds != expectedWonEnds {
			return fmt.Errorf("result %d must win %d ends, got %d", index+1, expectedWonEnds, wonEnds)
		}
	}
	if winnerCount != 1 {
		return fmt.Errorf("match must have exactly one winner, got %d", winnerCount)
	}
	return nil
}

func assertMatchWinnerIs(db *gorm.DB, matchID, expectedPlayerSetID uint) error {
	var result database.MatchResult
	if err := db.Where("match_id = ? AND is_winner = ?", matchID, true).First(&result).Error; err != nil {
		return fmt.Errorf("find winner of match %d: %w", matchID, err)
	}
	if result.PlayerSetId == nil || *result.PlayerSetId != expectedPlayerSetID {
		return fmt.Errorf("expected player set %d to win match %d, got %d", expectedPlayerSetID, matchID, result.PlayerSetId)
	}
	return nil
}

func assertMatchLoserIs(db *gorm.DB, matchID, expectedPlayerSetID uint) error {
	var result database.MatchResult
	if err := db.Where("match_id = ? AND player_set_id = ?", matchID, expectedPlayerSetID).First(&result).Error; err != nil {
		return fmt.Errorf("find player set %d in match %d: %w", expectedPlayerSetID, matchID, err)
	}
	if result.IsWinner {
		return fmt.Errorf("player set %d unexpectedly won match %d", expectedPlayerSetID, matchID)
	}
	return nil
}
