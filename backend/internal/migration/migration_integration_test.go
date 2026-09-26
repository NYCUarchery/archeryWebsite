//go:build integration

package migration_test

import (
	"backend/internal/config"
	"backend/internal/database"
	"backend/internal/migration"
	"context"
	"database/sql"
	"fmt"
	"os"
	"strings"
	"sync"
	"testing"
	"time"

	_ "github.com/go-sql-driver/mysql"
	"github.com/stretchr/testify/require"
)

const migrationLockName = "archery_schema_migration"

func TestMigrationIntegration(t *testing.T) {
	if os.Getenv("ARCHERY_MYSQL_INTEGRATION") != "1" {
		t.Fatal("integration tests require scripts/test.sh go-integration")
	}

	t.Run("fresh V1 validates", func(t *testing.T) {
		db := migrationTestDB(t)
		db.SetMaxOpenConns(1)
		resetMigrationSchema(t, db)
		state, err := migration.ReadVersion(context.Background(), db)
		require.NoError(t, err)
		require.False(t, state.Managed)
		require.False(t, hasTable(t, db, "schema_migrations"), "version must remain read-only")
		require.NoError(t, migration.Up(context.Background(), db, 1))
		require.NoError(t, migration.ValidateV1(context.Background(), db))
		state, err = migration.ReadVersion(context.Background(), db)
		require.NoError(t, err)
		require.Equal(t, uint(1), state.Version)
		require.False(t, state.Dirty)
	})

	t.Run("production starts with V1 without migrating", func(t *testing.T) {
		db := migrationTestDB(t)
		resetMigrationSchema(t, db)
		require.NoError(t, migration.Up(context.Background(), db, 1))
		testConfig, err := database.LoadTestDatabaseConfig()
		require.NoError(t, err)
		app := config.App{
			Environment: "production",
			Database:    config.Database{Host: testConfig.Host, Port: testConfig.Port, Name: testConfig.Database, User: testConfig.Username, Password: testConfig.Password},
			SessionKey:  strings.Repeat("s", 32),
			Dictator:    config.Dictator{Username: "migration-admin", Password: "migration-password", Email: "migration@example.test"},
		}
		require.NoError(t, database.DatabaseInitial(app))
		state, err := migration.ReadVersion(context.Background(), db)
		require.NoError(t, err)
		require.Equal(t, uint(1), state.Version)
		require.False(t, state.Dirty)
		require.NoError(t, migration.ValidateV1(context.Background(), db), "production startup must not change V1 schema")
		var count int
		require.NoError(t, db.QueryRow(`SELECT COUNT(*) FROM users WHERE user_name = 'migration-admin'`).Scan(&count))
		require.Equal(t, 1, count)
		app.Environment = "development"
		require.ErrorContains(t, database.DatabaseInitial(app), "database schema is not current")
		app.Environment = "production"
		_, err = db.Exec(`UPDATE schema_migrations SET dirty = TRUE`)
		require.NoError(t, err)
		require.NoError(t, database.DatabaseInitial(app), "production does not exit solely for dirty migration metadata")
		state, err = migration.ReadVersion(context.Background(), db)
		require.NoError(t, err)
		require.True(t, state.Dirty, "startup must not change migration metadata")

		_, err = db.Exec(`DROP TABLE schema_migrations`)
		require.NoError(t, err)
		require.NoError(t, database.DatabaseInitial(app), "validated unmanaged V1 should still serve")
		require.False(t, hasTable(t, db, "schema_migrations"), "startup must not baseline")
		require.NoError(t, migration.ValidateV1(context.Background(), db))
		_, err = db.Exec(`ALTER TABLE institutions ADD COLUMN unexpected bigint`)
		require.NoError(t, err)
		require.NoError(t, database.DatabaseInitial(app), "production does not exit solely for unknown schema")
		require.ErrorContains(t, migration.ValidateV1(context.Background(), db), "schema mismatch")
	})

	t.Run("fresh V3 equals baselined V1 upgraded to V3", func(t *testing.T) {
		db := migrationTestDB(t)
		resetMigrationSchema(t, db)
		require.NoError(t, migration.Up(context.Background(), db, 0))
		fresh := schemaSignature(t, db)

		resetMigrationSchema(t, db)
		require.NoError(t, migration.Up(context.Background(), db, 1))
		_, err := db.Exec(`DROP TABLE schema_migrations`)
		require.NoError(t, err)
		require.NoError(t, migration.Baseline(context.Background(), db))
		require.NoError(t, migration.Baseline(context.Background(), db), "repeat baseline validates without rerunning DDL")
		require.NoError(t, migration.Up(context.Background(), db, 0))
		require.Equal(t, fresh, schemaSignature(t, db))
	})

	t.Run("V3 makes user email nullable while preserving unique non-null email", func(t *testing.T) {
		db := migrationTestDB(t)
		resetMigrationSchema(t, db)
		require.NoError(t, migration.Up(context.Background(), db, 2))
		_, err := db.Exec(`INSERT INTO users (role, user_name, password, email) VALUES ('User', 'existing-email', 'password', 'existing@example.test')`)
		require.NoError(t, err)
		require.NoError(t, migration.Up(context.Background(), db, 3))

		var nullable string
		require.NoError(t, db.QueryRow(`SELECT is_nullable FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'users' AND column_name = 'email'`).Scan(&nullable))
		require.Equal(t, "YES", nullable)
		var existing sql.NullString
		require.NoError(t, db.QueryRow(`SELECT email FROM users WHERE user_name = 'existing-email'`).Scan(&existing))
		require.True(t, existing.Valid)
		require.Equal(t, "existing@example.test", existing.String)

		for _, username := range []string{"empty-email-one", "empty-email-two"} {
			_, err = db.Exec(`INSERT INTO users (role, user_name, password) VALUES ('User', ?, 'password')`, username)
			require.NoError(t, err)
		}
		_, err = db.Exec(`INSERT INTO users (role, user_name, password, email) VALUES ('User', 'duplicate-email', 'password', 'existing@example.test')`)
		require.Error(t, err, "unique index must still reject duplicate non-null email")
		state, err := migration.ReadVersion(context.Background(), db)
		require.NoError(t, err)
		require.Equal(t, uint(3), state.Version)
		require.False(t, state.Dirty)
	})

	t.Run("V2 preserves records except removed total points", func(t *testing.T) {
		db := migrationTestDB(t)
		resetMigrationSchema(t, db)
		require.NoError(t, migration.Up(context.Background(), db, 1))
		seedV1MatchResult(t, db)
		require.NoError(t, migration.Baseline(context.Background(), db))
		require.NoError(t, migration.Up(context.Background(), db, 2))

		var teamSize, total int
		require.NoError(t, db.QueryRow(`SELECT team_size FROM eliminations WHERE id = 1`).Scan(&teamSize))
		require.NoError(t, db.QueryRow(`SELECT shoot_off_score FROM match_results WHERE id = 1`).Scan(&total))
		require.Equal(t, 1, teamSize)
		require.Equal(t, 17, total)
		var target sql.NullString
		require.NoError(t, db.QueryRow(`SELECT target FROM match_results WHERE id = 1`).Scan(&target))
		require.False(t, target.Valid)
		assertColumnAbsent(t, db, "match_results", "total_points")
		var seed sql.NullInt64
		require.NoError(t, db.QueryRow(`SELECT bracket_seed_count FROM eliminations WHERE id = 1`).Scan(&seed))
		require.False(t, seed.Valid, "V1 NULL remains the Go zero-value legacy sentinel")
	})

	t.Run("baseline safely resumes after metadata creation interrupted", func(t *testing.T) {
		db := migrationTestDB(t)
		resetMigrationSchema(t, db)
		require.NoError(t, migration.Up(context.Background(), db, 1))
		_, err := db.Exec(`DELETE FROM schema_migrations`)
		require.NoError(t, err)
		require.NoError(t, migration.Baseline(context.Background(), db))
		state, err := migration.ReadVersion(context.Background(), db)
		require.NoError(t, err)
		require.Equal(t, uint(1), state.Version)
		require.False(t, state.Dirty)

		_, err = db.Exec(`UPDATE schema_migrations SET version = 0`)
		require.NoError(t, err)
		require.Error(t, migration.Baseline(context.Background(), db), "an existing version zero row is not an interrupted empty table")
		_, err = db.Exec(`DELETE FROM schema_migrations; ALTER TABLE schema_migrations ADD COLUMN unexpected bigint`)
		require.NoError(t, err)
		require.Error(t, migration.Baseline(context.Background(), db), "malformed empty metadata must not be adopted")
	})

	t.Run("fresh upgrade resumes after metadata creation interrupted", func(t *testing.T) {
		db := migrationTestDB(t)
		resetMigrationSchema(t, db)
		_, err := db.Exec(`CREATE TABLE schema_migrations (version bigint NOT NULL PRIMARY KEY, dirty tinyint(1) NOT NULL) ENGINE=InnoDB`)
		require.NoError(t, err)
		require.NoError(t, migration.Up(context.Background(), db, 0))
		require.NoError(t, migration.RequireCurrent(context.Background(), db))
	})

	t.Run("unmanaged nonempty is rejected", func(t *testing.T) {
		db := migrationTestDB(t)
		resetMigrationSchema(t, db)
		_, err := db.Exec(`CREATE TABLE unmanaged_probe (id bigint PRIMARY KEY) ENGINE=InnoDB`)
		require.NoError(t, err)
		err = migration.Up(context.Background(), db, 0)
		require.ErrorContains(t, err, "non-empty unmanaged")
		require.False(t, hasTable(t, db, "schema_migrations"))
	})

	t.Run("view-only unmanaged database is not empty", func(t *testing.T) {
		db := migrationTestDB(t)
		resetMigrationSchema(t, db)
		_, err := db.Exec(`CREATE VIEW migration_probe AS SELECT 1 AS value`)
		require.NoError(t, err)
		t.Cleanup(func() { _, err := db.Exec(`DROP VIEW migration_probe`); require.NoError(t, err) })
		require.ErrorContains(t, migration.Up(context.Background(), db, 0), "non-empty unmanaged")
		require.False(t, hasTable(t, db, "schema_migrations"))
	})

	t.Run("baseline rejects extra schema objects without recording a version", func(t *testing.T) {
		db := migrationTestDB(t)
		resetMigrationSchema(t, db)
		require.NoError(t, migration.Up(context.Background(), db, 1))
		_, err := db.Exec(`DROP TABLE schema_migrations`)
		require.NoError(t, err)
		for _, probe := range []struct{ create, drop string }{
			{`CREATE VIEW migration_probe AS SELECT 1 AS value`, `DROP VIEW migration_probe`},
			{`CREATE TRIGGER migration_probe BEFORE INSERT ON institutions FOR EACH ROW SET NEW.name = 'probe'`, `DROP TRIGGER migration_probe`},
			{`CREATE PROCEDURE migration_probe() SELECT 1`, `DROP PROCEDURE migration_probe`},
			{`CREATE EVENT migration_probe ON SCHEDULE EVERY 1 DAY DISABLE DO SELECT 1`, `DROP EVENT migration_probe`},
		} {
			_, err := db.Exec(probe.create)
			require.NoError(t, err)
			err = migration.Baseline(context.Background(), db)
			_, cleanupErr := db.Exec(probe.drop)
			require.NoError(t, cleanupErr)
			require.ErrorContains(t, err, "extra object")
			require.False(t, hasTable(t, db, "schema_migrations"))
		}
	})

	t.Run("baseline rejects changed default after canonical SHOW CREATE", func(t *testing.T) {
		db := migrationTestDB(t)
		resetMigrationSchema(t, db)
		require.NoError(t, migration.Up(context.Background(), db, 1))
		require.NoError(t, migration.ValidateV1(context.Background(), db), "server canonicalizes harmless DDL whitespace")
		_, err := db.Exec(`ALTER TABLE eliminations ALTER COLUMN team_size SET DEFAULT 7`)
		require.NoError(t, err)
		_, err = db.Exec(`DROP TABLE schema_migrations`)
		require.NoError(t, err)
		require.ErrorContains(t, migration.Baseline(context.Background(), db), "schema mismatch")
		require.False(t, hasTable(t, db, "schema_migrations"))
	})

	t.Run("failed V2 leaves dirty state and retry downgrade and ahead versions are rejected", func(t *testing.T) {
		db := migrationTestDB(t)
		resetMigrationSchema(t, db)
		require.NoError(t, migration.Up(context.Background(), db, 1))
		_, err := db.Exec(`ALTER TABLE match_results ADD COLUMN target char(1) NULL`)
		require.NoError(t, err)
		err = migration.Up(context.Background(), db, 2)
		require.Error(t, err)
		state, readErr := migration.ReadVersion(context.Background(), db)
		require.NoError(t, readErr)
		require.Equal(t, uint(2), state.Version)
		require.True(t, state.Dirty)
		assertColumnPresent(t, db, "eliminations", "bracket_seed_count")
		require.ErrorContains(t, migration.Up(context.Background(), db, 0), "dirty")

		resetMigrationSchema(t, db)
		require.NoError(t, migration.Up(context.Background(), db, 0))
		require.ErrorContains(t, migration.Up(context.Background(), db, 1), "downgrade")
		_, err = db.Exec(`UPDATE schema_migrations SET version = 4, dirty = 0`)
		require.NoError(t, err)
		require.ErrorContains(t, migration.Up(context.Background(), db, 0), "newer than this binary")
	})

	t.Run("multiple metadata rows cannot hide a dirty version", func(t *testing.T) {
		db := migrationTestDB(t)
		resetMigrationSchema(t, db)
		require.NoError(t, migration.Up(context.Background(), db, 0))
		_, err := db.Exec(`INSERT INTO schema_migrations (version, dirty) VALUES (1, 1)`)
		require.NoError(t, err)
		_, err = migration.ReadVersion(context.Background(), db)
		require.Error(t, err)
		require.Error(t, migration.RequireCurrent(context.Background(), db))
		require.Error(t, migration.Up(context.Background(), db, 0))
	})

	t.Run("blocked DDL times out and leaves dirty state with a usable pool", func(t *testing.T) {
		db := migrationTestDB(t)
		resetMigrationSchema(t, db)
		require.NoError(t, migration.Up(context.Background(), db, 1))
		tx, err := db.Begin()
		require.NoError(t, err)
		defer tx.Rollback()
		var count int
		require.NoError(t, tx.QueryRow(`SELECT COUNT(*) FROM eliminations`).Scan(&count))
		started := time.Now()
		err = migration.UpWithTimeout(context.Background(), db, 2, 100*time.Millisecond)
		require.Error(t, err)
		require.Less(t, time.Since(started), 5*time.Second, "driver timeout must interrupt blocked migration SQL")
		require.NoError(t, tx.Rollback())
		state, err := migration.ReadVersion(context.Background(), db)
		require.NoError(t, err)
		require.Equal(t, uint(2), state.Version)
		require.True(t, state.Dirty)
		require.ErrorContains(t, migration.Up(context.Background(), db, 0), "dirty")
		// A separate pool cannot reuse the lock owner's session: GET_LOCK is
		// reentrant on one session and would otherwise allow a false positive.
		observer := migrationTestDB(t)
		conn, err := observer.Conn(context.Background())
		require.NoError(t, err)
		defer conn.Close()
		var acquired int
		require.NoError(t, conn.QueryRowContext(context.Background(), `SELECT GET_LOCK(?, 5)`, migrationLockName).Scan(&acquired))
		require.Equal(t, 1, acquired, "timed-out migration must release its session lock")
		_, err = conn.ExecContext(context.Background(), `SELECT RELEASE_LOCK(?)`, migrationLockName)
		require.NoError(t, err)
	})

	t.Run("repeat and concurrent up are no change", func(t *testing.T) {
		db := migrationTestDB(t)
		resetMigrationSchema(t, db)
		require.NoError(t, migration.Up(context.Background(), db, 0))
		before := schemaSignature(t, db)
		require.NoError(t, migration.Up(context.Background(), db, 0))
		require.Equal(t, before, schemaSignature(t, db))
		resetMigrationSchema(t, db)

		var group sync.WaitGroup
		errs := make(chan error, 2)
		for range 2 {
			group.Add(1)
			go func() { defer group.Done(); errs <- migration.Up(context.Background(), db, 0) }()
		}
		group.Wait()
		close(errs)
		for err := range errs {
			require.NoError(t, err)
		}
		require.Equal(t, before, schemaSignature(t, db), "two concurrent fresh upgrades apply each version once")
	})

	t.Run("shared advisory lock blocks migration", func(t *testing.T) {
		db := migrationTestDB(t)
		resetMigrationSchema(t, db)
		conn, err := db.Conn(context.Background())
		require.NoError(t, err)
		defer conn.Close()
		var acquired int
		require.NoError(t, conn.QueryRowContext(context.Background(), `SELECT GET_LOCK(?, 0)`, migrationLockName).Scan(&acquired))
		require.Equal(t, 1, acquired)
		defer conn.ExecContext(context.Background(), `SELECT RELEASE_LOCK(?)`, migrationLockName)
		ctx, cancel := context.WithTimeout(context.Background(), 100*time.Millisecond)
		defer cancel()
		require.Error(t, migration.Up(ctx, db, 0))
		baselineCtx, baselineCancel := context.WithTimeout(context.Background(), 100*time.Millisecond)
		defer baselineCancel()
		require.ErrorContains(t, migration.Baseline(baselineCtx, db), "acquire migration lock")
	})

	t.Run("V2 target check SET NULL FK and composite join key", func(t *testing.T) {
		db := migrationTestDB(t)
		resetMigrationSchema(t, db)
		require.NoError(t, migration.Up(context.Background(), db, 0))
		seedV2MatchResult(t, db)
		for _, invalid := range []string{"Z", "a", "b", ""} {
			_, err := db.Exec(`INSERT INTO match_results (id, match_id, target) VALUES (2, 1, ?)`, invalid)
			require.ErrorContains(t, err, "Check constraint", "target %q must fail the CHECK", invalid)
		}
		_, err := db.Exec(`INSERT INTO match_results (id, match_id, target) VALUES (2, 1, 'B'), (3, 1, NULL)`)
		require.NoError(t, err)
		_, err = db.Exec(`DELETE FROM player_sets WHERE id = 1`)
		require.NoError(t, err)
		var playerSet sql.NullInt64
		require.NoError(t, db.QueryRow(`SELECT player_set_id FROM match_results WHERE id = 1`).Scan(&playerSet))
		require.False(t, playerSet.Valid)
		assertColumnAbsent(t, db, "player_set_match_tables", "id")
		var count int
		require.NoError(t, db.QueryRow(`SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'player_set_match_tables' AND index_name = 'PRIMARY' AND seq_in_index = 1 AND column_name = 'player_set_id'`).Scan(&count))
		require.Equal(t, 1, count)
		require.NoError(t, db.QueryRow(`SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'player_set_match_tables' AND index_name = 'PRIMARY' AND seq_in_index = 2 AND column_name = 'player_id'`).Scan(&count))
		require.Equal(t, 1, count)
		_, err = db.Exec(`INSERT INTO players (id) VALUES (1)`)
		require.NoError(t, err)
		_, err = db.Exec(`INSERT INTO player_sets (id, elimination_id) VALUES (2, 1)`)
		require.NoError(t, err)
		_, err = db.Exec(`INSERT INTO player_set_match_tables (player_set_id, player_id) VALUES (2, 1)`)
		require.NoError(t, err)
		_, err = db.Exec(`INSERT INTO player_set_match_tables (player_set_id, player_id) VALUES (2, 1)`)
		require.ErrorContains(t, err, "Duplicate entry")
	})
}

