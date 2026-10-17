//go:build integration

package routers

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"strconv"
	"testing"
	"time"

	"backend/internal/database"
	"backend/internal/pkg"

	"github.com/gin-contrib/sessions"
	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/require"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type softDeleteFixture struct {
	router                 *gin.Engine
	targetCompetition      database.Competition
	liveCompetition        database.Competition
	targetAdmin            database.User
	dictator               database.User
	foreignAdmin           database.User
	targetAdminParticipant database.Participant
	targetGroup            database.Group
	targetParticipant      database.Participant
	applicantParticipant   database.Participant
	targetPlayer           database.Player
	targetElimination      database.Elimination
	targetMatch            database.Match
	targetMatchScore       database.MatchScore
	targetAdminCookies     []*http.Cookie
	dictatorCookies        []*http.Cookie
	foreignAdminCookies    []*http.Cookie
}

// softDeleteSnapshot deliberately contains every application table.  The test
// has one populated competition and one empty live competition, so a row-level
// comparison catches accidental cascades, updates, and orphan clean-up.
type softDeleteSnapshot struct {
	Institutions        []database.Institution
	Users               []database.User
	Competitions        []database.Competition
	Groups              []database.Group
	Qualifications      []database.Qualification
	Lanes               []database.Lane
	Participants        []database.Participant
	Players             []database.Player
	Rounds              []database.Round
	RoundEnds           []database.RoundEnd
	RoundScores         []database.RoundScore
	Eliminations        []database.Elimination
	PlayerSets          []database.PlayerSet
	PlayerSetMatchTable []database.PlayerSetMatchTable
	Stages              []database.Stage
	Matches             []database.Match
	MatchResults        []database.MatchResult
	MatchEnds           []database.MatchEnd
	MatchScores         []database.MatchScore
	Medals              []database.Medal
}

func TestCompetitionSoftDeletePreservesGraphAndBlocksDeletedResources(t *testing.T) {
	fixture := newSoftDeleteFixture(t)

	// Prove that the score write is otherwise valid.  A later rejected write is
	// therefore evidence of the deleted-competition guard, rather than a broken
	// incomplete-bracket fixture.
	response := softDeleteRequest(t, fixture.router, http.MethodPatch,
		fmt.Sprintf("/api/matchresult/matchscore/score/%d", fixture.targetMatchScore.ID),
		gin.H{"score": 8}, fixture.targetAdminCookies)
	require.Equal(t, http.StatusOK, response.Code, response.Body.String())
	var savedScore database.MatchScore
	require.NoError(t, database.DB.First(&savedScore, fixture.targetMatchScore.ID).Error)
	require.Equal(t, 8, savedScore.Score)

	before := takeSoftDeleteSnapshot(t)
	assertChildGETsReachable(t, fixture, before)
	assertCompetitionDeleteAdminNegativeCases(t, fixture)

	response = softDeleteRequest(t, fixture.router, http.MethodDelete,
		fmt.Sprintf("/api/competition/%d", fixture.targetCompetition.ID), nil, nil)
	require.Equal(t, http.StatusForbidden, response.Code, response.Body.String())
	require.Equal(t, before, takeSoftDeleteSnapshot(t))

	response = softDeleteRequest(t, fixture.router, http.MethodDelete,
		fmt.Sprintf("/api/competition/%d", fixture.targetCompetition.ID), nil, fixture.foreignAdminCookies)
	require.Equal(t, http.StatusForbidden, response.Code, response.Body.String())
	require.Equal(t, before, takeSoftDeleteSnapshot(t))

	assertCompetitionDeleteDoesNotWaitForParticipantLock(t, fixture)

	var softDeleted database.Competition
	require.NoError(t, database.DB.Unscoped().First(&softDeleted, fixture.targetCompetition.ID).Error)
	require.True(t, softDeleted.DeletedAt.Valid)
	require.Equal(t, before, takeSoftDeleteSnapshot(t), "deleted_at is the only permitted database change")

	assertCompetitionListsHideDeleted(t, fixture)
	assertDeletedChildRoutesAreRejected(t, fixture, before)

	response = softDeleteRequest(t, fixture.router, http.MethodDelete,
		fmt.Sprintf("/api/competition/%d", fixture.targetCompetition.ID), nil, fixture.targetAdminCookies)
	require.Equal(t, http.StatusBadRequest, response.Code, response.Body.String())
	require.Equal(t, before, takeSoftDeleteSnapshot(t))

	// This is a database-only restoration check, not a restore API contract.
	require.NoError(t, database.DB.Unscoped().Model(&database.Competition{}).
		Where("id = ?", fixture.targetCompetition.ID).
		Update("deleted_at", nil).Error)
	response = softDeleteRequest(t, fixture.router, http.MethodGet,
		fmt.Sprintf("/api/competition/%d", fixture.targetCompetition.ID), nil, nil)
	require.Equal(t, http.StatusOK, response.Code, response.Body.String())
	require.Equal(t, before, takeSoftDeleteSnapshot(t))
	assertQualificationScoresSurviveParticipantRemoval(t, fixture)
}

