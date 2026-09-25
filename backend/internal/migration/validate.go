package migration

import (
	"context"
	"database/sql"
	"fmt"
	"maps"
	"slices"
	"sort"
)

// ValidateV1 compares complete CREATE TABLE definitions while deliberately
// ignoring production auto-increment counters.  The checked-in snapshot is
// produced from V1 on MySQL 8.4 and includes columns, defaults, keys, foreign
// keys, engine, charset and collation.
type schemaQuerier interface {
	rowQuerier
	QueryContext(context.Context, string, ...any) (*sql.Rows, error)
}

func ValidateV1(ctx context.Context, db schemaQuerier) error {
	expected, err := expectedV1Creates()
	if err != nil {
		return err
	}
	expectedTables := slices.Sorted(maps.Keys(expected))
	for _, table := range expectedTables {
		var name, create string
		if err := db.QueryRowContext(ctx, "SHOW CREATE TABLE `"+table+"`").Scan(&name, &create); err != nil {
			return fmt.Errorf("baseline V1 missing or unreadable table %q: %w", table, err)
		}
		if normalizeCreate(stripAutoIncrement(create)) != expected[table] {
			return fmt.Errorf("baseline V1 schema mismatch for table %q", table)
		}
	}
	var tables []string
	rows, err := db.QueryContext(ctx, `SELECT table_name FROM information_schema.tables WHERE table_schema = DATABASE() AND table_type='BASE TABLE' AND table_name <> ?`, versionTable)
	if err != nil {
		return err
	}
	defer rows.Close()
	for rows.Next() {
		var t string
		if err := rows.Scan(&t); err != nil {
			return err
		}
		tables = append(tables, t)
	}
	if err := rows.Err(); err != nil {
		return err
	}
	sort.Strings(tables)
	if !slices.Equal(tables, expectedTables) {
		return fmt.Errorf("baseline V1 table set mismatch: got %v", tables)
	}
	for _, query := range []string{
		`SELECT COUNT(*) FROM information_schema.views WHERE table_schema = DATABASE()`,
		`SELECT COUNT(*) FROM information_schema.triggers WHERE trigger_schema = DATABASE()`,
		`SELECT COUNT(*) FROM information_schema.routines WHERE routine_schema = DATABASE()`,
		`SELECT COUNT(*) FROM information_schema.events WHERE event_schema = DATABASE()`,
	} {
		var count int
		if err := db.QueryRowContext(ctx, query).Scan(&count); err != nil {
			return err
		}
		if count != 0 {
			return fmt.Errorf("baseline V1 schema contains unsupported extra object")
		}
	}
	return nil
}