func migrationTestDB(t *testing.T) *sql.DB {
	t.Helper()
	config, err := database.LoadTestDatabaseConfig()
	require.NoError(t, err)
	dsn := fmt.Sprintf("%s:%s@tcp(%s:%d)/%s?charset=utf8mb4&parseTime=true&multiStatements=true", config.Username, config.Password, config.Host, config.Port, config.Database)
	db, err := sql.Open("mysql", dsn)
	require.NoError(t, err)
	require.NoError(t, db.Ping())
	t.Cleanup(func() { require.NoError(t, db.Close()) })
	return db
}

func resetMigrationSchema(t *testing.T, db *sql.DB) {
	t.Helper()
	for _, table := range []string{"match_scores", "round_scores", "match_ends", "round_ends", "match_results", "matches", "stages", "player_set_match_tables", "player_sets", "medals", "rounds", "players", "lanes", "qualifications", "groups", "participants", "eliminations", "competitions", "users", "institutions", "unmanaged_probe", "schema_migrations"} {
		_, err := db.Exec("DROP TABLE IF EXISTS `" + table + "`")
		require.NoError(t, err)
	}
}

func seedV1MatchResult(t *testing.T, db *sql.DB) {
	t.Helper()
	for _, statement := range []string{
		`INSERT INTO eliminations (id, team_size) VALUES (1, 1)`,
		"INSERT INTO player_sets (id, elimination_id, total_score, `rank`) VALUES (1, 1, 42, 1)",
		`INSERT INTO stages (id, elimination_id) VALUES (1, 1)`,
		`INSERT INTO matches (id, stage_id) VALUES (1, 1)`,
		`INSERT INTO match_results (id, match_id, player_set_id, total_points, shoot_off_score, is_winner, lane_number) VALUES (1, 1, 1, 9, 17, 1, 3)`,
	} {
		_, err := db.Exec(statement)
		require.NoError(t, err)
	}
}