func newSoftDeleteFixture(t *testing.T) softDeleteFixture {
	t.Helper()
	require.NoError(t, database.ResetTestDatabase("empty"))
	database.CreateNoInstitution()

	sharedInstitution := database.Institution{Name: "soft-delete shared institution"}
	require.NoError(t, database.AddInstitution(&sharedInstitution))
	dictator := createSoftDeleteUser(t, sharedInstitution.ID, "soft-delete-dictator", "Dictator")
	targetAdmin := createSoftDeleteUser(t, sharedInstitution.ID, "soft-delete-admin", "User")
	playerOneUser := createSoftDeleteUser(t, sharedInstitution.ID, "soft-delete-player-one", "User")
	playerTwoUser := createSoftDeleteUser(t, sharedInstitution.ID, "soft-delete-player-two", "User")
	applicantUser := createSoftDeleteUser(t, sharedInstitution.ID, "soft-delete-applicant", "User")
	foreignAdmin := createSoftDeleteUser(t, sharedInstitution.ID, "soft-delete-foreign-admin", "User")

	now := time.Date(2026, time.September, 28, 9, 0, 0, 0, time.UTC)
	targetCompetition, err := database.PostCompetition(database.Competition{
		Title:               "soft-delete target",
		HostID:              targetAdmin.ID,
		RoundsNum:           1,
		EliminationIsActive: true,
		StartTime:           now,
		EndTime:             now.Add(time.Hour),
	})
	require.NoError(t, err)
	liveCompetition, err := database.PostCompetition(database.Competition{
		Title:     "soft-delete live control",
		HostID:    foreignAdmin.ID,
		StartTime: now.Add(2 * time.Hour),
		EndTime:   now.Add(3 * time.Hour),
	})
	require.NoError(t, err)

	targetGroup, err := database.CreateGroupInfo(database.Group{
		CompetitionId: targetCompetition.ID,
		GroupName:     "soft-delete group",
		GroupRange:    "Open",
		BowType:       "Recurve",
		GroupIndex:    1,
	})
	require.NoError(t, err)
	qualification, err := database.PostQualification(database.Qualification{AdvancingNum: 2, StartLaneNumber: 1, EndLaneNumber: 1})
	require.NoError(t, err)
	require.Equal(t, targetGroup.ID, qualification.ID, "fixture relies on the legacy group/qualification shared-id convention")
	targetLane, err := database.PostLane(database.Lane{CompetitionId: targetCompetition.ID, QualificationId: qualification.ID, LaneNumber: 1})
	require.NoError(t, err)
	require.NoError(t, database.DB.Model(&database.Competition{}).Where("id = ?", targetCompetition.ID).Updates(map[string]any{
		"unassigned_group_id": targetGroup.ID,
		"unassigned_lane_id":  targetLane.ID,
		"groups_num":          1,
		"lanes_num":           1,
	}).Error)

	targetAdminParticipant := createSoftDeleteParticipant(t, targetAdmin.ID, targetCompetition.ID, pkg.RAdmin)
	playerOneParticipant := createSoftDeleteParticipant(t, playerOneUser.ID, targetCompetition.ID, pkg.RPlayer)
	playerTwoParticipant := createSoftDeleteParticipant(t, playerTwoUser.ID, targetCompetition.ID, pkg.RPlayer)
	applicantParticipant := createSoftDeleteParticipant(t, applicantUser.ID, targetCompetition.ID, pkg.RPlayer)
	_ = targetAdminParticipant
	_ = createSoftDeleteParticipant(t, foreignAdmin.ID, liveCompetition.ID, pkg.RAdmin)

	playerOne, err := database.CreatePlayer(database.Player{GroupId: targetGroup.ID, LaneId: targetLane.ID, ParticipantId: playerOneParticipant.ID, Name: "one", TotalScore: 42, ShootOffScore: 9, Rank: 1, Order: 1})
	require.NoError(t, err)
	playerTwo, err := database.CreatePlayer(database.Player{GroupId: targetGroup.ID, LaneId: targetLane.ID, ParticipantId: playerTwoParticipant.ID, Name: "two", TotalScore: 40, ShootOffScore: 8, Rank: 2, Order: 2})
	require.NoError(t, err)
	createSoftDeleteQualificationScores(t, playerOne.ID)
	createSoftDeleteQualificationScores(t, playerTwo.ID)

	elimination, err := database.CreateElimination(database.Elimination{GroupId: targetGroup.ID, TeamSize: 1, CurrentStage: 0, CurrentEnd: 0, BracketSeedCount: 2})
	require.NoError(t, err)
	playerSetOne, err := database.CreatePlayerSet(database.PlayerSet{EliminationId: elimination.ID, TotalScore: 42, Rank: 1, SetName: "one"})
	require.NoError(t, err)
	playerSetTwo, err := database.CreatePlayerSet(database.PlayerSet{EliminationId: elimination.ID, TotalScore: 40, Rank: 2, SetName: "two"})
	require.NoError(t, err)
	_, err = database.CreatePlayerSetMatchTable(database.PlayerSetMatchTable{PlayerSetId: playerSetOne.ID, PlayerId: playerOne.ID})
	require.NoError(t, err)
	_, err = database.CreatePlayerSetMatchTable(database.PlayerSetMatchTable{PlayerSetId: playerSetTwo.ID, PlayerId: playerTwo.ID})
	require.NoError(t, err)
	stage, err := database.CreateStage(database.Stage{EliminationId: elimination.ID})
	require.NoError(t, err)
	match, matchScore := createSoftDeleteBracketMatch(t, stage.ID, &playerSetOne.ID, &playerSetTwo.ID)
	_, _ = createSoftDeleteBracketMatch(t, stage.ID, nil, nil)
	for medalType := 0; medalType < 3; medalType++ {
		_, err = database.CreateMedal(database.Medal{EliminationId: elimination.ID, Type: medalType})
		require.NoError(t, err)
	}

	router := gin.New()
	router.Use(pkg.EnableCookieSessionMiddleware(pkg.SessionConfig{Key: "competition-soft-delete-integration"}))
	router.POST("/_test/session/:userID", func(context *gin.Context) {
		userID, parseErr := strconv.ParseUint(context.Param("userID"), 10, 64)
		if parseErr != nil || userID == 0 {
			context.Status(http.StatusBadRequest)
			return
		}
		session := sessions.Default(context)
		session.Set("userid", uint(userID))
		require.NoError(t, session.Save())
		context.Status(http.StatusNoContent)
	})
	AddApiRouter(router.Group("/api"))

	return softDeleteFixture{
		router:                 router,
		targetCompetition:      targetCompetition,
		liveCompetition:        liveCompetition,
		targetAdmin:            targetAdmin,
		dictator:               dictator,
		foreignAdmin:           foreignAdmin,
		targetAdminParticipant: targetAdminParticipant,
		targetGroup:            targetGroup,
		targetParticipant:      playerOneParticipant,
		applicantParticipant:   applicantParticipant,
		targetPlayer:           playerOne,
		targetElimination:      elimination,
		targetMatch:            match,
		targetMatchScore:       matchScore,
		targetAdminCookies:     softDeleteLogin(t, router, targetAdmin.ID),
		dictatorCookies:        softDeleteLogin(t, router, dictator.ID),
		foreignAdminCookies:    softDeleteLogin(t, router, foreignAdmin.ID),
	}
}

