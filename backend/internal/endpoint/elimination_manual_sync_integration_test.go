package endpoint

import (
	"backend/internal/database"
	"fmt"
	"net/http"
)

func (suite *EliminationBracketIntegrationTestSuite) TestManualSyncRejectsInvalidDraftAndUnauthorizedUsersWithoutChanges() {
	for _, ranks := range [][]int{{0, 1, 2, 3}, {-1, 1, 2, 3}, {1, 1, 2, 3}, {1, 2, 3, 5}, {1, 2, 3, 4, 5}} {
		elimination, _, admin, player := suite.createFixture(1, 0, nil)
		recorder, _ := suite.postBracket(elimination.ID, admin)
		suite.Require().Equal(http.StatusOK, recorder.Code)
		for _, rank := range ranks {
			_, err := database.CreatePlayerSet(database.PlayerSet{EliminationId: elimination.ID, Rank: rank})
			suite.Require().NoError(err)
		}
		before := suite.loadBracket(elimination.ID)
		for _, cookies := range [][]*http.Cookie{nil, player} {
			recorder, _ = suite.postFirstRoundSync(elimination.ID, cookies)
			suite.Equal(http.StatusForbidden, recorder.Code)
		}
		recorder, _ = suite.postFirstRoundSync(elimination.ID, admin)
		suite.Equal(http.StatusConflict, recorder.Code, fmt.Sprint(ranks))
		suite.Equal(before, suite.loadBracket(elimination.ID))
	}
}

func (suite *EliminationBracketIntegrationTestSuite) TestManualSyncProtectsBothSidesAndRollsBackAllMatches() {
	for _, protection := range []string{"arrow", "confirmed", "winner", "downstream"} {
		elimination, teams, admin, _ := suite.createFixture(1, 4, nil)
		recorder, _ := suite.postSeededBracket(elimination.ID, admin)
		suite.Require().Equal(http.StatusOK, recorder.Code)
		bracket := suite.loadBracket(elimination.ID)
		// Swap seeds 1 and 3. Seed 4 is unchanged, but its score protects the entire match.
		opposite := bracket.Stages[0].Matchs[0].MatchResults[1]
		switch protection {
		case "arrow":
			suite.Require().NoError(database.DB.Model(&database.MatchScore{}).Where("id = ?", opposite.MatchEnds[0].MatchScores[0].ID).Update("score", 0).Error)
		case "confirmed":
			suite.Require().NoError(database.DB.Model(&database.MatchEnd{}).Where("id = ?", opposite.MatchEnds[0].ID).Update("is_confirmed", true).Error)
		case "winner":
			suite.Require().NoError(database.DB.Model(&database.MatchResult{}).Where("id = ?", opposite.ID).Update("is_winner", true).Error)
		case "downstream":
			suite.Require().NoError(database.DB.Model(&database.MatchResult{}).Where("id = ?", bracket.Stages[1].Matchs[1].MatchResults[0].ID).Update("player_set_id", teams[0].ID).Error)
		}
		before := suite.loadBracket(elimination.ID)
		// A no-op sync is safe even when play has begun.
		recorder, response := suite.postFirstRoundSync(elimination.ID, admin)
		suite.Equal(http.StatusOK, recorder.Code)
		suite.False(response.Changed)
		suite.Require().NoError(database.DB.Model(&database.PlayerSet{}).Where("id = ?", teams[0].ID).Update("rank", 3).Error)
		suite.Require().NoError(database.DB.Model(&database.PlayerSet{}).Where("id = ?", teams[2].ID).Update("rank", 1).Error)
		recorder, _ = suite.postFirstRoundSync(elimination.ID, admin)
		suite.Equal(http.StatusConflict, recorder.Code, protection)
		suite.Equal(before, suite.loadBracket(elimination.ID), protection)
	}
}

