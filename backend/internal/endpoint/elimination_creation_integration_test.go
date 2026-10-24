//go:build integration

package endpoint

import (
	"backend/internal/database"
	"bytes"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"net/http/httptest"
	"os"
	"sync"
	"sync/atomic"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/suite"
	"gorm.io/gorm"
)

type EliminationCreationIntegrationTestSuite struct {
	suite.Suite
	router *gin.Engine
}

func TestEliminationCreationIntegrationTestSuite(t *testing.T) {
	if os.Getenv("ARCHERY_MYSQL_INTEGRATION") != "1" {
		t.Fatal("integration tests require scripts/test.sh go-integration")
	}
	suite.Run(t, new(EliminationCreationIntegrationTestSuite))
}

func (suite *EliminationCreationIntegrationTestSuite) SetupTest() {
	suite.Require().NoError(database.ResetTestDatabase("empty"))
	gin.SetMode(gin.TestMode)
	suite.router = gin.New()
	suite.router.POST("/groupinfo", PostGroupInfo)
	suite.router.POST("/elimination", PostElimination)
	suite.router.PATCH("/competition/elimination-isactive/:id", PutCompetitionEliminationActive)
	suite.router.PATCH("/competition/team-elimination-isactive/:id", PutCompetitionTeamEliminationActive)
	suite.router.PATCH("/competition/mixed-elimination-isactive/:id", PutCompetitionMixedEliminationActive)
}

func (suite *EliminationCreationIntegrationTestSuite) request(method, path string, body any) *httptest.ResponseRecorder {
	encoded, err := json.Marshal(body)
	suite.Require().NoError(err)
	request := httptest.NewRequest(method, path, bytes.NewReader(encoded))
	request.Header.Set("Content-Type", "application/json")
	recorder := httptest.NewRecorder()
	suite.router.ServeHTTP(recorder, request)
	return recorder
}

func (suite *EliminationCreationIntegrationTestSuite) fixture() database.Competition {
	competition := database.Competition{Title: "elimination creation", StartTime: time.Now(), EndTime: time.Now().Add(time.Hour)}
	suite.Require().NoError(database.DB.Create(&competition).Error)
	unassigned := database.Group{CompetitionId: competition.ID, GroupName: "unassigned", GroupIndex: -1}
	suite.Require().NoError(database.DB.Create(&unassigned).Error)
	suite.Require().NoError(database.DB.Create(&database.Qualification{ID: unassigned.ID}).Error)
	competition.UnassignedGroupId = unassigned.ID
	suite.Require().NoError(database.DB.Model(&competition).Update("unassigned_group_id", unassigned.ID).Error)
	return competition
}

func (suite *EliminationCreationIntegrationTestSuite) postGroup(competitionID uint) database.Group {
	recorder := suite.request(http.MethodPost, "/groupinfo", database.Group{CompetitionId: competitionID, GroupName: "formal", BowType: "Recurve"})
	suite.Require().Equal(http.StatusOK, recorder.Code, recorder.Body.String())
	var group database.Group
	suite.Require().NoError(json.Unmarshal(recorder.Body.Bytes(), &group))
	suite.Require().NotZero(group.ID)
	return group
}

func (suite *EliminationCreationIntegrationTestSuite) activate(competitionID uint, teamSize int) *httptest.ResponseRecorder {
	kind := ""
	switch teamSize {
	case 2:
		kind = "mixed-"
	case 3:
		kind = "team-"
	}
	return suite.request(http.MethodPatch, fmt.Sprintf("/competition/%selimination-isactive/%d", kind, competitionID), nil)
}

