package database

import (
	"backend/internal/config"
	"backend/internal/migration"
	"context"
	"errors"
	"fmt"
	"log"
	"time"

	pkg "backend/internal/pkg"

	mysqlDriver "github.com/go-sql-driver/mysql"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

var DB *gorm.DB

// DatabaseInitial never resets persisted competitions. Test data is reset only
// by the isolated testdb command owned by the test runner.
func DatabaseInitial(app config.App) error {
	if err := app.ValidateServer(); err != nil {
		return err
	}
	if err := connectDB(app.Database); err != nil {
		return err
	}
	if err := requireCurrentSchema(); err != nil {
		if app.Environment != "production" {
			return err
		}
		log.Printf("WARNING: %v; production startup continues, but endpoints may fail until migration is complete", err)
	}
	CreateNoInstitution()
	return setDictator(app.Dictator)
}

// DatabaseInitialForSeeder requires the migrated schema and leaves an existing
// Dictator unchanged. Schema changes belong to the explicit migration command.
func DatabaseInitialForSeeder(app config.App) error {
	if err := app.ValidateSeeder(); err != nil {
		return err
	}
	if err := connectDB(app.Database); err != nil {
		return err
	}
	if err := requireCurrentSchema(); err != nil {
		return err
	}
	CreateNoInstitution()
	return ensureDictatorForSeeder(app.Dictator)
}

func requireCurrentSchema() error {
	if DB == nil {
		return errors.New("database is not connected")
	}
	sqlDB, err := DB.DB()
	if err != nil {
		return fmt.Errorf("get database handle: %w", err)
	}
	if err := migration.RequireCurrent(context.Background(), sqlDB); err != nil {
		return fmt.Errorf("database schema is not current; run ./migrate up: %w", err)
	}
	return nil
}

func DropTables() {
	DropMedal()
	DropMatchResult()
	DropPlayerSet()
	DropElimination()

	DropPlayer()
	DropLane()
	DropQualification()
	DropGroupInfo()

	DropParticipant()
	DropCompetition()
	DropUser()
	DropInstitution()

	log.Println("All tables are dropped")
}

func connectDB(database config.Database) error {
	dsnConfig := mysqlDriver.NewConfig()
	dsnConfig.User, dsnConfig.Passwd, dsnConfig.Net, dsnConfig.Addr, dsnConfig.DBName = database.User, database.Password, "tcp", fmt.Sprintf("%s:%d", database.Host, database.Port), database.Name
	dsnConfig.Params = map[string]string{"charset": "utf8mb4"}
	dsnConfig.ParseTime = true
	dsnConfig.Loc = time.Local
	dsnConfig.TLSConfig = "skip-verify"
	dsn := dsnConfig.FormatDSN()
	var err error

	for retry := 0; retry < 5; retry++ {
		connection, openErr := gorm.Open(mysql.Open(dsn), &gorm.Config{})
		if openErr == nil {
			if DB != nil {
				if previous, closeErr := DB.DB(); closeErr == nil {
					_ = previous.Close()
				}
			}
			DB = connection
			log.Println("Database \"" + database.Name + "\" is connected")
			return nil
		}
		err = openErr
		log.Println("database connection error")
		if retry < 4 {
			time.Sleep(3 * time.Second)
		}
	}
	if err != nil {
		return errors.New("failed to connect database")
	}
	return nil
}

func setDictator(dictatorConfig config.Dictator) error {
	old_user := User{}
	new_user := &User{}
	if dictatorConfig.Username == "" || dictatorConfig.Password == "" || dictatorConfig.Email == "" {
		return errors.New("Dictator configuration is incomplete")
	}
	new_user = &User{
		Role:     pkg.RoleToString(pkg.RDictator),
		UserName: dictatorConfig.Username,
		RealName: "Dictator",
		Password: pkg.EncryptPassword(dictatorConfig.Password),
		Email:    EmailPointer(dictatorConfig.Email), Overview: dictatorConfig.Overview,
	}

	old_user = FindByUsername(dictatorConfig.Username)
	if old_user.ID == 0 {
		_, err := CreateUser(*new_user)
		log.Println("Dictator is created")
		if err != nil {
			return errors.New("failed to create dictator")
		}
		return nil
	}
	if old_user.Role != pkg.RoleToString(pkg.RDictator) {
		log.Println("Dictator username is occupied by a non-Dictator user; refusing to modify it")
		return errors.New("Dictator username is occupied by a non-Dictator user; refusing to modify it")
	}
	log.Println("Dictator already exists; startup left it unchanged")
	return nil
}

func ensureDictatorForSeeder(dictatorConfig config.Dictator) error {
	if dictatorConfig.Username == "" || dictatorConfig.Password == "" || dictatorConfig.Email == "" {
		return errors.New("Dictator configuration is incomplete")
	}

	oldUser := FindByUsername(dictatorConfig.Username)
	if oldUser.ID != 0 {
		if oldUser.Role != pkg.RoleToString(pkg.RDictator) {
			log.Println("Dictator username is occupied by a non-Dictator user; refusing to modify it")
			return errors.New("Dictator username is occupied by a non-Dictator user; refusing to modify it")
		}
		if pkg.Compare(oldUser.Password, dictatorConfig.Password) != nil {
			return errors.New("Dictator password does not match existing Dictator")
		}
		log.Println("Dictator already exists; seeder left it unchanged")
		return nil
	}
	newUser := User{
		Role:     pkg.RoleToString(pkg.RDictator),
		UserName: dictatorConfig.Username,
		RealName: "Dictator",
		Password: pkg.EncryptPassword(dictatorConfig.Password),
		Email:    EmailPointer(dictatorConfig.Email),
		Overview: dictatorConfig.Overview,
	}
	if _, err := CreateUser(newUser); err != nil {
		return errors.New("failed to create Dictator for seeder")
	}
	log.Println("Dictator is created for seeder")
	return nil
}
