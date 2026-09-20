package config

import (
	"errors"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

var configEnvironmentKeys = []string{"ARCHERY_ENVIRONMENT", "MYSQL_HOST", "MYSQL_PORT", "MYSQL_DATABASE", "MYSQL_USER", "MYSQL_PASSWORD", "ARCHERY_SESSION_KEY", "ARCHERY_DICTATOR_USERNAME", "ARCHERY_DICTATOR_PASSWORD", "ARCHERY_DICTATOR_EMAIL", "ARCHERY_DICTATOR_OVERVIEW"}

func clearConfigEnvironment(t *testing.T) {
	t.Helper()
	type savedValue struct {
		value  string
		exists bool
	}
	original := make(map[string]savedValue, len(configEnvironmentKeys))
	for _, key := range configEnvironmentKeys {
		value, exists := os.LookupEnv(key)
		original[key] = savedValue{value, exists}
		if err := os.Unsetenv(key); err != nil {
			t.Fatal(err)
		}
	}
	t.Cleanup(func() {
		for _, key := range configEnvironmentKeys {
			if saved := original[key]; saved.exists {
				_ = os.Setenv(key, saved.value)
			} else {
				_ = os.Unsetenv(key)
			}
		}
	})
}
func validApp(environment string) App {
	return App{Environment: environment, Database: Database{Host: "mysql", Port: 3306, Name: "archery", User: "archery", Password: "password"}, SessionKey: "12345678901234567890123456789012", Dictator: Dictator{Username: "admin", Password: "password", Email: "admin@example.test"}}
}

func TestLoadExplicitFileUsesProcessEnvironmentPrecedence(t *testing.T) {
	clearConfigEnvironment(t)
	path := filepath.Join(t.TempDir(), ".env")
	contents := "ARCHERY_ENVIRONMENT=production\nMYSQL_HOST=file-mysql\nMYSQL_PORT=3307\nMYSQL_DATABASE=file-db\nMYSQL_USER=file-user\nMYSQL_PASSWORD=file-password\nARCHERY_SESSION_KEY=file-session-key\nARCHERY_DICTATOR_USERNAME=file-admin\nARCHERY_DICTATOR_PASSWORD=file-admin-password\nARCHERY_DICTATOR_EMAIL=file@example.test\nARCHERY_DICTATOR_OVERVIEW=file overview\n"
	if err := os.WriteFile(path, []byte(contents), 0600); err != nil {
		t.Fatal(err)
	}
	t.Setenv("ARCHERY_ENVIRONMENT", "test")
	t.Setenv("MYSQL_PORT", "3308")
	t.Setenv("MYSQL_PASSWORD", "process-password")
	app, err := Load(path)
	if err != nil {
		t.Fatal(err)
	}
	if app.Environment != "test" || app.Database.Port != 3308 || app.Database.Password != "process-password" || app.Database.Host != "file-mysql" || app.Dictator.Username != "file-admin" {
		t.Fatalf("dotenv/process merge mismatch: %#v", app)
	}
}

func TestLoadDoesNotDiscoverDotenv(t *testing.T) {
	clearConfigEnvironment(t)
	directory := t.TempDir()
	if err := os.WriteFile(filepath.Join(directory, ".env"), []byte("ARCHERY_ENVIRONMENT=production\nMYSQL_PORT=3307\n"), 0600); err != nil {
		t.Fatal(err)
	}
	previous, err := os.Getwd()
	if err != nil {
		t.Fatal(err)
	}
	if err := os.Chdir(directory); err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { _ = os.Chdir(previous) })
	app, err := Load("")
	if err != nil {
		t.Fatal(err)
	}
	if app.Environment != "" || app.Database.Port != 3306 {
		t.Fatalf("Load discovered .env unexpectedly: %#v", app)
	}
}