func (suite *EliminationCreationIntegrationTestSuite) assertGroupFormats(groupID uint, team, mixed bool) {
	var eliminations []database.Elimination
	suite.Require().NoError(database.DB.Preload("Medals").Where("group_id = ?", groupID).Order("team_size").Find(&eliminations).Error)
	expected := []int{1}
	if mixed {
		expected = append(expected, 2)
	}
	if team {
		expected = append(expected, 3)
	}
	actual := make([]int, len(eliminations))
	for index, elimination := range eliminations {
		actual[index] = elimination.TeamSize
		types := make([]int, len(elimination.Medals))
		for index, medal := range elimination.Medals {
			types[index] = medal.Type
		}
		suite.ElementsMatch([]int{0, 1, 2}, types)
		var stageCount int64
		suite.Require().NoError(database.DB.Model(&database.Stage{}).Where("elimination_id = ?", elimination.ID).Count(&stageCount).Error)
		suite.Zero(stageCount, "creation must leave bracket generation to the existing flow")
	}
	suite.Equal(expected, actual)
	var qualification database.Qualification
	suite.Require().NoError(database.DB.First(&qualification, groupID).Error)
	suite.Equal(groupID, qualification.ID)
}

func (suite *EliminationCreationIntegrationTestSuite) assertNoUnassignedElimination(competition database.Competition) {
	var count int64
	suite.Require().NoError(database.DB.Model(&database.Elimination{}).Where("group_id = ?", competition.UnassignedGroupId).Count(&count).Error)
	suite.Zero(count)
}

func (suite *EliminationCreationIntegrationTestSuite) counts() []int64 {
	counts := make([]int64, 5)
	for index, model := range []any{&database.Group{}, &database.Qualification{}, &database.Elimination{}, &database.Medal{}, &database.Stage{}} {
		suite.Require().NoError(database.DB.Model(model).Count(&counts[index]).Error)
	}
	return counts
}

func (suite *EliminationCreationIntegrationTestSuite) reloadCompetition(id uint) database.Competition {
	var competition database.Competition
	suite.Require().NoError(database.DB.Unscoped().First(&competition, id).Error)
	return competition
}

func (suite *EliminationCreationIntegrationTestSuite) TestCreationOrderAndEveryFlagCombination() {
	// Deliberately advance only the qualification sequence. New qualifications
	// must use group IDs explicitly, rather than matching independent sequences.
	suite.Require().NoError(database.DB.Create(&database.Qualification{ID: 90000}).Error)
	for _, activateFirst := range []bool{true, false} {
		for _, team := range []bool{false, true} {
			for _, mixed := range []bool{false, true} {
				competition := suite.fixture()
				enable := func() {
					for _, format := range []struct {
						enabled bool
						size    int
					}{{team, 3}, {mixed, 2}} {
						if format.enabled {
							recorder := suite.activate(competition.ID, format.size)
							suite.Require().Equal(http.StatusOK, recorder.Code, recorder.Body.String())
						}
					}
				}
				if activateFirst {
					enable()
				}
				group := suite.postGroup(competition.ID)
				if !activateFirst {
					enable()
				}
				suite.assertGroupFormats(group.ID, team, mixed)
				suite.assertNoUnassignedElimination(competition)
				suite.Equal(1, suite.reloadCompetition(competition.ID).GroupsNum)
				for _, size := range []int{2, 3} {
					if (size == 2 && mixed) || (size == 3 && team) {
						recorder := suite.activate(competition.ID, size)
						suite.Equal(http.StatusNoContent, recorder.Code, recorder.Body.String())
					}
				}
			}
		}
	}
}

func (suite *EliminationCreationIntegrationTestSuite) loadElimination(id uint) database.Elimination {
	var elimination database.Elimination
	suite.Require().NoError(database.DB.Preload("PlayerSets").Preload("Medals").Preload("Stages.Matchs.MatchResults.MatchEnds.MatchScores").First(&elimination, id).Error)
	return elimination
}

// Group creation normally creates individual Eliminations; remove only those
// empty rows to simulate legacy missing data before building repair fixtures.
func (suite *EliminationCreationIntegrationTestSuite) removeIndividualEliminations(groups ...database.Group) {
	for _, group := range groups {
		var ids []uint
		suite.Require().NoError(database.DB.Model(&database.Elimination{}).Where("group_id = ? AND team_size = 1", group.ID).Pluck("id", &ids).Error)
		suite.Require().NoError(database.DB.Where("elimination_id IN ?", ids).Delete(&database.Medal{}).Error)
		suite.Require().NoError(database.DB.Where("id IN ?", ids).Delete(&database.Elimination{}).Error)
	}
}

