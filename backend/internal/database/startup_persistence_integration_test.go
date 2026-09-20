//go:build integration

package database

import (
	"fmt"
	"os"
	"testing"
	"time"

	"github.com/stretchr/testify/require"
)

// Server startup consumes process environment, while the testdb command alone
// consumes the separately-scoped ARCHERY_TEST_* variables.
func TestDatabaseInitialPreservesExistingCompetition(t *testing.T) {
	if os.Getenv("ARCHERY_MYSQL_INTEGRATION") != "1" {
		t.Fatal("integration tests require scripts/test.sh go-integration")
	}
	require.NoError(t, ResetTestDatabase("empty"))
	start := time.Date(2026, time.September, 13, 9, 0, 0, 0, time.UTC)
	competition, err := PostCompetition(Competition{Title: "startup persistence", StartTime: start, EndTime: start.Add(time.Hour)})
	require.NoError(t, err)
	require.NotZero(t, competition.ID)

	for _, mode := range []string{"development", "test", "production"} {
		t.Run(mode, func(t *testing.T) {
			app := integrationApp(t)
			app.Environment = mode
			require.NoError(t, DatabaseInitial(app))
			persisted, err := GetOnlyCompetition(competition.ID)
			require.NoError(t, err)
			require.Equal(t, competition.Title, persisted.Title, fmt.Sprintf("%s startup must not clear competitions", mode))
		})
	}
}