func createSoftDeleteBracketMatch(t *testing.T, stageID uint, leftPlayerSetID, rightPlayerSetID *uint) (database.Match, database.MatchScore) {
	t.Helper()
	match, err := database.CreateMatch(database.Match{StageId: stageID})
	require.NoError(t, err)

	var firstScore database.MatchScore
	for _, playerSetID := range []*uint{leftPlayerSetID, rightPlayerSetID} {
		result, createErr := database.CreateMatchResult(database.MatchResult{
			MatchId:       match.ID,
			PlayerSetId:   playerSetID,
			ShootOffScore: -1,
		})
		require.NoError(t, createErr)
		for endIndex := 0; endIndex < 5; endIndex++ {
			matchEnd, endErr := database.CreateMatchEnd(database.MatchEnd{MatchResultId: result.ID})
			require.NoError(t, endErr)
			for scoreIndex := 0; scoreIndex < 3; scoreIndex++ {
				matchScore, scoreErr := database.CreateMatchScore(database.MatchScore{MatchEndId: matchEnd.ID, Score: -1})
				require.NoError(t, scoreErr)
				if firstScore.ID == 0 {
					firstScore = matchScore
				}
			}
		}
	}
	return match, firstScore
}

func assertQualificationScoresSurviveParticipantRemoval(t *testing.T, fixture softDeleteFixture) {
	t.Helper()
	before := takeSoftDeleteSnapshot(t)
	require.NoError(t, database.DB.Delete(&database.Participant{}, fixture.targetParticipant.ID).Error)

	response := softDeleteRequest(t, fixture.router, http.MethodGet,
		fmt.Sprintf("/api/player/scores/%d", fixture.targetPlayer.ID), nil, nil)
	require.Equal(t, http.StatusOK, response.Code, response.Body.String())

	after := takeSoftDeleteSnapshot(t)
	require.Equal(t, before.Players, after.Players)
	require.Equal(t, before.Rounds, after.Rounds)
	require.Equal(t, before.RoundEnds, after.RoundEnds)
	require.Equal(t, before.RoundScores, after.RoundScores)
	require.Len(t, after.Participants, len(before.Participants)-1)
}

