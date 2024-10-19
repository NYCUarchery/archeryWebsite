package database

import (
	"fmt"
	"log"
	"os"
	"time"

	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

var DB *gorm.DB

func DatabaseInitial() {
	connectDB()
	DropTables()
	setTables()
	setInitialDataWithSeeder()
}

func setTables() {
	InitUser()
	InitInstitution()
	InitParticipant()
	InitPlayer()
	InitPlayerSet()

	InitCompetition()
	InitGroupInfo()
	InitQualification()
	InitLane()

	InitElimination()
	InitMatchResult()
	InitMedal()

	log.Println("All tables are created")
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

func SetupDatabaseByMode(mode string) {
	if mode == "test" {
		TestDatabaseInitial()
	} else {
		DatabaseInitial()
	}
}

func connectDB() {
	DSN := GetConf("config/db.yaml")

	dsn := fmt.Sprintf("%s:%s@tcp(%s:%d)/%s?charset=utf8mb4&parseTime=True&loc=Local&tls=skip-verify",
		DSN.Username, DSN.Password, DSN.Host, DSN.Port, DSN.Database)
	var err error

	for retry := 0; retry < 5; retry++ {
		DB, err = gorm.Open(mysql.Open(dsn), &gorm.Config{})
		if err != nil {
			fmt.Println("database connection error: ", err)
		}
		time.Sleep(3 * time.Second)
	}
	if err != nil {
		fmt.Println("failed to connect database")
		os.Exit(1)
	}
}

func setInitialDataWithSeeder() {
	/*
		Must need to load initData.sql first, it is the base data for the system.
		Must load dictator.sql after initData.sql, it is the data for the only dictator.

		Don't need to load dummyData.sql, it is the data for testing.
		dummyData.sql should have its own function to load.
	*/
	initDataFilePath := "assets/seeder/initData.sql"
	requests := GetSQLDataFromFile(initDataFilePath)
	for _, request := range requests {
		result := DB.Exec(request)
		if result.Error != nil {
			fmt.Println("fail to execute sql: ", result.Error)
			os.Exit(1)
		}
	}
	log.Println("load initData.sql successfully")
}
