//go:build integration

package database

import (
	"database/sql"
	"os"
	"sort"
	"testing"

	"github.com/stretchr/testify/require"
)

func TestInitializersRejectNonCurrentMigrationStateWithoutSchemaRepair(t *testing.T) {
	if os.Getenv("ARCHERY_MYSQL_INTEGRATION") != "1" {
		t.Fatal("integration tests require scripts/test.sh go-integration")
	}

	cases := []struct {
		name  string
		setup func(t *testing.T, db *sql.DB)
		check func(t *testing.T, db *sql.DB)
	}{
		{
			name: "missing metadata",
			setup: func(t *testing.T, db *sql.DB) {
				t.Helper()
				_, err := db.Exec("DROP TABLE schema_migrations")
				require.NoError(t, err)
			},
			check: func(t *testing.T, db *sql.DB) {
				t.Helper()
				require.False(t, sqlTableExists(t, db, "schema_migrations"))
			},
		},
		{
			name: "version one",
			setup: func(t *testing.T, db *sql.DB) {
				t.Helper()
				_, err := db.Exec("UPDATE schema_migrations SET version = 1, dirty = FALSE")
				require.NoError(t, err)
			},
			check: func(t *testing.T, db *sql.DB) {
				t.Helper()
				assertMigrationVersion(t, db, 1, false)
			},
		},
		{
			name: "dirty version two",
			setup: func(t *testing.T, db *sql.DB) {
				t.Helper()
				_, err := db.Exec("UPDATE schema_migrations SET version = 2, dirty = TRUE")
				require.NoError(t, err)
			},
			check: func(t *testing.T, db *sql.DB) {
				t.Helper()
				assertMigrationVersion(t, db, 2, true)
			},
		},
		{
			name: "ahead version",
			setup: func(t *testing.T, db *sql.DB) {
				t.Helper()
				_, err := db.Exec("UPDATE schema_migrations SET version = 3, dirty = FALSE")
				require.NoError(t, err)
			},
			check: func(t *testing.T, db *sql.DB) {
				t.Helper()
				assertMigrationVersion(t, db, 3, false)
			},
		},
	}

	for _, testCase := range cases {
		t.Run(testCase.name, func(t *testing.T) {
			require.NoError(t, ResetTestDatabase("empty"))
			sqlDB, err := DB.DB()
			require.NoError(t, err)
			testCase.setup(t, sqlDB)
			before := showCreates(t, sqlDB)

			serverErr := DatabaseInitial(integrationApp(t))
			require.Error(t, serverErr)
			require.Contains(t, serverErr.Error(), "database schema is not current")
			testCase.check(t, currentSQLDB(t))
			require.Equal(t, before, showCreates(t, currentSQLDB(t)), "server startup must not repair schema")
			assertNoStartupRows(t)

			seederErr := DatabaseInitialForSeeder(integrationApp(t))
			require.Error(t, seederErr)
			require.Contains(t, seederErr.Error(), "database schema is not current")
			testCase.check(t, currentSQLDB(t))
			require.Equal(t, before, showCreates(t, currentSQLDB(t)), "seeder startup must not repair schema")
			assertNoStartupRows(t)
		})
	}
}

func currentSQLDB(t *testing.T) *sql.DB {
	t.Helper()
	sqlDB, err := DB.DB()
	require.NoError(t, err)
	return sqlDB
}

func assertMigrationVersion(t *testing.T, db *sql.DB, expectedVersion uint, expectedDirty bool) {
	t.Helper()
	var version uint
	var dirty bool
	require.NoError(t, db.QueryRow("SELECT version, dirty FROM schema_migrations").Scan(&version, &dirty))
	require.Equal(t, expectedVersion, version)
	require.Equal(t, expectedDirty, dirty)
}

func sqlTableExists(t *testing.T, db *sql.DB, table string) bool {
	t.Helper()
	var count int
	require.NoError(t, db.QueryRow(`SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = ?`, table).Scan(&count))
	return count == 1
}

func showCreates(t *testing.T, db *sql.DB) map[string]string {
	t.Helper()
	rows, err := db.Query(`SELECT table_name FROM information_schema.tables WHERE table_schema = DATABASE() AND table_type = 'BASE TABLE' ORDER BY table_name`)
	require.NoError(t, err)
	defer rows.Close()
	var tables []string
	for rows.Next() {
		var table string
		require.NoError(t, rows.Scan(&table))
		tables = append(tables, table)
	}
	require.NoError(t, rows.Err())
	sort.Strings(tables)
	creates := make(map[string]string, len(tables))
	for _, table := range tables {
		var name, create string
		require.NoError(t, db.QueryRow("SHOW CREATE TABLE `"+table+"`").Scan(&name, &create))
		creates[table] = create
	}
	return creates
}

func assertNoStartupRows(t *testing.T) {
	t.Helper()
	var institutionCount int64
	require.NoError(t, DB.Table("institutions").Count(&institutionCount).Error)
	require.Equal(t, int64(0), institutionCount, "startup must not run initialization DML after migration validation fails")
}
