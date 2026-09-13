//go:build integration

package endpoint

import (
	"backend/internal/database"
	"backend/internal/pkg"
	"fmt"
	"net/http"
	"time"
)

func (suite *EliminationBracketIntegrationTestSuite) judgeCookies(competitionID, userID uint, status string) []*http.Cookie {
	_, err := database.CreateParticipant(database.Participant{UserID: userID, CompetitionID: competitionID, Role: pkg.RoleToString(pkg.RJudge), Status: status})
	suite.Require().NoError(err)
	return suite.login(userID)
}

func (suite *EliminationBracketIntegrationTestSuite) TestPendingAndForeignJudgesCannotScoreElimination() {
	elimination, _, adminCookies, _ := suite.createFixture(1, 4, nil)
	recorder, _ := suite.postSeededBracket(elimination.ID, adminCookies)
	suite.Require().Equal(http.StatusOK, recorder.Code)
	group, err := database.GetGroupInfoById(elimination.GroupId)
	suite.Require().NoError(err)
	suite.Require().NoError(database.DB.Model(&database.Competition{}).Where("id = ?", group.CompetitionId).Update("elimination_is_active", true).Error)
	end := suite.loadBracket(elimination.ID).Stages[0].Matchs[0].MatchResults[0].MatchEnds[0]
	foreignCompetition, err := database.PostCompetition(database.Competition{Title: "foreign judge score", StartTime: time.Now(), EndTime: time.Now().Add(time.Hour)})
	suite.Require().NoError(err)
	pending := suite.judgeCookies(group.CompetitionId, 85001, "pending")
	foreign := suite.judgeCookies(foreignCompetition.ID, 85002, "approved")
	for _, cookies := range [][]*http.Cookie{pending, foreign} {
		before := suite.loadBracket(elimination.ID)
		recorder = suite.putMatchEndScores(*end, []int{10, 9, 8}, 0, cookies)
		suite.Equal(http.StatusForbidden, recorder.Code, recorder.Body.String())
		suite.Equal(before, suite.loadBracket(elimination.ID))
	}
}

func (suite *EliminationBracketIntegrationTestSuite) qualificationJudgeFixture() (database.RoundEnd, database.Round, database.Player, []*http.Cookie, []*http.Cookie, []*http.Cookie) {
	now := time.Now()
	competition, err := database.PostCompetition(database.Competition{Title: "judge qualification permissions", StartTime: now, EndTime: now.Add(time.Hour)})
	suite.Require().NoError(err)
	group, err := database.CreateGroupInfo(database.Group{CompetitionId: competition.ID, GroupName: "qualification", GroupIndex: 1})
	suite.Require().NoError(err)
	suite.Require().NoError(database.DB.Create(&database.Qualification{ID: group.ID}).Error)
	lane, err := database.PostLane(database.Lane{CompetitionId: competition.ID, QualificationId: group.ID, LaneNumber: 1})
	suite.Require().NoError(err)
	playerParticipant, err := database.CreateParticipant(database.Participant{UserID: 85201, CompetitionID: competition.ID, Role: pkg.RoleToString(pkg.RPlayer), Status: "approved"})
	suite.Require().NoError(err)
	player, err := database.CreatePlayer(database.Player{GroupId: group.ID, LaneId: lane.ID, ParticipantId: playerParticipant.ID, Name: "qualification target"})
	suite.Require().NoError(err)
	round, err := database.CreateRound(database.Round{PlayerId: player.ID})
	suite.Require().NoError(err)
	end, err := database.CreateRoundEnd(database.RoundEnd{RoundId: round.ID})
	suite.Require().NoError(err)
	for range 3 {
		_, err = database.CreateRoundScore(database.RoundScore{RoundEndId: end.ID, Score: -1})
		suite.Require().NoError(err)
	}
	foreignCompetition, err := database.PostCompetition(database.Competition{Title: "foreign qualification judge", StartTime: now, EndTime: now.Add(time.Hour)})
	suite.Require().NoError(err)
	return end, round, player,
		suite.judgeCookies(competition.ID, 85202, "pending"),
		suite.judgeCookies(foreignCompetition.ID, 85203, "approved"),
		suite.judgeCookies(competition.ID, 85204, "approved")
}

