//go:build integration

package endpoint

import (
	"backend/internal/database"
	"backend/internal/pkg"
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"net/http/httptest"
	"os"
	"strings"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/require"
	"gorm.io/gorm"
)

func setupBulkRegisterTest(t *testing.T) (*gin.Engine, uint) {
	t.Helper()
	require.NoError(t, database.ResetTestDatabase("accounts"))
	competition, err := database.PostCompetition(database.Competition{
		Title: "Bulk registration", StartTime: time.Now(), EndTime: time.Now().Add(time.Hour), RoundsNum: 2,
	})
	require.NoError(t, err)
	group, err := database.CreateGroupInfo(database.Group{CompetitionId: competition.ID, GroupName: "unassigned"})
	require.NoError(t, err)
	qualification, err := database.PostQualification(database.Qualification{})
	require.NoError(t, err)
	lane, err := database.PostLane(database.Lane{CompetitionId: competition.ID, QualificationId: qualification.ID, LaneNumber: 0})
	require.NoError(t, err)
	require.NoError(t, database.DB.Model(&competition).Updates(map[string]any{
		"unassigned_group_id": group.ID, "unassigned_lane_id": lane.ID,
	}).Error)

	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.Use(pkg.EnableCookieSessionMiddleware(pkg.SessionConfig{Key: "bulk-register-integration-test-key"}))
	router.POST("/test/login/:role", func(c *gin.Context) {
		role := pkg.StringToRole(c.Param("role"))
		pkg.SaveAuthSession(c, pkg.SessionContents{
			Username: "bulk-test", UserId: 1, SystemRole: role, GameRole: pkg.RNone,
		})
		c.Status(http.StatusNoContent)
	})
	auth := []gin.HandlerFunc{pkg.AuthSessionMiddleware(), pkg.RBACMiddleware(pkg.RoleSystem, pkg.RDictator)}
	router.POST("/user/bulk/preview", append(auth, PreviewBulkRegister)...)
	router.POST("/user/bulk", append(auth, BulkRegister)...)
	return router, competition.ID
}

func bulkTestRequest(t *testing.T, router *gin.Engine, path string, body any, cookies []*http.Cookie) *httptest.ResponseRecorder {
	t.Helper()
	var input []byte
	if body != nil {
		var err error
		input, err = json.Marshal(body)
		require.NoError(t, err)
	}
	request := httptest.NewRequest(http.MethodPost, path, bytes.NewReader(input))
	request.Header.Set("Content-Type", "application/json")
	for _, cookie := range cookies {
		request.AddCookie(cookie)
	}
	recorder := httptest.NewRecorder()
	router.ServeHTTP(recorder, request)
	return recorder
}

func bulkTestLogin(t *testing.T, router *gin.Engine, role string) []*http.Cookie {
	t.Helper()
	response := bulkTestRequest(t, router, "/test/login/"+role, nil, nil)
	require.Equal(t, http.StatusNoContent, response.Code, response.Body.String())
	return response.Result().Cookies()
}

