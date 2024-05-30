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
	setTables()
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

	InitOldLaneInfo()
	log.Println("All tables are created")
}

func DropTables() {
	DropOldLaneInfo()

	DropMedal()
	DropMatchResult()
	DropElimination()

	DropLane()
	DropQualification()
	DropGroupInfo()
	DropCompetition()

	DropPlayerSet()
	DropPlayer()
	DropParticipant()
	DropInstitution()
	DropUser()
	log.Println("All tables are dropped")
}

func SetupDatabaseByMode(mode string) {
	if mode == "test" {
		DummyDatabaseInitial()
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