func (suite *EliminationCreationIntegrationTestSuite) TestRepairPreservesExistingBracketScoresAndMedalOwnership() {
	for _, size := range []int{1, 2, 3} {
		competition := suite.fixture()
		group := suite.postGroup(competition.ID)
		otherGroup := suite.postGroup(competition.ID)
		flag := "team_elimination_is_active"
		switch size {
		case 1:
			flag = "elimination_is_active"
			suite.removeIndividualEliminations(group, otherGroup)
		case 2:
			flag = "mixed_elimination_is_active"
		}
		suite.Require().NoError(database.DB.Model(&competition).Update(flag, true).Error)
		elimination := database.Elimination{GroupId: group.ID, TeamSize: size, CurrentStage: 7, CurrentEnd: 9, BracketSeedCount: 16}
		suite.Require().NoError(database.DB.Create(&elimination).Error)
		playerSet := database.PlayerSet{EliminationId: elimination.ID, SetName: "keep team", Rank: 2, TotalScore: 27}
		suite.Require().NoError(database.DB.Create(&playerSet).Error)
		stage := database.Stage{EliminationId: elimination.ID}
		suite.Require().NoError(database.DB.Create(&stage).Error)
		match := database.Match{StageId: stage.ID}
		suite.Require().NoError(database.DB.Create(&match).Error)
		result := database.MatchResult{MatchId: match.ID, PlayerSetId: &playerSet.ID, IsWinner: true, ShootOffScore: 10, LaneNumber: 4}
		suite.Require().NoError(database.DB.Create(&result).Error)
		end := database.MatchEnd{MatchResultId: result.ID, TotalScore: 27, IsConfirmed: true}
		suite.Require().NoError(database.DB.Create(&end).Error)
		suite.Require().NoError(database.DB.Create(&database.MatchScore{MatchEndId: end.ID, Score: 9}).Error)
		medal := database.Medal{EliminationId: elimination.ID, Type: 0, PlayerSetId: playerSet.ID}
		suite.Require().NoError(database.DB.Create(&medal).Error)
		before := suite.loadElimination(elimination.ID)
		recorder := suite.activate(competition.ID, size)
		suite.Require().Equal(http.StatusOK, recorder.Code, recorder.Body.String())
		after := suite.loadElimination(elimination.ID)
		suite.Require().Len(after.Medals, 3)
		var keptMedal database.Medal
		suite.Require().NoError(database.DB.First(&keptMedal, medal.ID).Error)
		suite.Equal(medal, keptMedal)
		before.Medals, after.Medals = nil, nil
		suite.Equal(before, after, "repair must not overwrite existing bracket or scores")
		suite.assertGroupFormats(otherGroup.ID, size == 3, size == 2)
		counts := suite.counts()
		recorder = suite.activate(competition.ID, size)
		suite.Equal(http.StatusNoContent, recorder.Code, recorder.Body.String())
		recorder = suite.request(http.MethodPost, "/elimination", database.Elimination{GroupId: group.ID, TeamSize: size})
		suite.Require().Equal(http.StatusOK, recorder.Code, recorder.Body.String())
		var response database.Elimination
		suite.Require().NoError(json.Unmarshal(recorder.Body.Bytes(), &response))
		suite.Equal(elimination.ID, response.ID)
		suite.Equal(counts, suite.counts())
		after = suite.loadElimination(elimination.ID)
		after.Medals = nil
		suite.Equal(before, after)
		suite.assertNoUnassignedElimination(competition)
	}
}

