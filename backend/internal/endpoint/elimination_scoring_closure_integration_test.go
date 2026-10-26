//go:build integration

package endpoint

import (
	"backend/internal/database"
	"backend/internal/pkg"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"strings"
	"sync"
	"time"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

func (suite *EliminationBracketIntegrationTestSuite) scoringClosureFixture(teamSize int) (database.Elimination, *database.Match, []*http.Cookie, []*http.Cookie) {
	elimination, _, admin, playerCookies := suite.createFixture(teamSize, 4, nil)
	recorder, _ := suite.postSeededBracket(elimination.ID, admin)
	suite.Require().Equal(http.StatusOK, recorder.Code, recorder.Body.String())
	bracket := suite.loadBracket(elimination.ID)
	match := bracket.Stages[0].Matchs[0]
	group, err := database.GetGroupInfoById(elimination.GroupId)
	suite.Require().NoError(err)
	if teamSize == 3 {
		suite.Require().NoError(database.DB.Model(&database.Group{}).Where("id = ?", group.ID).Update("bow_type", "反曲弓").Error)
	}
	participants, err := database.GetParticipantByCompetitionIdUserId(group.CompetitionId, 81002)
	suite.Require().NoError(err)
	suite.Require().Len(participants, 1)
	qualification, err := database.PostQualification(database.Qualification{})
	suite.Require().NoError(err)
	lane, err := database.PostLane(database.Lane{CompetitionId: group.CompetitionId, QualificationId: qualification.ID, LaneNumber: 1})
	suite.Require().NoError(err)
	player, err := database.CreatePlayer(database.Player{GroupId: group.ID, LaneId: lane.ID, ParticipantId: participants[0].ID, Name: "closure player"})
	suite.Require().NoError(err)
	suite.Require().NoError(database.DB.Create(&database.PlayerSetMatchTable{PlayerSetId: *match.MatchResults[0].PlayerSetId, PlayerId: player.ID}).Error)
	suite.Require().NoError(database.DB.Model(&database.Competition{}).Where("id = ?", group.CompetitionId).Updates(map[string]any{"elimination_is_active": true, "team_elimination_is_active": true, "mixed_elimination_is_active": true}).Error)
	suite.router.GET("/elimination/:id", GetOnlyEliminationById)
	return elimination, match, admin, playerCookies
}

func closureScores(end *database.MatchEnd, score int) []int {
	scores := make([]int, len(end.MatchScores))
	for index := range scores {
		scores[index] = score
	}
	return scores
}

func (suite *EliminationBracketIntegrationTestSuite) TestRecurveWinnerClosesAllPlayerScoreWritesAndKeepsDecidingEndConfirmable() {
	for _, teamSize := range []int{1, 2, 3} {
		suite.Run(fmt.Sprintf("team_size_%d", teamSize), func() {
			suite.SetupTest()
			elimination, match, admin, player := suite.scoringClosureFixture(teamSize)
			for wave := 0; wave < 3; wave++ {
				for side, result := range match.MatchResults {
					end := result.MatchEnds[wave]
					score := 10 - side
					if teamSize != 1 && wave == 0 {
						score = 10
					}
					recorder := suite.putMatchEndScores(*end, closureScores(end, score), 0, player)
					suite.Require().Equal(http.StatusOK, recorder.Code, recorder.Body.String())
				}
			}
			stored := suite.loadBracket(elimination.ID)
			suite.True(stored.Stages[0].Matchs[0].MatchResults[0].IsWinner)
			wantPoints := 5
			if teamSize == 1 {
				wantPoints = 6
			}
			suite.Equal(wantPoints, stored.Stages[0].Matchs[0].MatchResults[0].TotalPoints)
			end := match.MatchResults[0].MatchEnds[2]
			nextEnd := match.MatchResults[0].MatchEnds[3]
			before := suite.loadBracket(elimination.ID)
			recorder := suite.putMatchEndScores(*end, closureScores(end, 8), 0, player)
			suite.Equal(http.StatusForbidden, recorder.Code, recorder.Body.String())
			recorder = suite.requestJSON(http.MethodPatch, fmt.Sprintf("/matchresult/matchscore/score/%d", end.MatchScores[0].ID), map[string]int{"score": 8}, player)
			suite.Equal(http.StatusForbidden, recorder.Code, recorder.Body.String())
			recorder = suite.requestJSON(http.MethodPatch, fmt.Sprintf("/matchresult/matchend/totalscore/%d", end.ID), map[string]int{"total_scores": 0}, player)
			suite.Equal(http.StatusForbidden, recorder.Code, recorder.Body.String())
			suite.Equal(before, suite.loadBracket(elimination.ID))
			recorder = suite.requestJSON(http.MethodPatch, fmt.Sprintf("/matchresult/matchend/isconfirmed/%d", nextEnd.ID), map[string]bool{"is_confirmed": true}, player)
			suite.Equal(http.StatusForbidden, recorder.Code, recorder.Body.String())
			recorder = suite.requestJSON(http.MethodPatch, fmt.Sprintf("/matchresult/matchend/isconfirmed/%d", end.ID), map[string]bool{"is_confirmed": true}, player)
			suite.Equal(http.StatusOK, recorder.Code, recorder.Body.String())
			beforeRead := suite.loadBracket(elimination.ID)
			progress := suite.request(http.MethodGet, fmt.Sprintf("/elimination/%d", elimination.ID), nil)
			suite.Equal(http.StatusOK, progress.Code, progress.Body.String())
			suite.Contains(progress.Body.String(), `"is_scoring_closed": true`)
			suite.Contains(progress.Body.String(), `"is_confirmed": true`)
			suite.Equal(beforeRead, suite.loadBracket(elimination.ID))
			// Clear the persisted decision explicitly after correcting the deciding end.
			recorder = suite.putMatchEndScores(*end, closureScores(end, -1), 0, admin)
			suite.Equal(http.StatusOK, recorder.Code, recorder.Body.String())
			recorder, _ = suite.putMatchWinner(match.ID, nil, admin)
			suite.Require().Equal(http.StatusOK, recorder.Code, recorder.Body.String())
			reopened := suite.loadBracket(elimination.ID)
			suite.False(reopened.Stages[0].Matchs[0].MatchResults[0].IsWinner)
			recorder = suite.requestJSON(http.MethodPatch, fmt.Sprintf("/matchresult/matchend/isconfirmed/%d", end.ID), map[string]bool{"is_confirmed": false}, admin)
			suite.Equal(http.StatusOK, recorder.Code, recorder.Body.String())
			recorder = suite.putMatchEndScores(*nextEnd, closureScores(nextEnd, 9), 0, player)
			suite.Equal(http.StatusOK, recorder.Code, recorder.Body.String())
		})
	}
}

func (suite *EliminationBracketIntegrationTestSuite) TestManualWinnerClosurePreservesJudgeAndAdminAndCompoundScoring() {
	elimination, match, admin, player := suite.scoringClosureFixture(1)
	group, err := database.GetGroupInfoById(elimination.GroupId)
	suite.Require().NoError(err)
	_, err = database.CreateParticipant(database.Participant{UserID: 81005, CompetitionID: group.CompetitionId, Role: pkg.RoleToString(pkg.RJudge), Status: "approved"})
	suite.Require().NoError(err)
	judge := suite.login(81005)
	winnerID := match.MatchResults[0].ID
	recorder, _ := suite.putMatchWinner(match.ID, &winnerID, admin)
	suite.Require().Equal(http.StatusOK, recorder.Code, recorder.Body.String())
	beforeRead := suite.loadBracket(elimination.ID)
	manualProgress := suite.request(http.MethodGet, fmt.Sprintf("/elimination/%d", elimination.ID), nil)
	suite.Equal(http.StatusOK, manualProgress.Code, manualProgress.Body.String())
	suite.Contains(manualProgress.Body.String(), `"is_scoring_closed": true`)
	suite.Equal(beforeRead, suite.loadBracket(elimination.ID))
	end := match.MatchResults[0].MatchEnds[0]
	recorder = suite.putMatchEndScores(*end, closureScores(end, 9), 0, player)
	suite.Equal(http.StatusForbidden, recorder.Code, recorder.Body.String())
	for _, cookies := range [][]*http.Cookie{judge, admin} {
		// A correction may clear the manual winner, so restore it before each assertion.
		suite.Require().NoError(database.DB.Model(&database.MatchResult{}).Where("id = ?", winnerID).Update("is_winner", true).Error)
		recorder = suite.putMatchEndScores(*end, closureScores(end, 9), 0, cookies)
		suite.Equal(http.StatusOK, recorder.Code, recorder.Body.String())
	}
	suite.Require().NoError(database.DB.Model(&database.Group{}).Where("id = ?", group.ID).Update("bow_type", "Compound").Error)
	suite.Require().NoError(database.DB.Model(&database.MatchResult{}).Where("id = ?", winnerID).Update("is_winner", true).Error)
	progress := suite.request(http.MethodGet, fmt.Sprintf("/elimination/%d", elimination.ID), nil)
	suite.Equal(http.StatusOK, progress.Code)
	suite.NotContains(progress.Body.String(), `"is_scoring_closed": true`)
	recorder = suite.putMatchEndScores(*end, closureScores(end, 10), 0, player)
	suite.Equal(http.StatusOK, recorder.Code, recorder.Body.String())
	suite.Require().NoError(database.DB.Model(&database.Elimination{}).Where("id = ?", elimination.ID).Update("current_stage", 1).Error)
	progress = suite.request(http.MethodGet, fmt.Sprintf("/elimination/%d", elimination.ID), nil)
	suite.Equal(http.StatusOK, progress.Code, progress.Body.String())
	var current database.Elimination
	suite.Require().NoError(json.Unmarshal(progress.Body.Bytes(), &current))
	suite.Equal(uint(1), current.CurrentStage)
	bracket := suite.loadBracket(elimination.ID)
	suite.Require().Len(current.ScoringStatus, len(bracket.Stages[1].Matchs))
	for index, status := range current.ScoringStatus {
		suite.Equal(bracket.Stages[1].Matchs[index].ID, status.MatchID)
	}
	suite.NotContains(progress.Body.String(), `"match_scores"`)
}

// A late request can open its snapshot while another transaction still holds
// the elimination lock. It must see that transaction's winner after waiting.
func (suite *EliminationBracketIntegrationTestSuite) TestLatePlayerScoreSeesWinnerCommittedWhileWaitingForEliminationLock() {
	elimination, match, _, player := suite.scoringClosureFixture(1)
	locked := make(chan struct{})
	release := make(chan struct{})
	winnerDone := make(chan error, 1)
	var once sync.Once
	unblock := func() { once.Do(func() { close(release) }) }
	defer unblock()
	go func() {
		winnerDone <- database.DB.Transaction(func(tx *gorm.DB) error {
			var lockedElimination database.Elimination
			if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&lockedElimination, elimination.ID).Error; err != nil {
				return err
			}
			close(locked)
			<-release
			return tx.Model(&database.MatchResult{}).Where("id = ?", match.MatchResults[0].ID).Update("is_winner", true).Error
		})
	}()
	select {
	case <-locked:
	case <-time.After(5 * time.Second):
		suite.FailNow("winner lock timed out")
	}
	snapshotOpened := make(chan struct{})
	callbackName := "closure_snapshot_opened"
	var snapshotOnce sync.Once
	suite.Require().NoError(database.DB.Callback().Query().After("gorm:query").Register(callbackName, func(tx *gorm.DB) {
		if tx.Statement.Table == "match_ends" && strings.Contains(tx.Statement.SQL.String(), "stages.elimination_id AS elimination_id") {
			snapshotOnce.Do(func() { close(snapshotOpened) })
		}
	}))
	defer func() { suite.NoError(database.DB.Callback().Query().Remove(callbackName)) }()
	end := match.MatchResults[0].MatchEnds[0]
	responseDone := make(chan *httptest.ResponseRecorder, 1)
	go func() { responseDone <- suite.putMatchEndScores(*end, closureScores(end, 9), 0, player) }()
	select {
	case <-snapshotOpened:
	case <-time.After(5 * time.Second):
		suite.FailNow("late request did not open its roster snapshot")
	}
	unblock()
	suite.Require().NoError(<-winnerDone)
	select {
	case recorder := <-responseDone:
		suite.Equal(http.StatusForbidden, recorder.Code, recorder.Body.String())
	case <-time.After(5 * time.Second):
		suite.FailNow("late request timed out")
	}
}