func softDeleteChildGETPaths(t *testing.T, fixture softDeleteFixture, snapshot softDeleteSnapshot) []string {
	t.Helper()
	require.NotEmpty(t, snapshot.Lanes)
	require.NotEmpty(t, snapshot.Qualifications)
	require.NotEmpty(t, snapshot.PlayerSets)
	require.NotEmpty(t, snapshot.MatchResults)
	require.NotEmpty(t, snapshot.Medals)
	return []string{
		fmt.Sprintf("/api/groupinfo/%d", fixture.targetGroup.ID),
		fmt.Sprintf("/api/lane/%d", snapshot.Lanes[0].ID),
		fmt.Sprintf("/api/qualification/%d", snapshot.Qualifications[0].ID),
		fmt.Sprintf("/api/participant/%d", fixture.targetParticipant.ID),
		fmt.Sprintf("/api/player/%d", fixture.targetPlayer.ID),
		fmt.Sprintf("/api/player/scores/%d", fixture.targetPlayer.ID),
		fmt.Sprintf("/api/player/dummy/%d", fixture.targetParticipant.ID),
		fmt.Sprintf("/api/playerset/%d", snapshot.PlayerSets[0].ID),
		fmt.Sprintf("/api/elimination/%d", fixture.targetElimination.ID),
		fmt.Sprintf("/api/elimination/stages/matches/%d", fixture.targetElimination.ID),
		fmt.Sprintf("/api/elimination/match/scores/%d", fixture.targetMatch.ID),
		// MatchResult scores preload the fixture MatchEnd and MatchScore rows.
		fmt.Sprintf("/api/matchresult/scores/%d", snapshot.MatchResults[0].ID),
		fmt.Sprintf("/api/medal/%d", snapshot.Medals[0].ID),
	}
}