func TestBulkRegisterIntegration(t *testing.T) {
	if os.Getenv("ARCHERY_MYSQL_INTEGRATION") != "1" {
		t.Fatal("integration tests require scripts/test.sh go-integration")
	}

	t.Run("authorization preview and complete player graph", func(t *testing.T) {
		router, competitionID := setupBulkRegisterTest(t)
		body := BulkRegisterRequest{
			CompetitionID: competitionID, Prefix: "team-",
			CSV: "real_name,password,user_name,email\r\n\"陳,甲\",secret,a01,\r\n乙,pass2,a02,second@example.test\r\n",
		}
		guest := bulkTestRequest(t, router, "/user/bulk", body, nil)
		require.Equal(t, http.StatusUnauthorized, guest.Code)
		userCookies := bulkTestLogin(t, router, "User")
		require.Equal(t, http.StatusForbidden, bulkTestRequest(t, router, "/user/bulk", body, userCookies).Code)
		cookies := bulkTestLogin(t, router, "Dictator")
		preview := bulkTestRequest(t, router, "/user/bulk/preview", body, cookies)
		require.Equal(t, http.StatusOK, preview.Code, preview.Body.String())
		require.NotContains(t, preview.Body.String(), "secret")
		require.Contains(t, preview.Body.String(), "team-a01")
		require.NotContains(t, preview.Body.String(), "password")

		created := bulkTestRequest(t, router, "/user/bulk", body, cookies)
		require.Equal(t, http.StatusOK, created.Code, created.Body.String())
		var result BulkRegisterResponse
		require.NoError(t, json.Unmarshal(created.Body.Bytes(), &result))
		require.Equal(t, 2, result.CreatedCount)
		require.Len(t, result.Rows, 2)
		for index, item := range result.Rows {
			var user database.User
			require.NoError(t, database.DB.First(&user, item.UserID).Error)
			require.Equal(t, fmt.Sprintf("team-a%02d", index+1), user.UserName)
			require.Equal(t, database.NoInstitutionID, user.InstitutionID)
			require.NoError(t, pkg.Compare(user.Password, []string{"secret", "pass2"}[index]))
			if index == 0 {
				require.Nil(t, user.Email)
			} else {
				require.NotNil(t, user.Email)
				require.Equal(t, "second@example.test", *user.Email)
			}
			var participant database.Participant
			require.NoError(t, database.DB.First(&participant, item.ParticipantID).Error)
			require.Equal(t, item.UserID, participant.UserID)
			require.Equal(t, competitionID, participant.CompetitionID)
			require.Equal(t, "Player", participant.Role)
			require.Equal(t, "approved", participant.Status)
			var player database.Player
			require.NoError(t, database.DB.First(&player, item.PlayerID).Error)
			require.Equal(t, participant.ID, player.ParticipantId)
			var count int64
			require.NoError(t, database.DB.Model(&database.Round{}).Where("player_id = ?", player.ID).Count(&count).Error)
			require.EqualValues(t, 2, count)
			require.NoError(t, database.DB.Table("round_ends").Joins("JOIN rounds ON rounds.id = round_ends.round_id").Where("rounds.player_id = ?", player.ID).Count(&count).Error)
			require.EqualValues(t, 12, count)
			require.NoError(t, database.DB.Table("round_scores").Joins("JOIN round_ends ON round_ends.id = round_scores.round_end_id").Joins("JOIN rounds ON rounds.id = round_ends.round_id").Where("rounds.player_id = ? AND round_scores.score = -1", player.ID).Count(&count).Error)
			require.EqualValues(t, 72, count)
		}
		second := bulkTestRequest(t, router, "/user/bulk", body, cookies)
		require.Equal(t, http.StatusUnprocessableEntity, second.Code)
		require.Contains(t, second.Body.String(), "user_name")
	})

	t.Run("preview detects database-collation duplicates", func(t *testing.T) {
		router, competitionID := setupBulkRegisterTest(t)
		cookies := bulkTestLogin(t, router, "Dictator")
		body := BulkRegisterRequest{
			CompetitionID: competitionID,
			CSV:           "user_name,real_name,password,email\na,甲,secret,a@example.test\ná,乙,secret,á@example.test\n",
		}
		preview := bulkTestRequest(t, router, "/user/bulk/preview", body, cookies)
		require.Equal(t, http.StatusOK, preview.Code, preview.Body.String())
		var result BulkRegisterPreviewResponse
		require.NoError(t, json.Unmarshal(preview.Body.Bytes(), &result))
		require.Len(t, result.Errors, 2)
		require.Equal(t, 3, result.Errors[0].Line)
		require.Equal(t, "user_name", result.Errors[0].Field)
		require.Equal(t, "email", result.Errors[1].Field)
		commit := bulkTestRequest(t, router, "/user/bulk", body, cookies)
		require.Equal(t, http.StatusUnprocessableEntity, commit.Code, commit.Body.String())
		var count int64
		require.NoError(t, database.DB.Model(&database.User{}).Where("user_name IN ?", []string{"a", "á"}).Count(&count).Error)
		require.Zero(t, count)
	})

	t.Run("invalid row leaves no accounts", func(t *testing.T) {
		router, competitionID := setupBulkRegisterTest(t)
		cookies := bulkTestLogin(t, router, "Dictator")
		body := BulkRegisterRequest{CompetitionID: competitionID, Prefix: "invalid-", CSV: "user_name,real_name,password\na,甲,secret\nb,乙,\n"}
		result := bulkTestRequest(t, router, "/user/bulk", body, cookies)
		require.Equal(t, http.StatusUnprocessableEntity, result.Code)
		var count int64
		require.NoError(t, database.DB.Model(&database.User{}).Where("user_name LIKE ?", "invalid-%").Count(&count).Error)
		require.Zero(t, count)
	})

	t.Run("failed second participant rolls back first player graph", func(t *testing.T) {
		router, competitionID := setupBulkRegisterTest(t)
		cookies := bulkTestLogin(t, router, "Dictator")
		const hook = "bulk_register_forced_second_participant_failure"
		seen := 0
		require.NoError(t, database.DB.Callback().Create().Before("gorm:create").Register(hook, func(tx *gorm.DB) {
			if tx.Statement.Schema != nil && tx.Statement.Schema.Name == "Participant" {
				seen++
				if seen == 2 {
					tx.AddError(errors.New("forced participant failure"))
				}
			}
		}))
		defer database.DB.Callback().Create().Remove(hook)
		body := BulkRegisterRequest{CompetitionID: competitionID, Prefix: "rollback-", CSV: "user_name,real_name,password\na,甲,secret\nb,乙,secret\n"}
		result := bulkTestRequest(t, router, "/user/bulk", body, cookies)
		require.Equal(t, http.StatusInternalServerError, result.Code, result.Body.String())
		var count int64
		require.NoError(t, database.DB.Model(&database.User{}).Where("user_name LIKE ?", "rollback-%").Count(&count).Error)
		require.Zero(t, count)
		for _, table := range []string{"participants", "players", "rounds", "round_ends", "round_scores"} {
			require.NoError(t, database.DB.Table(table).Count(&count).Error)
			require.Zero(t, count, strings.ToLower(table))
		}
	})
}