func TestLoadRejectsExplicitMissingEnvFile(t *testing.T) {
	clearConfigEnvironment(t)
	_, err := Load(filepath.Join(t.TempDir(), "missing.env"))
	if err == nil || !strings.Contains(err.Error(), "load env file") || !errors.Is(err, os.ErrNotExist) {
		t.Fatalf("missing explicit env file error = %v", err)
	}
}

func TestLoadParsesQuotedSpecialCharactersLiterally(t *testing.T) {
	clearConfigEnvironment(t)
	path := filepath.Join(t.TempDir(), ".env")
	contents := "ARCHERY_ENVIRONMENT=development\nMYSQL_HOST=mysql\nMYSQL_DATABASE=archery\nMYSQL_USER=archery\nMYSQL_PASSWORD='pass $ # spaces ! ='\nARCHERY_SESSION_KEY='session $ # spaces ! ='\nARCHERY_DICTATOR_USERNAME=admin\nARCHERY_DICTATOR_PASSWORD='dictator $ # spaces ! ='\nARCHERY_DICTATOR_EMAIL=admin@example.test\nARCHERY_DICTATOR_OVERVIEW='overview $ # spaces ! ='\n"
	if err := os.WriteFile(path, []byte(contents), 0600); err != nil {
		t.Fatal(err)
	}
	app, err := Load(path)
	if err != nil {
		t.Fatal(err)
	}
	if app.Database.Password != "pass $ # spaces ! =" || app.SessionKey != "session $ # spaces ! =" || app.Dictator.Password != "dictator $ # spaces ! =" || app.Dictator.Overview != "overview $ # spaces ! =" {
		t.Fatalf("quoted values changed: %#v", app)
	}
}

func TestLoadRejectsInvalidPort(t *testing.T) {
	for _, value := range []string{"abc", "0", "65536"} {
		t.Run(value, func(t *testing.T) {
			clearConfigEnvironment(t)
			t.Setenv("MYSQL_PORT", value)
			if _, err := Load(""); err == nil {
				t.Fatal("invalid port accepted")
			}
		})
	}
}

func TestValidateServerRequiredFieldsAndEnvironment(t *testing.T) {
	app := validApp("development")
	for name, mutate := range map[string]func(*App){"environment": func(a *App) { a.Environment = "dev" }, "host": func(a *App) { a.Database.Host = "" }, "database": func(a *App) { a.Database.Name = "" }, "user": func(a *App) { a.Database.User = "" }, "password": func(a *App) { a.Database.Password = "" }, "session": func(a *App) { a.SessionKey = "" }, "dictator username": func(a *App) { a.Dictator.Username = "" }, "dictator password": func(a *App) { a.Dictator.Password = "" }, "dictator email": func(a *App) { a.Dictator.Email = "" }} {
		t.Run(name, func(t *testing.T) {
			invalid := app
			mutate(&invalid)
			if err := invalid.ValidateServer(); err == nil {
				t.Fatal("invalid server configuration accepted")
			}
		})
	}
}

func TestValidateServerProductionSessionKeyLength(t *testing.T) {
	app := validApp("production")
	app.SessionKey = "short"
	if err := app.ValidateServer(); err == nil {
		t.Fatal("production accepted weak session key")
	}
	app.SessionKey = "12345678901234567890123456789012"
	if err := app.ValidateServer(); err != nil {
		t.Fatalf("production rejected 32-byte session key: %v", err)
	}
	app.Environment, app.SessionKey = "development", "short"
	if err := app.ValidateServer(); err != nil {
		t.Fatalf("development should preserve existing short development keys: %v", err)
	}
}

func TestValidateSeederForbidsProductionButDoesNotRequireSession(t *testing.T) {
	app := validApp("development")
	app.SessionKey = ""
	if err := app.ValidateSeeder(); err != nil {
		t.Fatalf("seeder requires session key: %v", err)
	}
	app.Environment = "production"
	if err := app.ValidateSeeder(); err == nil {
		t.Fatal("production seeder accepted")
	}
}