func (suite *EliminationBracketIntegrationTestSuite) TestManualSyncAllowsUnrelatedDownstreamOccupancyAndPreservesPlacement() {
	elimination, teams, admin, _ := suite.createFixture(1, 4, nil)
	recorder, _ := suite.postSeededBracket(elimination.ID, admin)
	suite.Require().Equal(http.StatusOK, recorder.Code)
	bracket := suite.loadBracket(elimination.ID)
	first := bracket.Stages[0].Matchs[0]
	suite.Require().NoError(database.DB.Model(&database.MatchResult{}).Where("id = ?", first.MatchResults[0].ID).Updates(map[string]any{"lane_number": 7, "target": "A"}).Error)
	// The other semifinal's output occupies the opposite final slot only.
	otherFinal := bracket.Stages[1].Matchs[0].MatchResults[1]
	suite.Require().NoError(database.DB.Model(&database.MatchResult{}).Where("id = ?", otherFinal.ID).Update("player_set_id", teams[2].ID).Error)
	suite.Require().NoError(database.DB.Model(&database.PlayerSet{}).Where("id = ?", teams[0].ID).Update("rank", 4).Error)
	suite.Require().NoError(database.DB.Model(&database.PlayerSet{}).Where("id = ?", teams[3].ID).Update("rank", 1).Error)
	recorder, response := suite.postFirstRoundSync(elimination.ID, admin)
	suite.Require().Equal(http.StatusOK, recorder.Code, recorder.Body.String())
	suite.True(response.Changed)
	after := suite.loadBracket(elimination.ID)
	suite.Equal(teams[3].ID, *after.Stages[0].Matchs[0].MatchResults[0].PlayerSetId)
	suite.Equal(7, after.Stages[0].Matchs[0].MatchResults[0].LaneNumber)
	suite.Equal("A", *after.Stages[0].Matchs[0].MatchResults[0].Target)
	suite.Equal(teams[2].ID, *after.Stages[1].Matchs[0].MatchResults[1].PlayerSetId)
	suite.Equal(bracket.CurrentStage, after.CurrentStage)
}

func (suite *EliminationBracketIntegrationTestSuite) TestScoreAndConfirmationUseExistingSlotsDespiteInvalidDraftRanks() {
	elimination, teams, admin, _ := suite.createFixture(1, 4, nil)
	recorder, _ := suite.postSeededBracket(elimination.ID, admin)
	suite.Require().Equal(http.StatusOK, recorder.Code)
	before := suite.loadBracket(elimination.ID)
	suite.Require().NoError(database.DB.Model(&database.PlayerSet{}).Where("id = ?", teams[0].ID).Update("rank", 0).Error)
	matchEnd := before.Stages[0].Matchs[0].MatchResults[0].MatchEnds[0]
	recorder = suite.putMatchEndScores(*matchEnd, []int{10, 9, 8}, 27, admin)
	suite.Require().Equal(http.StatusOK, recorder.Code, recorder.Body.String())
	recorder = suite.requestJSON(http.MethodPatch, fmt.Sprintf("/matchresult/matchend/isconfirmed/%d", matchEnd.ID), map[string]bool{"is_confirmed": true}, admin)
	suite.Require().Equal(http.StatusOK, recorder.Code, recorder.Body.String())
	after := suite.loadBracket(elimination.ID)
	for i, match := range before.Stages[0].Matchs {
		for j, result := range match.MatchResults {
			suite.Equal(result.PlayerSetId, after.Stages[0].Matchs[i].MatchResults[j].PlayerSetId)
		}
	}
	suite.True(after.Stages[0].Matchs[0].MatchResults[0].MatchEnds[0].IsConfirmed)
}

func (suite *EliminationBracketIntegrationTestSuite) TestLegacyRosterLockColumnIsIgnoredAndMedalReferencesPreventDeletion() {
	elimination, teams, admin, _ := suite.createFixture(1, 4, nil)
	recorder, _ := suite.postBracket(elimination.ID, admin)
	suite.Require().Equal(http.StatusOK, recorder.Code)
	suite.Require().NoError(database.DB.Exec("ALTER TABLE eliminations ADD COLUMN bracket_roster_locked BOOLEAN DEFAULT FALSE").Error)
	suite.Require().NoError(database.DB.Exec("UPDATE eliminations SET bracket_roster_locked = TRUE WHERE id = ?", elimination.ID).Error)
	recorder, _ = suite.postFirstRoundSync(elimination.ID, admin)
	suite.Require().Equal(http.StatusOK, recorder.Code, recorder.Body.String())
	// An unassigned team may be removed, unless a medal still references it.
	extra, err := database.CreatePlayerSet(database.PlayerSet{EliminationId: elimination.ID, Rank: 0})
	suite.Require().NoError(err)
	suite.Require().NoError(database.DB.Model(&database.Medal{}).Where("elimination_id = ? AND type = 0", elimination.ID).Update("player_set_id", extra.ID).Error)
	recorder = suite.request(http.MethodDelete, fmt.Sprintf("/playerset/%d", extra.ID), admin)
	suite.Equal(http.StatusConflict, recorder.Code)
	suite.True(database.GetPlayerSetIsExist(extra.ID))
	suite.Require().NoError(database.DB.Model(&database.Medal{}).Where("elimination_id = ?", elimination.ID).Update("player_set_id", 0).Error)
	recorder = suite.request(http.MethodDelete, fmt.Sprintf("/playerset/%d", extra.ID), admin)
	suite.Equal(http.StatusOK, recorder.Code)
	suite.True(database.GetPlayerSetIsExist(teams[0].ID))
}