func seedV2MatchResult(t *testing.T, db *sql.DB) {
	t.Helper()
	for _, statement := range []string{
		`INSERT INTO eliminations (id, team_size) VALUES (1, 1)`,
		"INSERT INTO player_sets (id, elimination_id, total_score, `rank`) VALUES (1, 1, 42, 1)",
		`INSERT INTO stages (id, elimination_id) VALUES (1, 1)`,
		`INSERT INTO matches (id, stage_id) VALUES (1, 1)`,
		`INSERT INTO match_results (id, match_id, player_set_id, target, shoot_off_score, is_winner, lane_number) VALUES (1, 1, 1, 'A', 17, 1, 3)`,
	} {
		_, err := db.Exec(statement)
		require.NoError(t, err)
	}
}

func schemaSignature(t *testing.T, db *sql.DB) string {
	t.Helper()
	rows, err := db.Query(`SELECT table_name FROM information_schema.tables WHERE table_schema = DATABASE() AND table_type = 'BASE TABLE' ORDER BY table_name`)
	require.NoError(t, err)
	defer rows.Close()
	var parts []string
	for rows.Next() {
		var table string
		require.NoError(t, rows.Scan(&table))
		var name, create string
		require.NoError(t, db.QueryRow("SHOW CREATE TABLE `"+table+"`").Scan(&name, &create))
		parts = append(parts, table+":"+strings.ReplaceAll(create, "AUTO_INCREMENT=1 ", ""))
	}
	require.NoError(t, rows.Err())
	return strings.Join(parts, "\n")
}

func hasTable(t *testing.T, db *sql.DB, table string) bool {
	t.Helper()
	var n int
	require.NoError(t, db.QueryRow(`SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = ?`, table).Scan(&n))
	return n == 1
}

func assertColumnAbsent(t *testing.T, db *sql.DB, table, column string) {
	t.Helper()
	var n int
	require.NoError(t, db.QueryRow(`SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ?`, table, column).Scan(&n))
	require.Zero(t, n)
}

func assertColumnPresent(t *testing.T, db *sql.DB, table, column string) {
	t.Helper()
	var n int
	require.NoError(t, db.QueryRow(`SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ?`, table, column).Scan(&n))
	require.Equal(t, 1, n)
}
