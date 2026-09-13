package database

import (
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"regexp"
	"runtime"
	"strings"

	pkg "backend/internal/pkg"

	"gopkg.in/yaml.v2"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

// TestConfigPathEnv is deliberately separate from the normal application
// configuration.  Test tooling must opt in to a runner-generated config and
// must never fall back to config/db.yaml from a developer checkout.
const TestConfigPathEnv = "ARCHERY_TEST_CONFIG"

var testDatabaseName = regexp.MustCompile(`^archery_test_[a-z0-9_]+$`)

// TestDatabaseConfig is the small, guarded contract shared by the test runner
// and testdb. TestRunID is issued by the runner and must match Database.
type TestDatabaseConfig struct {
	Username  string `yaml:"username"`
	Password  string `yaml:"password"`
	Host      string `yaml:"host"`
	Port      int    `yaml:"port"`
	Database  string `yaml:"database"`
	Mode      string `yaml:"mode"`
	TestRunID string `yaml:"test_run_id"`
}

func LoadTestDatabaseConfig() (TestDatabaseConfig, error) {
	path := os.Getenv(TestConfigPathEnv)
	if path == "" {
		return TestDatabaseConfig{}, fmt.Errorf("%s is required", TestConfigPathEnv)
	}
	contents, err := os.ReadFile(filepath.Clean(path))
	if err != nil {
		return TestDatabaseConfig{}, fmt.Errorf("read test config: %w", err)
	}
	var config TestDatabaseConfig
	if err := yamlUnmarshal(contents, &config); err != nil {
		return TestDatabaseConfig{}, fmt.Errorf("parse test config: %w", err)
	}
	if err := config.Validate(); err != nil {
		return TestDatabaseConfig{}, err
	}
	if os.Getenv("ARCHERY_TEST_RUN_ID") != config.TestRunID {
		return TestDatabaseConfig{}, errors.New("test_run_id must match the runner environment")
	}
	return config, nil
}

// yamlUnmarshal is kept here to make config validation testable without
// exposing application config fallback behaviour.
var yamlUnmarshal = func(data []byte, out any) error {
	return yaml.Unmarshal(data, out)
}

func (config TestDatabaseConfig) Validate() error {
	if config.Mode != "test" {
		return errors.New("test config mode must be test")
	}
	if config.Host != "mysql" || config.Port != 3306 {
		return errors.New("test config must use the internal mysql:3306 host")
	}
	if config.Username != "archery_test" || config.Password == "" {
		return errors.New("test database requires the scoped archery_test account and a password")
	}
	if !testDatabaseName.MatchString(config.Database) {
		return fmt.Errorf("refusing non-runner database %q", config.Database)
	}
	if !regexp.MustCompile(`^[a-z0-9_]+$`).MatchString(config.TestRunID) || config.TestRunID == "" {
		return errors.New("test_run_id must contain only lowercase letters, digits, and underscores")
	}
	if config.Database != "archery_test_"+config.TestRunID {
		return errors.New("test database must match test_run_id")
	}
	return nil
}

// ResetTestDatabase replaces only a runner-owned schema.  It returns all
// failures to its caller; command binaries, not this library, decide exit
// status.
func ResetTestDatabase(fixture string) error {
	if fixture != "empty" && fixture != "legacy" && fixture != "accounts" {
		return fmt.Errorf("unknown fixture %q (expected empty, legacy, or accounts)", fixture)
	}
	config, err := LoadTestDatabaseConfig()
	if err != nil {
		return err
	}
	dsn := fmt.Sprintf("%s:%s@tcp(%s:%d)/%s?charset=utf8mb4&parseTime=True&loc=Local&tls=skip-verify",
		config.Username, config.Password, config.Host, config.Port, config.Database)
	db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{})
	if err != nil {
		return fmt.Errorf("connect runner database: %w", err)
	}
	if DB != nil {
		if previous, closeErr := DB.DB(); closeErr == nil {
			_ = previous.Close()
		}
	}
	DB = db
	if err := resetSchema(db); err != nil {
		return err
	}
	switch fixture {
	case "empty":
		return nil
	case "legacy":
		if err := loadLegacyFixture(db); err != nil {
			return err
		}
		return seedTestAdmin(db)
	case "accounts":
		return seedLifecycleAccounts(db)
	default:
		return fmt.Errorf("unknown fixture %q (expected empty, legacy, or accounts)", fixture)
	}
}

