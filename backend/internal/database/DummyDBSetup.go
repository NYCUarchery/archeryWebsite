package database

import (
	"fmt"
	"os"
	"time"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func DummyDatabaseInitial() {
	connectDummyDB()

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

	InitDummyData()
}

func connectDummyDB() {
	var err error
	//const dummyDBPath = "internal/database/testData/dummy.db"

	for retry := 0; retry < 5; retry++ {
		DB, err = gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
		if err != nil {
			fmt.Println("dummy database connection error: ", err)
		}
		time.Sleep(3 * time.Second)
	}
	if err != nil {
		fmt.Println("failed to connect dummy database")
		os.Exit(1)
	}
}

func InitDummyData() {
	const dummyDataPath = "internal/database/testData/dummyData.sql"
	sqlBytes, err := os.ReadFile(dummyDataPath)
	if err != nil {
		fmt.Println("fail to load dummyData.sql: ", err)
		os.Exit(1)
	}

	sqlString := string(sqlBytes)
	result := DB.Exec(sqlString)
	if result.Error != nil {
		fmt.Println("fail to execute sql: ", result.Error)
		os.Exit(1)
	}
	fmt.Println("load dummyData.sql successfully")
}

func DummyDBRestore() *gorm.DB {
	return DB.Debug().Begin()
}

func DummyDBDelete() {
	err := os.Remove("internal/database/testData/dummy.db")
	if err != nil {
		fmt.Println("fail to remove dummy.db: ", err)
	} else {
		fmt.Println("remove dummy.db successfully")
	}
}
