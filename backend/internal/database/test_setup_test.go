package database

import (
	"os"
	"path/filepath"
	"testing"
)

func TestTestDatabaseConfigValidate(t *testing.T) {
	valid := TestDatabaseConfig{
		Username: "archery_test", Password: "test-password", Host: "mysql", Port: 3306,
		Database: "archery_test_run_123", Mode: "test", TestRunID: "run_123",
	}
	if err := valid.Validate(); err != nil {
		t.Fatalf("valid runner config rejected: %v", err)
	}

	for name, mutate := range map[string]func(*TestDatabaseConfig){
		"mode":         func(c *TestDatabaseConfig) { c.Mode = "dev" },
		"host":         func(c *TestDatabaseConfig) { c.Host = "127.0.0.1" },
		"database":     func(c *TestDatabaseConfig) { c.Database = "testdb" },
		"run mismatch": func(c *TestDatabaseConfig) { c.TestRunID = "other" },
		"empty run":    func(c *TestDatabaseConfig) { c.TestRunID = "" },
		"port":         func(c *TestDatabaseConfig) { c.Port = 3307 },
		"credentials":  func(c *TestDatabaseConfig) { c.Password = "" },
		"root user":    func(c *TestDatabaseConfig) { c.Username = "root" },
	} {
		t.Run(name, func(t *testing.T) {
			config := valid
			mutate(&config)
			if err := config.Validate(); err == nil {
				t.Fatal("unsafe test config was accepted")
			}
		})
	}
}

func TestLoadTestDatabaseConfigRequiresRunner(t *testing.T) {
	t.Setenv(TestConfigPathEnv, "")
	if _, err := LoadTestDatabaseConfig(); err == nil {
		t.Fatal("missing runner config must fail, not use development config")
	}
	configPath := filepath.Join(t.TempDir(), "db.yaml")
	config := "username: archery_test\npassword: disposable\nhost: mysql\nport: 3306\ndatabase: archery_test_run_123\nmode: test\ntest_run_id: run_123\n"
	if err := os.WriteFile(configPath, []byte(config), 0600); err != nil {
		t.Fatal(err)
	}
	t.Setenv(TestConfigPathEnv, configPath)
	for _, runID := range []string{"", "another_run"} {
		t.Setenv("ARCHERY_TEST_RUN_ID", runID)
		if _, err := LoadTestDatabaseConfig(); err == nil {
			t.Fatalf("runner mismatch %q accepted", runID)
		}
	}
	t.Setenv("ARCHERY_TEST_RUN_ID", "run_123")
	if _, err := LoadTestDatabaseConfig(); err != nil {
		t.Fatal(err)
	}
}

func TestResetRejectsUnknownFixtureBeforeConnecting(t *testing.T) {
	t.Setenv(TestConfigPathEnv, "")
	if err := ResetTestDatabase("typo"); err == nil || err.Error() != `unknown fixture "typo" (expected empty, legacy, or accounts)` {
		t.Fatalf("expected fixture error before any connection attempt, got %v", err)
	}
}
