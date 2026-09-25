package main

import (
	"backend/internal/config"
	"testing"
	"time"

	mysqlDriver "github.com/go-sql-driver/mysql"
)

func TestValidateDatabaseNeedsOnlyDatabaseSettings(t *testing.T) {
	cfg := config.Database{Host: "mysql", Port: 3306, Name: "archery", User: "migrator", Password: "secret"}
	if err := validateDatabase(cfg); err != nil {
		t.Fatalf("validateDatabase(): %v", err)
	}
}

func TestBuildDSNEscapesSpecialPasswordAndKeepsTransportSettings(t *testing.T) {
	got, err := mysqlDriver.ParseDSN(buildDSN(config.Database{Host: "mysql", Port: 3306, Name: "archery", User: "name", Password: "p@ss:/?& word"}))
	if err != nil {
		t.Fatal(err)
	}
	if got.Passwd != "p@ss:/?& word" {
		t.Fatalf("password = %q", got.Passwd)
	}
	if got.TLSConfig != "skip-verify" || got.Timeout != 10*time.Second || !got.MultiStatements {
		t.Fatalf("migration DSN lost TLS, timeout, or multiStatements: %#v", got)
	}
}