func assertChildGETsReachable(t *testing.T, fixture softDeleteFixture, snapshot softDeleteSnapshot) {
	t.Helper()
	for _, path := range softDeleteChildGETPaths(t, fixture, snapshot) {
		response := softDeleteRequest(t, fixture.router, http.MethodGet, path, nil, nil)
		require.Equalf(t, http.StatusOK, response.Code, "GET %s must work before deleting its competition: %s", path, response.Body.String())
	}
}

func assertCompetitionDeleteAdminNegativeCases(t *testing.T, fixture softDeleteFixture) {
	t.Helper()
	for _, testCase := range []struct {
		name    string
		updates map[string]any
		cookies []*http.Cookie
	}{
		{name: "pending admin", updates: map[string]any{"status": "pending"}, cookies: fixture.targetAdminCookies},
		{name: "rejected admin", updates: map[string]any{"status": "rejected"}, cookies: fixture.targetAdminCookies},
		{name: "judge participant", updates: map[string]any{"role": pkg.RoleToString(pkg.RJudge)}, cookies: fixture.targetAdminCookies},
		{name: "player participant", updates: map[string]any{"role": pkg.RoleToString(pkg.RPlayer)}, cookies: fixture.targetAdminCookies},
		{name: "dictator without target admin", updates: map[string]any{"role": pkg.RoleToString(pkg.RViewer)}, cookies: fixture.dictatorCookies},
	} {
		t.Run(testCase.name, func(t *testing.T) {
			approved := takeSoftDeleteSnapshot(t)
			require.NoError(t, database.DB.Model(&database.Participant{}).Where("id = ?", fixture.targetAdminParticipant.ID).Updates(testCase.updates).Error)
			deniedBaseline := takeSoftDeleteSnapshot(t)
			response := softDeleteRequest(t, fixture.router, http.MethodDelete,
				fmt.Sprintf("/api/competition/%d", fixture.targetCompetition.ID), nil, testCase.cookies)
			require.Equal(t, http.StatusForbidden, response.Code, response.Body.String())
			require.Equal(t, deniedBaseline, takeSoftDeleteSnapshot(t))
			require.NoError(t, database.DB.Model(&database.Participant{}).Where("id = ?", fixture.targetAdminParticipant.ID).Updates(map[string]any{
				"status": "approved",
				"role":   pkg.RoleToString(pkg.RAdmin),
			}).Error)
			require.Equal(t, approved, takeSoftDeleteSnapshot(t))
		})
	}
}

func assertCompetitionDeleteDoesNotWaitForParticipantLock(t *testing.T, fixture softDeleteFixture) {
	t.Helper()
	tx := database.DB.Begin()
	require.NoError(t, tx.Error)
	defer func() { _ = tx.Rollback().Error }()

	var participant database.Participant
	require.NoError(t, tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&participant, fixture.targetAdminParticipant.ID).Error)

	done := make(chan int, 1)
	go func() {
		request := httptest.NewRequest(http.MethodDelete, fmt.Sprintf("/api/competition/%d", fixture.targetCompetition.ID), nil)
		for _, cookie := range fixture.targetAdminCookies {
			request.AddCookie(cookie)
		}
		response := httptest.NewRecorder()
		fixture.router.ServeHTTP(response, request)
		done <- response.Code
	}()

	select {
	case status := <-done:
		require.Equal(t, http.StatusOK, status)
	case <-time.After(2 * time.Second):
		require.NoError(t, tx.Rollback().Error)
		select {
		case status := <-done:
			require.Failf(t, "competition delete waited for retained participant lock", "status after releasing lock: %d", status)
		case <-time.After(2 * time.Second):
			require.Fail(t, "competition delete remained blocked after releasing participant lock")
		}
	}
}