func (suite *EliminationBracketIntegrationTestSuite) TestPendingAndForeignJudgesCannotScoreQualification() {
	end, round, player, pending, foreign, _ := suite.qualificationJudgeFixture()
	for _, cookies := range [][]*http.Cookie{pending, foreign} {
		recorder := suite.requestJSON(http.MethodPatch, fmt.Sprintf("/player/all-endscores/%d", end.ID), map[string]any{"scores": []int{10, 9, 8}}, cookies)
		suite.Equal(http.StatusForbidden, recorder.Code, recorder.Body.String())
		var storedEnd database.RoundEnd
		suite.Require().NoError(database.DB.First(&storedEnd, end.ID).Error)
		suite.False(storedEnd.IsConfirmed)
		var storedRound database.Round
		suite.Require().NoError(database.DB.First(&storedRound, round.ID).Error)
		suite.Zero(storedRound.TotalScore)
		storedPlayer, err := database.GetOnlyPlayer(player.ID)
		suite.Require().NoError(err)
		suite.Zero(storedPlayer.TotalScore)
		var scores []database.RoundScore
		suite.Require().NoError(database.DB.Where("round_end_id = ?", end.ID).Find(&scores).Error)
		for _, score := range scores {
			suite.Equal(-1, score.Score)
		}
	}
}

func (suite *EliminationBracketIntegrationTestSuite) TestJudgeCannotUnconfirmQualificationEnd() {
	end, _, _, _, _, judge := suite.qualificationJudgeFixture()
	suite.Require().NoError(database.DB.Model(&database.RoundEnd{}).Where("id = ?", end.ID).Update("is_confirmed", true).Error)
	recorder := suite.requestJSON(http.MethodPatch, fmt.Sprintf("/player/isconfirmed/%d", end.ID), map[string]bool{"is_confirmed": false}, judge)
	suite.Equal(http.StatusForbidden, recorder.Code, recorder.Body.String())
	var stored database.RoundEnd
	suite.Require().NoError(database.DB.First(&stored, end.ID).Error)
	suite.True(stored.IsConfirmed)
}

