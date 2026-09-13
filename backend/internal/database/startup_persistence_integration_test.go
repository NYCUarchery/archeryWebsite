//go:build integration

package database

import (
	"fmt"
	"os"
	"path/filepath"
	"testing"
	"time"

	"github.com/stretchr/testify/require"
)

// Server startup reads config/db.yaml relative to /app. The integration
// runner mounts its generated config there; chdir makes this test exercise the
// same normal initializer rather than the explicit testdb-only configuration.
func TestSetupDatabaseByModePreservesExistingCompetition(t *testing.T) {
	if os.Getenv("ARCHERY_MYSQL_INTEGRATION") != "1" {
		t.Fatal("integration tests require scripts/test.sh go-integration")
	}
	workingDirectory, err := os.Getwd()
	require.NoError(t, err)
	backendRoot := filepath.Clean(filepath.Join(workingDirectory, "../.."))
	require.NoError(t, os.Chdir(backendRoot))
	t.Cleanup(func() { require.NoError(t, os.Chdir(workingDirectory)) })
	require.FileExists(t, filepath.Join("config", "db.yaml"), "runner must mount its generated /app/config")

	require.NoError(t, ResetTestDatabase("empty"))
	start := time.Date(2026, time.September, 13, 9, 0, 0, 0, time.UTC)
	competition, err := PostCompetition(Competition{Title: "startup persistence", StartTime: start, EndTime: start.Add(time.Hour)})
	require.NoError(t, err)
	require.NotZero(t, competition.ID)

	for _, mode := range []string{"dev", "test", "release"} {
		t.Run(mode, func(t *testing.T) {
			SetupDatabaseByMode(mode)
			persisted, err := GetOnlyCompetition(competition.ID)
			require.NoError(t, err)
			require.Equal(t, competition.Title, persisted.Title, fmt.Sprintf("%s startup must not clear competitions", mode))
		})
	}
}
