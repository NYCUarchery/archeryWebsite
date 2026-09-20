// Package config defines the explicit runtime configuration contract.
package config

import (
	"errors"
	"fmt"
	"os"
	"strconv"

	"github.com/joho/godotenv"
)

type Database struct {
	Host     string
	Port     int
	Name     string
	User     string
	Password string
}
type Dictator struct {
	Username string
	Password string
	Email    string
	Overview string
}
type App struct {
	Environment string
	Database    Database
	SessionKey  string
	Dictator    Dictator
}

// Load reads only a caller-selected dotenv file. Existing process variables win.
func Load(envFile string) (App, error) {
	if envFile != "" {
		if err := godotenv.Load(envFile); err != nil {
			return App{}, fmt.Errorf("load env file: %w", err)
		}
	}
	port := 3306
	if value := os.Getenv("MYSQL_PORT"); value != "" {
		parsed, err := strconv.Atoi(value)
		if err != nil || parsed < 1 || parsed > 65535 {
			return App{}, errors.New("MYSQL_PORT must be a valid port")
		}
		port = parsed
	}
	return App{Environment: os.Getenv("ARCHERY_ENVIRONMENT"), Database: Database{Host: os.Getenv("MYSQL_HOST"), Port: port, Name: os.Getenv("MYSQL_DATABASE"), User: os.Getenv("MYSQL_USER"), Password: os.Getenv("MYSQL_PASSWORD")}, SessionKey: os.Getenv("ARCHERY_SESSION_KEY"), Dictator: Dictator{Username: os.Getenv("ARCHERY_DICTATOR_USERNAME"), Password: os.Getenv("ARCHERY_DICTATOR_PASSWORD"), Email: os.Getenv("ARCHERY_DICTATOR_EMAIL"), Overview: os.Getenv("ARCHERY_DICTATOR_OVERVIEW")}}, nil
}

func (a App) ValidateServer() error {
	if err := a.validateDatabaseAndDictator(); err != nil {
		return err
	}
	if a.SessionKey == "" {
		return errors.New("ARCHERY_SESSION_KEY is required")
	}
	if a.Environment == "production" && len(a.SessionKey) < 32 {
		return errors.New("ARCHERY_SESSION_KEY must be at least 32 bytes in production")
	}
	return nil
}
func (a App) ValidateSeeder() error {
	if a.Environment == "production" {
		return errors.New("seeder is forbidden in production")
	}
	return a.validateDatabaseAndDictator()
}
func (a App) validateDatabaseAndDictator() error {
	if a.Environment != "development" && a.Environment != "test" && a.Environment != "production" {
		return errors.New("ARCHERY_ENVIRONMENT must be development, test, or production")
	}
	for key, value := range map[string]string{"MYSQL_HOST": a.Database.Host, "MYSQL_DATABASE": a.Database.Name, "MYSQL_USER": a.Database.User, "MYSQL_PASSWORD": a.Database.Password, "ARCHERY_DICTATOR_USERNAME": a.Dictator.Username, "ARCHERY_DICTATOR_PASSWORD": a.Dictator.Password, "ARCHERY_DICTATOR_EMAIL": a.Dictator.Email} {
		if value == "" {
			return fmt.Errorf("%s is required", key)
		}
	}
	return nil
}