func resetSchema(db *gorm.DB) error {
	// Child tables first keeps this safe if a future migration enables stricter
	// foreign keys. The list is explicit so reset failures cannot be hidden by
	// the legacy startup helpers that log and continue.
	models := []any{
		&Medal{}, &MatchScore{}, &MatchEnd{}, &MatchResult{}, &Match{}, &Stage{},
		&PlayerSetMatchTable{}, &PlayerSet{}, &Elimination{},
		&RoundScore{}, &RoundEnd{}, &Round{}, &Player{}, &Lane{}, &Qualification{},
		&Group{}, &Participant{}, &Competition{}, &User{}, &Institution{},
	}
	if err := db.Migrator().DropTable(models...); err != nil {
		return fmt.Errorf("drop test schema: %w", err)
	}
	if err := db.AutoMigrate(
		&User{}, &Institution{}, &Participant{}, &Player{}, &Round{}, &RoundEnd{}, &RoundScore{},
		&PlayerSet{}, &PlayerSetMatchTable{}, &Competition{}, &Group{}, &Qualification{}, &Lane{},
		&Elimination{}, &Stage{}, &Match{}, &MatchResult{}, &MatchEnd{}, &MatchScore{}, &Medal{},
	); err != nil {
		return fmt.Errorf("migrate test schema: %w", err)
	}
	if err := ensureMatchResultPlayerSetConstraint(); err != nil {
		return fmt.Errorf("migrate MatchResult player set constraint: %w", err)
	}
	return nil
}

func loadLegacyFixture(db *gorm.DB) error {
	_, source, _, _ := runtime.Caller(0)
	path := filepath.Join(filepath.Dir(source), "../../assets/testData/dummyData_v2.sql")
	contents, err := os.ReadFile(path)
	if err != nil {
		return fmt.Errorf("read legacy fixture: %w", err)
	}
	for index, statement := range strings.Split(string(contents), ";") {
		if strings.TrimSpace(statement) == "" {
			continue
		}
		if err := db.Exec(statement).Error; err != nil {
			return fmt.Errorf("legacy fixture statement %d: %w", index+1, err)
		}
	}
	return nil
}

const LifecycleAccountPassword = "archery-e2e-password"

func seedTestAdmin(db *gorm.DB) error {
	institution := Institution{Name: NoInstitutionName}
	if err := db.Where("name = ?", NoInstitutionName).FirstOrCreate(&institution).Error; err != nil {
		return err
	}
	NoInstitutionID = institution.ID
	admin := User{Role: "Dictator", UserName: "e2e.admin", RealName: "E2E Admin", Password: pkg.EncryptPassword(LifecycleAccountPassword), Email: "e2e.admin@example.test", InstitutionID: institution.ID}
	return db.Create(&admin).Error
}

func seedLifecycleAccounts(db *gorm.DB) error {
	if err := seedTestAdmin(db); err != nil {
		return err
	}
	institution := Institution{Name: "E2E Test Institution"}
	if err := db.Create(&institution).Error; err != nil {
		return fmt.Errorf("create lifecycle institution: %w", err)
	}
	accounts := []User{
		{Role: pkg.RoleToString(pkg.RUser), UserName: "e2e.judge", RealName: "E2E Judge", Password: pkg.EncryptPassword(LifecycleAccountPassword), Email: "e2e.judge@example.test", InstitutionID: institution.ID},
	}
	for index := 1; index <= 24; index++ {
		accounts = append(accounts, User{
			Role: pkg.RoleToString(pkg.RUser), UserName: fmt.Sprintf("e2e.archer.%02d", index),
			RealName: fmt.Sprintf("E2E Archer %02d", index), Password: pkg.EncryptPassword(LifecycleAccountPassword),
			Email: fmt.Sprintf("e2e.archer.%02d@example.test", index), InstitutionID: institution.ID,
		})
	}
	if err := db.Create(&accounts).Error; err != nil {
		return fmt.Errorf("create lifecycle accounts: %w", err)
	}
	return nil
}
