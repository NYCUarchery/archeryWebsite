// Package migration owns the application's forward-only database schema.
package migration

import (
	"context"
	"database/sql"
	"embed"
	"errors"
	"fmt"
	"regexp"
	"strings"
	"time"

	"github.com/golang-migrate/migrate/v4"
	mysqlMigrate "github.com/golang-migrate/migrate/v4/database/mysql"
	"github.com/golang-migrate/migrate/v4/source/iofs"
)

const LatestVersion uint = 3
const DefaultStatementTimeout = 5 * time.Minute

const versionTable = "schema_migrations"
const advisoryLock = "archery_schema_migration"

//go:embed migrations/*.sql
var migrationFiles embed.FS

type VersionState struct {
	Managed bool
	Version uint
	Dirty   bool
	Empty   bool
}

// ReadVersion never creates schema_migrations, so it is safe for startup checks.
func ReadVersion(ctx context.Context, db *sql.DB) (VersionState, error) {
	return readVersion(ctx, db)
}

type rowQuerier interface {
	QueryRowContext(context.Context, string, ...any) *sql.Row
}

func readVersion(ctx context.Context, db rowQuerier) (VersionState, error) {
	var exists int
	if err := db.QueryRowContext(ctx, `SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = ?`, versionTable).Scan(&exists); err != nil {
		return VersionState{}, fmt.Errorf("inspect migration metadata: %w", err)
	}
	if exists == 0 {
		return VersionState{}, nil
	}
	if err := validateMetadataSchema(ctx, db); err != nil {
		return VersionState{}, err
	}
	var metadataRows int
	if err := db.QueryRowContext(ctx, `SELECT COUNT(*) FROM schema_migrations`).Scan(&metadataRows); err != nil {
		return VersionState{}, fmt.Errorf("count migration metadata: %w", err)
	}
	if metadataRows > 1 {
		return VersionState{}, errors.New("migration metadata is invalid: expected at most one row")
	}
	if metadataRows == 0 {
		return VersionState{Managed: true, Empty: true}, nil
	}
	var version uint
	var dirty bool
	err := db.QueryRowContext(ctx, `SELECT version, dirty FROM schema_migrations`).Scan(&version, &dirty)
	if errors.Is(err, sql.ErrNoRows) {
		return VersionState{Managed: true}, nil
	}
	if err != nil {
		return VersionState{}, fmt.Errorf("read migration metadata: %w", err)
	}
	return VersionState{Managed: true, Version: version, Dirty: dirty}, nil
}

func RequireCurrent(ctx context.Context, db *sql.DB) error {
	state, err := ReadVersion(ctx, db)
	if err != nil {
		return err
	}
	if !state.Managed {
		return errors.New("database is unmanaged; run ./migrate up or baseline")
	}
	if state.Dirty {
		return fmt.Errorf("database migration version %d is dirty; restore the pre-upgrade backup", state.Version)
	}
	if state.Version != LatestVersion {
		return fmt.Errorf("database schema is version %d; expected clean version %d; run ./migrate up", state.Version, LatestVersion)
	}
	return nil
}

func Up(ctx context.Context, db *sql.DB, target uint) error {
	return UpWithTimeout(ctx, db, target, DefaultStatementTimeout)
}

func UpWithTimeout(ctx context.Context, db *sql.DB, target uint, statementTimeout time.Duration) error {
	if target > LatestVersion {
		return fmt.Errorf("target version %d is newer than supported version %d", target, LatestVersion)
	}
	if statementTimeout <= 0 {
		return errors.New("statement timeout must be positive")
	}
	return withLock(ctx, db, func(conn *sql.Conn) error {
		state, err := readVersion(ctx, conn)
		if err != nil {
			return err
		}
		if state.Dirty {
			return fmt.Errorf("database migration version %d is dirty; restore the pre-upgrade backup", state.Version)
		}
		if state.Managed && state.Version > LatestVersion {
			return fmt.Errorf("database version %d is newer than this binary", state.Version)
		}
		if state.Managed && target != 0 && target < state.Version {
			return fmt.Errorf("downgrade from version %d to %d is not supported", state.Version, target)
		}
		if !state.Managed || state.Version == 0 {
			nonempty, err := hasUserTables(ctx, conn)
			if err != nil {
				return err
			}
			if nonempty {
				return errors.New("non-empty unmanaged database; verify it and run ./migrate baseline")
			}
		}
		m, err := newMigrator(ctx, conn, statementTimeout)
		if err != nil {
			return err
		}
		if target == 0 {
			err = m.Up()
		} else {
			err = m.Migrate(uint(target))
		}
		if errors.Is(err, migrate.ErrNoChange) {
			return nil
		}
		if err != nil {
			return fmt.Errorf("apply migration: %w", err)
		}
		return nil
	})
}