func (suite *EliminationBracketIntegrationTestSuite) TestJudgeCannotPerformAdminBracketWrites() {
	elimination, sets, adminCookies, _ := suite.createFixture(1, 4, nil)
	recorder, _ := suite.postSeededBracket(elimination.ID, adminCookies)
	suite.Require().Equal(http.StatusOK, recorder.Code)
	bracket := suite.loadBracket(elimination.ID)
	group, err := database.GetGroupInfoById(elimination.GroupId)
	suite.Require().NoError(err)
	judge := suite.judgeCookies(group.CompetitionId, 85101, "approved")
	// Team creation, advancement and medal assignment are all Admin-only.
	teamElimination, err := database.CreateElimination(database.Elimination{GroupId: group.ID, TeamSize: 3})
	suite.Require().NoError(err)
	suite.Require().NoError(database.DB.FirstOrCreate(&database.Qualification{ID: group.ID}, database.Qualification{ID: group.ID}).Error)
	lane, err := database.PostLane(database.Lane{CompetitionId: group.CompetitionId, QualificationId: group.ID, LaneNumber: 99})
	suite.Require().NoError(err)
	playerIDs := make([]uint, 0, 3)
	for index := 0; index < 3; index++ {
		participant, err := database.CreateParticipant(database.Participant{UserID: uint(85110 + index), CompetitionID: group.CompetitionId, Role: pkg.RoleToString(pkg.RPlayer), Status: "approved"})
		suite.Require().NoError(err)
		player, err := database.CreatePlayer(database.Player{GroupId: group.ID, LaneId: lane.ID, ParticipantId: participant.ID, Name: fmt.Sprintf("team player %d", index)})
		suite.Require().NoError(err)
		playerIDs = append(playerIDs, player.ID)
	}
	teamBody := map[string]any{"elimination_id": teamElimination.ID, "set_name": "valid team", "player_ids": playerIDs}
	var beforeSets []database.PlayerSet
	suite.Require().NoError(database.DB.Where("elimination_id = ?", teamElimination.ID).Order("id").Find(&beforeSets).Error)
	beforeBracket := suite.loadBracket(elimination.ID)
	recorder = suite.requestJSON(http.MethodPost, "/playerset", teamBody, judge)
	suite.Equal(http.StatusForbidden, recorder.Code)
	suite.Equal(beforeBracket, suite.loadBracket(elimination.ID))
	var storedSets []database.PlayerSet
	suite.Require().NoError(database.DB.Where("elimination_id = ?", teamElimination.ID).Order("id").Find(&storedSets).Error)
	suite.Equal(beforeSets, storedSets)
	recorder = suite.requestJSON(http.MethodPost, "/playerset", teamBody, adminCookies)
	suite.Require().Equal(http.StatusOK, recorder.Code, recorder.Body.String())
	// Complete both source matches through the score and confirmation endpoints.
	// Thus the following advance is valid for an Admin, and the Judge rejection
	// cannot be mistaken for an incomplete-stage validation failure.
	for _, match := range bracket.Stages[0].Matchs {
		for endIndex := range match.MatchResults[0].MatchEnds {
			for resultIndex, scores := range [][]int{{10, 10, 10}, {9, 9, 9}} {
				end := match.MatchResults[resultIndex].MatchEnds[endIndex]
				recorder = suite.putMatchEndScores(*end, scores, 0, adminCookies)
				suite.Require().Equal(http.StatusOK, recorder.Code, recorder.Body.String())
				recorder = suite.requestJSON(http.MethodPatch, fmt.Sprintf("/matchresult/matchend/isconfirmed/%d", end.ID), map[string]bool{"is_confirmed": true}, adminCookies)
				suite.Require().Equal(http.StatusOK, recorder.Code, recorder.Body.String())
			}
		}
	}
	bracket = suite.loadBracket(elimination.ID)
	for _, match := range bracket.Stages[0].Matchs {
		suite.True(match.MatchResults[0].IsWinner)
		suite.False(match.MatchResults[1].IsWinner)
	}
	beforeBracket = suite.loadBracket(elimination.ID)
	recorder, _ = suite.postAdvance(bracket.Stages[0].ID, judge)
	suite.Equal(http.StatusForbidden, recorder.Code)
	suite.Equal(beforeBracket, suite.loadBracket(elimination.ID))
	recorder, _ = suite.postAdvance(bracket.Stages[0].ID, adminCookies)
	suite.Equal(http.StatusOK, recorder.Code, recorder.Body.String())
	medals, err := database.GetMedalInfoByEliminationId(elimination.ID)
	suite.Require().NoError(err)
	before := medals[0].PlayerSetId
	recorder = suite.requestJSON(http.MethodPatch, fmt.Sprintf("/medal/playersetid/%d", medals[0].ID), map[string]uint{"player_set_id": sets[0].ID}, judge)
	suite.Equal(http.StatusForbidden, recorder.Code)
	after, err := database.GetMedalById(medals[0].ID)
	suite.Require().NoError(err)
	suite.Equal(before, after.PlayerSetId)

	// The seeded bracket above is complete, so a manual medal update by an
	// Admin is deliberately rejected by the bracket lock.  Keep the Judge's
	// authorization assertion separate from that state rule: a legacy,
	// incomplete elimination in the same competition makes the same request
	// valid for its Admin while still forbidden to this approved Judge.
	legacy, err := database.CreateElimination(database.Elimination{GroupId: group.ID, TeamSize: 1})
	suite.Require().NoError(err)
	legacySet, err := database.CreatePlayerSet(database.PlayerSet{EliminationId: legacy.ID, Rank: 1, SetName: "legacy medal set"})
	suite.Require().NoError(err)
	legacyMedal, err := database.CreateMedal(database.Medal{EliminationId: legacy.ID, Type: 0})
	suite.Require().NoError(err)
	legacyBody := map[string]uint{"player_set_id": legacySet.ID}
	recorder = suite.requestJSON(http.MethodPatch, fmt.Sprintf("/medal/playersetid/%d", legacyMedal.ID), legacyBody, judge)
	suite.Equal(http.StatusForbidden, recorder.Code, recorder.Body.String())
	storedLegacyMedal, err := database.GetMedalById(legacyMedal.ID)
	suite.Require().NoError(err)
	suite.Zero(storedLegacyMedal.PlayerSetId)
	recorder = suite.requestJSON(http.MethodPatch, fmt.Sprintf("/medal/playersetid/%d", legacyMedal.ID), legacyBody, adminCookies)
	suite.Equal(http.StatusOK, recorder.Code, recorder.Body.String())
	storedLegacyMedal, err = database.GetMedalById(legacyMedal.ID)
	suite.Require().NoError(err)
	suite.Equal(legacySet.ID, storedLegacyMedal.PlayerSetId)
}