func (suite *EliminationCreationIntegrationTestSuite) TestDirectPostRepairsMissingMedalsAndIsIdempotent() {
	competition := suite.fixture()
	group := suite.postGroup(competition.ID)
	for _, size := range []int{1, 2, 3} {
		body := database.Elimination{GroupId: group.ID, TeamSize: size}
		recorder := suite.request(http.MethodPost, "/elimination", body)
		suite.Require().Equal(http.StatusOK, recorder.Code, recorder.Body.String())
		var first database.Elimination
		suite.Require().NoError(json.Unmarshal(recorder.Body.Bytes(), &first))
		suite.Require().NoError(database.DB.Where("elimination_id = ? AND type = 1", first.ID).Delete(&database.Medal{}).Error)
		recorder = suite.request(http.MethodPost, "/elimination", body)
		suite.Require().Equal(http.StatusOK, recorder.Code, recorder.Body.String())
		var repaired database.Elimination
		suite.Require().NoError(json.Unmarshal(recorder.Body.Bytes(), &repaired))
		suite.Equal(first.ID, repaired.ID)
		counts := suite.counts()
		recorder = suite.request(http.MethodPost, "/elimination", body)
		suite.Equal(http.StatusOK, recorder.Code, recorder.Body.String())
		suite.Equal(counts, suite.counts())
	}
	suite.assertGroupFormats(group.ID, true, true)
}

func (suite *EliminationCreationIntegrationTestSuite) TestDuplicateRowsConflictWithoutPartialRepairs() {
	for _, size := range []int{1, 3} {
		for _, duplicateMedal := range []bool{false, true} {
			competition := suite.fixture()
			repairGroup := suite.postGroup(competition.ID)
			group := suite.postGroup(competition.ID)
			if size == 1 {
				suite.removeIndividualEliminations(repairGroup, group)
			}
			elimination := database.Elimination{GroupId: group.ID, TeamSize: size}
			suite.Require().NoError(database.DB.Create(&elimination).Error)
			if duplicateMedal {
				for index := 0; index < 2; index++ {
					suite.Require().NoError(database.DB.Create(&database.Medal{EliminationId: elimination.ID, Type: 2}).Error)
				}
			} else {
				suite.Require().NoError(database.DB.Create(&database.Elimination{GroupId: group.ID, TeamSize: size}).Error)
			}
			before := suite.counts()
			beforeCompetition := suite.reloadCompetition(competition.ID)
			// The lower-index group is repaired before the later group's conflict.
			// Observe successful writes to prove the 409 actually rolls them back.
			var repairedMedals atomic.Int32
			name := "test:observe-conflict-repair"
			suite.Require().NoError(database.DB.Callback().Create().After("gorm:create").Register(name, func(tx *gorm.DB) {
				if tx.Statement.Table == "medals" && tx.Error == nil {
					repairedMedals.Add(1)
				}
			}))
			var once sync.Once
			remove := func() { once.Do(func() { suite.Require().NoError(database.DB.Callback().Create().Remove(name)) }) }
			suite.T().Cleanup(remove)
			recorder := suite.activate(competition.ID, size)
			remove()
			suite.Equal(http.StatusConflict, recorder.Code, recorder.Body.String())
			suite.Equal(int32(3), repairedMedals.Load())
			suite.Equal(before, suite.counts())
			suite.Equal(beforeCompetition, suite.reloadCompetition(competition.ID))
			if size != 1 {
				suite.assertGroupFormats(repairGroup.ID, false, false)
			}
			recorder = suite.request(http.MethodPost, "/elimination", database.Elimination{GroupId: group.ID, TeamSize: size})
			suite.Equal(http.StatusConflict, recorder.Code, recorder.Body.String())
			suite.Equal(before, suite.counts())
		}
	}
}

// Fail after earlier inserts have succeeded, without changing schema or using
// malformed fixtures that would bypass the handler's normal transaction path.
func (suite *EliminationCreationIntegrationTestSuite) failMedalInsertAt(at int32) func() {
	name := "test:elimination-creation-failure"
	var inserts atomic.Int32
	suite.Require().NoError(database.DB.Callback().Create().Before("gorm:create").Register(name, func(tx *gorm.DB) {
		if tx.Statement.Table == "medals" && inserts.Add(1) == at {
			tx.AddError(errors.New("injected medal creation failure"))
		}
	}))
	var once sync.Once
	remove := func() { once.Do(func() { suite.Require().NoError(database.DB.Callback().Create().Remove(name)) }) }
	suite.T().Cleanup(remove)
	return remove
}