func assertCompetitionListsHideDeleted(t *testing.T, fixture softDeleteFixture) {
	t.Helper()
	response := softDeleteRequest(t, fixture.router, http.MethodGet, "/api/competition/", nil, nil)
	require.Equal(t, http.StatusOK, response.Code, response.Body.String())
	var all []database.Competition
	require.NoError(t, json.Unmarshal(response.Body.Bytes(), &all))
	require.Equal(t, []uint{fixture.liveCompetition.ID}, competitionIDs(all))

	response = softDeleteRequest(t, fixture.router, http.MethodGet, "/api/competition/current/0/10", nil, nil)
	require.Equal(t, http.StatusOK, response.Code, response.Body.String())
	require.Equal(t, "1", response.Header().Get("X-Total-Count"))
	var current []database.Competition
	require.NoError(t, json.Unmarshal(response.Body.Bytes(), &current))
	require.Equal(t, []uint{fixture.liveCompetition.ID}, competitionIDs(current))

	response = softDeleteRequest(t, fixture.router, http.MethodGet,
		fmt.Sprintf("/api/competition/user/%d/0/10", fixture.targetAdmin.ID), nil, nil)
	require.Equal(t, http.StatusOK, response.Code, response.Body.String())
	require.Equal(t, "0", response.Header().Get("X-Total-Count"))
	var byUser []database.Competition
	require.NoError(t, json.Unmarshal(response.Body.Bytes(), &byUser))
	require.Empty(t, byUser)

	response = softDeleteRequest(t, fixture.router, http.MethodGet,
		fmt.Sprintf("/api/competition/%d", fixture.targetCompetition.ID), nil, nil)
	require.Equal(t, http.StatusBadRequest, response.Code, response.Body.String())
	response = softDeleteRequest(t, fixture.router, http.MethodGet,
		fmt.Sprintf("/api/competition/%d", fixture.liveCompetition.ID), nil, nil)
	require.Equal(t, http.StatusOK, response.Code, response.Body.String())

	response = softDeleteRequest(t, fixture.router, http.MethodGet,
		fmt.Sprintf("/api/participant/user/%d", fixture.targetAdmin.ID), nil, nil)
	require.Equal(t, http.StatusOK, response.Code, response.Body.String())
	var participants []database.Participant
	require.NoError(t, json.Unmarshal(response.Body.Bytes(), &participants))
	require.Empty(t, participants)
}

func assertDeletedChildRoutesAreRejected(t *testing.T, fixture softDeleteFixture, before softDeleteSnapshot) {
	t.Helper()
	for _, path := range softDeleteChildGETPaths(t, fixture, before) {
		response := softDeleteRequest(t, fixture.router, http.MethodGet, path, nil, nil)
		require.Truef(t, response.Code >= http.StatusBadRequest && response.Code < http.StatusInternalServerError,
			"GET %s must reject deleted competition child, got %d: %s", path, response.Code, response.Body.String())
	}

	response := softDeleteRequest(t, fixture.router, http.MethodPatch,
		fmt.Sprintf("/api/matchresult/matchscore/score/%d", fixture.targetMatchScore.ID),
		gin.H{"score": 9}, fixture.targetAdminCookies)
	require.True(t, response.Code >= http.StatusBadRequest && response.Code < http.StatusInternalServerError, response.Body.String())

	response = softDeleteRequest(t, fixture.router, http.MethodPost,
		fmt.Sprintf("/api/player/%d", fixture.applicantParticipant.ID), gin.H{}, fixture.targetAdminCookies)
	require.True(t, response.Code >= http.StatusBadRequest && response.Code < http.StatusInternalServerError, response.Body.String())

	response = softDeleteRequest(t, fixture.router, http.MethodPost, "/api/groupinfo/", database.Group{
		CompetitionId: fixture.targetCompetition.ID,
		GroupName:     "must not be created",
		GroupRange:    "Open",
		BowType:       "Recurve",
		GroupIndex:    2,
	}, fixture.targetAdminCookies)
	require.True(t, response.Code >= http.StatusBadRequest && response.Code < http.StatusInternalServerError, response.Body.String())
	require.Equal(t, before, takeSoftDeleteSnapshot(t))
}

