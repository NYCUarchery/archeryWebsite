package migration

import (
	"bufio"
	"embed"
	"fmt"
	"strings"
)

//go:embed snapshots/v1_show_create.sql
var snapshots embed.FS

func expectedV1Creates() (map[string]string, error) {
	b, err := snapshots.ReadFile("snapshots/v1_show_create.sql")
	if err != nil {
		return nil, err
	}
	result := map[string]string{}
	s := bufio.NewScanner(strings.NewReader(string(b)))
	var table string
	var body []string
	flush := func() {
		if table != "" {
			result[table] = normalizeCreate(strings.Join(body, "\n"))
			table, body = "", nil
		}
	}
	for s.Scan() {
		line := s.Text()
		if strings.HasPrefix(line, "-- table: ") {
			flush()
			table = strings.TrimPrefix(line, "-- table: ")
			continue
		}
		if table != "" {
			body = append(body, line)
		}
	}
	flush()
	if err := s.Err(); err != nil {
		return nil, fmt.Errorf("read V1 snapshot: %w", err)
	}
	return result, nil
}

func stripAutoIncrement(value string) string {
	return autoIncrementOption.ReplaceAllString(value, "$1")
}