func (suite *EliminationCreationIntegrationTestSuite) TestGroupCreationFailureRollsBackEveryNewRowAndCount() {
	competition := suite.fixture()
	suite.Require().NoError(database.DB.Model(&competition).Updates(map[string]any{"team_elimination_is_active": true, "mixed_elimination_is_active": true}).Error)
	before := suite.counts()
	beforeCompetition := suite.reloadCompetition(competition.ID)
	remove := suite.failMedalInsertAt(5)
	recorder := suite.request(http.MethodPost, "/groupinfo", database.Group{CompetitionId: competition.ID, GroupName: "rollback"})
	remove()
	suite.Equal(http.StatusInternalServerError, recorder.Code, recorder.Body.String())
	suite.Equal(before, suite.counts())
	suite.Equal(beforeCompetition, suite.reloadCompetition(competition.ID))
	group := suite.postGroup(competition.ID)
	suite.assertGroupFormats(group.ID, true, true)
	suite.Equal(1, suite.reloadCompetition(competition.ID).GroupsNum)
}

func (suite *EliminationCreationIntegrationTestSuite) TestActivationFailureRollsBackAllGroupsAndFlag() {
	for _, size := range []int{1, 2, 3} {
		competition := suite.fixture()
		group := suite.postGroup(competition.ID)
		otherGroup := suite.postGroup(competition.ID)
		if size == 1 {
			suite.removeIndividualEliminations(group, otherGroup)
		}
		before := suite.counts()
		beforeCompetition := suite.reloadCompetition(competition.ID)
		remove := suite.failMedalInsertAt(4)
		recorder := suite.activate(competition.ID, size)
		remove()
		suite.Equal(http.StatusInternalServerError, recorder.Code, recorder.Body.String())
		suite.Equal(before, suite.counts())
		suite.Equal(beforeCompetition, suite.reloadCompetition(competition.ID))
		recorder = suite.activate(competition.ID, size)
		suite.Require().Equal(http.StatusOK, recorder.Code, recorder.Body.String())
		suite.assertGroupFormats(group.ID, size == 3, size == 2)
		suite.assertGroupFormats(otherGroup.ID, size == 3, size == 2)
		if size == 1 {
			suite.True(suite.reloadCompetition(competition.ID).EliminationIsActive)
			var body map[string]string
			suite.Require().NoError(json.Unmarshal(recorder.Body.Bytes(), &body))
			suite.Equal("Update Competition Elimination Active Success", body["message"])
		}
	}
}

func (suite *EliminationCreationIntegrationTestSuite) TestInvalidTargetsAndTeamSizesLeaveDatabaseUnchanged() {
	competition := suite.fixture()
	group := suite.postGroup(competition.ID)
	deleted := suite.fixture()
	deletedGroup := suite.postGroup(deleted.ID)
	suite.Require().NoError(database.DB.Delete(&deleted).Error)
	before := suite.counts()
	for _, id := range []uint{0, 999999, deleted.ID} {
		for _, size := range []int{1, 2, 3} {
			recorder := suite.activate(id, size)
			suite.Equal(http.StatusBadRequest, recorder.Code, recorder.Body.String())
		}
		recorder := suite.request(http.MethodPost, "/groupinfo", database.Group{CompetitionId: id, GroupName: "invalid"})
		suite.Equal(http.StatusBadRequest, recorder.Code, recorder.Body.String())
	}
	for _, id := range []uint{0, 999999, deletedGroup.ID, competition.UnassignedGroupId} {
		recorder := suite.request(http.MethodPost, "/elimination", database.Elimination{GroupId: id, TeamSize: 3})
		suite.Equal(http.StatusBadRequest, recorder.Code, recorder.Body.String())
	}
	for _, size := range []int{-1, 0, 4} {
		recorder := suite.request(http.MethodPost, "/elimination", database.Elimination{GroupId: group.ID, TeamSize: size})
		suite.Equal(http.StatusBadRequest, recorder.Code, recorder.Body.String())
	}
	suite.Equal(before, suite.counts())
}

