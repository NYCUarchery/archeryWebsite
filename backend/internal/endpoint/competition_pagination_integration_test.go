//go:build integration

package endpoint

import (
	"backend/internal/database"
	pkg "backend/internal/pkg"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"strconv"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
)

func TestCompetitionPaginationIntegration(t *testing.T) {
	if os.Getenv("ARCHERY_MYSQL_INTEGRATION") != "1" {
		t.Fatal("integration tests require scripts/test.sh go-integration")
	}
	if err := database.ResetTestDatabase("legacy"); err != nil {
		t.Fatal(err)
	}

	_, initialTotal, err := database.GetCurrentCompetitions(0, 0)
	if err != nil {
		t.Fatal(err)
	}
	user, err := database.CreateUser(database.User{Role: pkg.RoleToString(pkg.RUser), UserName: "pagination-user", RealName: "Pagination User", Password: "password", Email: database.EmailPointer("pagination-user@example.test"), InstitutionID: database.NoInstitutionID})
	if err != nil {
		t.Fatal(err)
	}
	competitions := make([]database.Competition, 3)
	for index := range competitions {
		competitions[index], err = database.PostCompetition(database.Competition{Title: "pagination", StartTime: time.Now().Add(time.Duration(index) * time.Hour), EndTime: time.Now().Add(time.Duration(index+1) * time.Hour)})
		if err != nil {
			t.Fatal(err)
		}
	}
	for _, competitionID := range []uint{competitions[0].ID, competitions[0].ID, competitions[1].ID} {
		if _, err := database.CreateParticipant(database.Participant{UserID: user.ID, CompetitionID: competitionID, Role: pkg.RoleToString(pkg.RUser), Status: "Approved"}); err != nil {
			t.Fatal(err)
		}
	}

	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.GET("/competition/current/:head/:tail", GetCurrentCompetitions)
	router.GET("/competition/user/:userid/:head/:tail", GetCompetitionsOfUser)

	for _, test := range []struct {
		path       string
		total      int
		expectedID uint
	}{
		{"/competition/current/0/0", initialTotal + 3, competitions[2].ID},
		{"/competition/user/" + strconv.FormatUint(uint64(user.ID), 10) + "/0/0", 2, competitions[1].ID},
	} {
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, httptest.NewRequest(http.MethodGet, test.path, nil))
		if recorder.Code != http.StatusOK {
			t.Fatalf("GET %s status = %d, want %d", test.path, recorder.Code, http.StatusOK)
		}
		if got := recorder.Header().Get("X-Total-Count"); got != strconv.Itoa(test.total) {
			t.Fatalf("GET %s X-Total-Count = %q, want %d", test.path, got, test.total)
		}
		var response []database.Competition
		if err := json.Unmarshal(recorder.Body.Bytes(), &response); err != nil {
			t.Fatal(err)
		}
		if len(response) != 1 {
			t.Fatalf("GET %s returned %d competitions, want one page item", test.path, len(response))
		}
		if response[0].ID != test.expectedID {
			t.Fatalf("GET %s returned competition %d, want %d", test.path, response[0].ID, test.expectedID)
		}
	}
}