func takeSoftDeleteSnapshot(t *testing.T) softDeleteSnapshot {
	t.Helper()
	var snapshot softDeleteSnapshot
	require.NoError(t, database.DB.Order("id").Find(&snapshot.Institutions).Error)
	require.NoError(t, database.DB.Order("id").Find(&snapshot.Users).Error)
	require.NoError(t, database.DB.Unscoped().Order("id").Find(&snapshot.Competitions).Error)
	for index := range snapshot.Competitions {
		snapshot.Competitions[index].DeletedAt = gorm.DeletedAt{}
	}
	require.NoError(t, database.DB.Order("id").Find(&snapshot.Groups).Error)
	require.NoError(t, database.DB.Order("id").Find(&snapshot.Qualifications).Error)
	require.NoError(t, database.DB.Order("id").Find(&snapshot.Lanes).Error)
	require.NoError(t, database.DB.Order("id").Find(&snapshot.Participants).Error)
	require.NoError(t, database.DB.Order("id").Find(&snapshot.Players).Error)
	require.NoError(t, database.DB.Order("id").Find(&snapshot.Rounds).Error)
	require.NoError(t, database.DB.Order("id").Find(&snapshot.RoundEnds).Error)
	require.NoError(t, database.DB.Order("id").Find(&snapshot.RoundScores).Error)
	require.NoError(t, database.DB.Order("id").Find(&snapshot.Eliminations).Error)
	require.NoError(t, database.DB.Order("id").Find(&snapshot.PlayerSets).Error)
	require.NoError(t, database.DB.Order("player_set_id, player_id").Find(&snapshot.PlayerSetMatchTable).Error)
	require.NoError(t, database.DB.Order("id").Find(&snapshot.Stages).Error)
	require.NoError(t, database.DB.Order("id").Find(&snapshot.Matches).Error)
	require.NoError(t, database.DB.Order("id").Find(&snapshot.MatchResults).Error)
	require.NoError(t, database.DB.Order("id").Find(&snapshot.MatchEnds).Error)
	require.NoError(t, database.DB.Order("id").Find(&snapshot.MatchScores).Error)
	require.NoError(t, database.DB.Order("id").Find(&snapshot.Medals).Error)
	return snapshot
}

func createSoftDeleteUser(t *testing.T, institutionID uint, name, role string) database.User {
	t.Helper()
	email := name + "@example.test"
	user, err := database.CreateUser(database.User{
		Role:          role,
		UserName:      name,
		RealName:      name,
		Password:      "test-password",
		Email:         &email,
		InstitutionID: institutionID,
	})
	require.NoError(t, err)
	return user
}

func createSoftDeleteParticipant(t *testing.T, userID, competitionID uint, role pkg.Role) database.Participant {
	t.Helper()
	participant, err := database.CreateParticipant(database.Participant{
		UserID:        userID,
		CompetitionID: competitionID,
		Role:          pkg.RoleToString(role),
		Status:        "approved",
	})
	require.NoError(t, err)
	return participant
}

func createSoftDeleteQualificationScores(t *testing.T, playerID uint) {
	t.Helper()
	round, err := database.CreateRound(database.Round{PlayerId: playerID, TotalScore: 10})
	require.NoError(t, err)
	end, err := database.CreateRoundEnd(database.RoundEnd{RoundId: round.ID, IsConfirmed: true})
	require.NoError(t, err)
	_, err = database.CreateRoundScore(database.RoundScore{RoundEndId: end.ID, Score: 10})
	require.NoError(t, err)
}

func softDeleteLogin(t *testing.T, router *gin.Engine, userID uint) []*http.Cookie {
	t.Helper()
	response := softDeleteRequest(t, router, http.MethodPost, fmt.Sprintf("/_test/session/%d", userID), nil, nil)
	require.Equal(t, http.StatusNoContent, response.Code, response.Body.String())
	return response.Result().Cookies()
}

func softDeleteRequest(t *testing.T, router *gin.Engine, method, path string, body any, cookies []*http.Cookie) *httptest.ResponseRecorder {
	t.Helper()
	var requestBody *bytes.Reader
	if body == nil {
		requestBody = bytes.NewReader(nil)
	} else {
		encoded, err := json.Marshal(body)
		require.NoError(t, err)
		requestBody = bytes.NewReader(encoded)
	}
	request := httptest.NewRequest(method, path, requestBody)
	if body != nil {
		request.Header.Set("Content-Type", "application/json")
	}
	for _, cookie := range cookies {
		request.AddCookie(cookie)
	}
	response := httptest.NewRecorder()
	router.ServeHTTP(response, request)
	return response
}

func competitionIDs(competitions []database.Competition) []uint {
	ids := make([]uint, 0, len(competitions))
	for _, competition := range competitions {
		ids = append(ids, competition.ID)
	}
	return ids
}