func (suite *EliminationCreationIntegrationTestSuite) TestConcurrentActivationGroupCreationAndDirectPostShareParentLock() {
	for _, activationFirst := range []bool{true, false} {
		competition := suite.fixture()
		group := suite.postGroup(competition.ID)
		// All three requests must attempt a transactional parent row lock while
		// the first holds it. Channels make the overlap deterministic; no sleeps.
		attempts := make(chan bool, 3)
		acquired := make(chan struct{})
		release := make(chan struct{})
		var first sync.Once
		var unlock sync.Once
		name := "test:elimination-creation-parent-lock"
		isParentLock := func(tx *gorm.DB) bool {
			_, locking := tx.Statement.Clauses["FOR"]
			return tx.Statement.Table == "competitions" && locking
		}
		suite.Require().NoError(database.DB.Callback().Query().Before("gorm:query").Register(name+":before", func(tx *gorm.DB) {
			if isParentLock(tx) {
				_, transaction := tx.Statement.ConnPool.(*sql.Tx)
				attempts <- transaction
			}
		}))
		suite.Require().NoError(database.DB.Callback().Query().After("gorm:query").Register(name+":after", func(tx *gorm.DB) {
			if isParentLock(tx) && tx.Error == nil {
				first.Do(func() {
					close(acquired)
					<-release
				})
			}
		}))
		remove := func() {
			unlock.Do(func() { close(release) })
			suite.Require().NoError(database.DB.Callback().Query().Remove(name + ":before"))
			suite.Require().NoError(database.DB.Callback().Query().Remove(name + ":after"))
		}
		// Cleanup also releases blocked goroutines if a timeout assertion fails.
		var cleanup sync.Once
		suite.T().Cleanup(func() { cleanup.Do(remove) })
		responses := make(chan *httptest.ResponseRecorder, 3)
		activation := func() { responses <- suite.activate(competition.ID, 3) }
		creation := func() {
			responses <- suite.request(http.MethodPost, "/groupinfo", database.Group{CompetitionId: competition.ID, GroupName: "concurrent"})
		}
		if activationFirst {
			go activation()
		} else {
			go creation()
		}
		select {
		case <-acquired:
		case <-time.After(10 * time.Second):
			suite.FailNow("first request did not acquire the Competition row lock")
		}
		if activationFirst {
			go creation()
		} else {
			go activation()
		}
		go func() {
			responses <- suite.request(http.MethodPost, "/elimination", database.Elimination{GroupId: group.ID, TeamSize: 3})
		}()
		for index := 0; index < 3; index++ {
			select {
			case transaction := <-attempts:
				suite.True(transaction, "parent lock must be held by a transaction")
			case <-time.After(10 * time.Second):
				suite.FailNow("concurrent request did not attempt the shared parent lock")
			}
		}
		unlock.Do(func() { close(release) })
		for index := 0; index < 3; index++ {
			select {
			case recorder := <-responses:
				suite.Equal(http.StatusOK, recorder.Code, recorder.Body.String())
			case <-time.After(10 * time.Second):
				suite.FailNow("concurrent request did not finish after parent lock release")
			}
		}
		cleanup.Do(remove)
		var groups []database.Group
		suite.Require().NoError(database.DB.Where("competition_id = ? AND id <> ?", competition.ID, competition.UnassignedGroupId).Find(&groups).Error)
		suite.Require().Len(groups, 2)
		for _, group := range groups {
			suite.assertGroupFormats(group.ID, true, false)
		}
		suite.Equal(2, suite.reloadCompetition(competition.ID).GroupsNum)
		suite.True(suite.reloadCompetition(competition.ID).TeamEliminationIsActive)
		suite.assertNoUnassignedElimination(competition)
	}
}

func (suite *EliminationCreationIntegrationTestSuite) TestIndividualActivationAllowsEmptyCompetition() {
	competition := suite.fixture()
	before := suite.counts()
	recorder := suite.activate(competition.ID, 1)
	suite.Require().Equal(http.StatusOK, recorder.Code, recorder.Body.String())
	suite.True(suite.reloadCompetition(competition.ID).EliminationIsActive)
	suite.Equal(before, suite.counts())
	recorder = suite.activate(competition.ID, 1)
	suite.Equal(http.StatusNoContent, recorder.Code, recorder.Body.String())
	suite.assertNoUnassignedElimination(competition)
}