// Baseline validates an existing V1 schema then records it without executing DDL.
func Baseline(ctx context.Context, db *sql.DB) error {
	return withLock(ctx, db, func(conn *sql.Conn) error {
		state, err := readVersion(ctx, conn)
		if err != nil {
			return err
		}
		if state.Dirty {
			return fmt.Errorf("database migration version %d is dirty", state.Version)
		}
		if state.Managed {
			if state.Empty {
				if err := ValidateV1(ctx, conn); err != nil {
					return err
				}
				if _, err := conn.ExecContext(ctx, `INSERT INTO schema_migrations (version, dirty) VALUES (1, 0)`); err != nil {
					return fmt.Errorf("record recovered baseline: %w", err)
				}
				return nil
			}
			if state.Version == 1 {
				return ValidateV1(ctx, conn)
			}
			return fmt.Errorf("database is already managed at version %d", state.Version)
		}
		if err := ValidateV1(ctx, conn); err != nil {
			return err
		}
		if _, err := conn.ExecContext(ctx, `CREATE TABLE schema_migrations (version bigint NOT NULL PRIMARY KEY, dirty tinyint(1) NOT NULL) ENGINE=InnoDB`); err != nil {
			return fmt.Errorf("create migration metadata: %w", err)
		}
		if _, err := conn.ExecContext(ctx, `INSERT INTO schema_migrations (version, dirty) VALUES (1, 0)`); err != nil {
			return fmt.Errorf("record baseline: %w", err)
		}
		return nil
	})
}

func withLock(ctx context.Context, db *sql.DB, fn func(*sql.Conn) error) error {
	conn, err := db.Conn(ctx)
	if err != nil {
		return fmt.Errorf("pin migration lock connection: %w", err)
	}
	defer conn.Close()
	var acquired int
	if err := conn.QueryRowContext(ctx, `SELECT GET_LOCK(?, 30)`, advisoryLock).Scan(&acquired); err != nil {
		return fmt.Errorf("acquire migration lock: %w", err)
	}
	if acquired != 1 {
		return errors.New("could not acquire migration lock")
	}
	err = fn(conn)
	_, releaseErr := conn.ExecContext(context.Background(), `SELECT RELEASE_LOCK(?)`, advisoryLock)
	if err != nil {
		return err
	}
	return releaseErr
}

func hasUserTables(ctx context.Context, db rowQuerier) (bool, error) {
	var n int
	err := db.QueryRowContext(ctx, `
		SELECT
			(SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name <> ?)
			+ (SELECT COUNT(*) FROM information_schema.triggers WHERE trigger_schema = DATABASE())
			+ (SELECT COUNT(*) FROM information_schema.routines WHERE routine_schema = DATABASE())
			+ (SELECT COUNT(*) FROM information_schema.events WHERE event_schema = DATABASE())`, versionTable).Scan(&n)
	return n > 0, err
}

func newMigrator(ctx context.Context, conn *sql.Conn, statementTimeout time.Duration) (*migrate.Migrate, error) {
	source, err := iofs.New(migrationFiles, "migrations")
	if err != nil {
		return nil, err
	}
	driver, err := mysqlMigrate.WithConnection(ctx, conn, &mysqlMigrate.Config{NoLock: true, StatementTimeout: statementTimeout})
	if err != nil {
		return nil, err
	}
	return migrate.NewWithInstance("iofs", source, "mysql", driver)
}

func validateMetadataSchema(ctx context.Context, db rowQuerier) error {
	var validTable, primaryColumns int
	if err := db.QueryRowContext(ctx, `SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = ? AND table_type = 'BASE TABLE' AND engine = 'InnoDB'`, versionTable).Scan(&validTable); err != nil {
		return fmt.Errorf("inspect migration metadata table: %w", err)
	}
	if err := db.QueryRowContext(ctx, `SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = ? AND index_name = 'PRIMARY'`, versionTable).Scan(&primaryColumns); err != nil {
		return fmt.Errorf("inspect migration metadata primary key: %w", err)
	}
	var columnCount, expectedColumns int
	if err := db.QueryRowContext(ctx, `SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = ?`, versionTable).Scan(&columnCount); err != nil {
		return fmt.Errorf("inspect migration metadata: %w", err)
	}
	if err := db.QueryRowContext(ctx, `SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = ? AND ((column_name = 'version' AND column_type = 'bigint' AND is_nullable = 'NO' AND column_key = 'PRI') OR (column_name = 'dirty' AND column_type = 'tinyint(1)' AND is_nullable = 'NO'))`, versionTable).Scan(&expectedColumns); err != nil {
		return fmt.Errorf("inspect migration metadata: %w", err)
	}
	if validTable != 1 || primaryColumns != 1 || columnCount != 2 || expectedColumns != 2 {
		return errors.New("migration metadata has an invalid schema")
	}
	return nil
}

func normalizeCreate(sql string) string {
	sql = strings.ReplaceAll(sql, "\r\n", "\n")
	return strings.TrimSpace(sql)
}

var autoIncrementOption = regexp.MustCompile(`(?is)(\)\s*ENGINE=[^;]*?)\s+AUTO_INCREMENT=[0-9]+`)
