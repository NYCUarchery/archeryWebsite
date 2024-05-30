package database

import (
	"fmt"
	"os"
	"path/filepath"
	"runtime"
	"time"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func DummyDatabaseInitial() {
	connectDummyDB()
	setTables()
	InitDummyData()
}

func connectDummyDB() {
	var err error
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
	_, filename, _, ok := runtime.Caller(0)
	if !ok {
		fmt.Println("Unable to get caller information")
		os.Exit(1)
	}
	dir := filepath.Dir(filename)
	dummyDataPath := filepath.Join(dir, "../../assets/testData/dummyData.sql")
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

func DummyDBRestore() {
	DropTables()
	setTables()
	InitDummyData()
}
