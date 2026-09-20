package database

import "testing"

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
	t.Setenv("ARCHERY_TEST_DATABASE", "")
	if _, err := LoadTestDatabaseConfig(); err == nil {
		t.Fatal("missing runner config must fail, not use development config")
	}
	t.Setenv("ARCHERY_TEST_DB_USER", "archery_test")
	t.Setenv("ARCHERY_TEST_DB_PASSWORD", "disposable")
	t.Setenv("ARCHERY_TEST_DB_HOST", "mysql")
	t.Setenv("ARCHERY_TEST_DATABASE", "archery_test_run_123")
	t.Setenv("ARCHERY_TEST_ENVIRONMENT", "test")
	t.Setenv("ARCHERY_TEST_RUN_ID", "run_123")
	if _, err := LoadTestDatabaseConfig(); err != nil {
		t.Fatal(err)
	}
}

func TestResetRejectsUnknownFixtureBeforeConnecting(t *testing.T) {
	t.Setenv("ARCHERY_TEST_DATABASE", "")
	if err := ResetTestDatabase("typo"); err == nil || err.Error() != `unknown fixture "typo" (expected empty, legacy, or accounts)` {
		t.Fatalf("expected fixture error before any connection attempt, got %v", err)
	}
}
