package database

import (
	"fmt"
	"log"
	"os"
	"path/filepath"
	"runtime"
	"strings"
	"time"

	"gorm.io/driver/mysql"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func DummyDatabaseInitial() {
	connectDummyDB()
	setTables()
	InitDummyData()
	log.Println("Dummy database is initialized")
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
	log.Println("dummy database is connected")
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
	requests := strings.Split(sqlString, ";")
	requests = requests[:len(requests)-1]
	for _, request := range requests {
		result := DB.Exec(request)
		if result.Error != nil {
			fmt.Println("fail to execute sql: ", result.Error)
			os.Exit(1)
		}
	}
	log.Println("load dummyData.sql successfully")
}

func DummyDBRestore() {
	DropTables()
	setTables()
	InitDummyData()
	log.Println("Dummy database is restored")
}

func TestDatabaseInitial() {
	connectTestDB()
	DropTables()
	setTables()
	InitDummyData()
	log.Println("Test database is initialized")
}

func connectTestDB() {
	_, filename, _, ok := runtime.Caller(0)
	if !ok {
		fmt.Println("Unable to get caller information")
		os.Exit(1)
	}
	dir := filepath.Dir(filename)
	testDataPath := filepath.Join(dir, "../../config/db.yaml")
	DSN := GetConf(testDataPath)

	dsn := fmt.Sprintf("%s:%s@tcp(%s:%d)/%s?charset=utf8mb4&parseTime=True&loc=Local&tls=skip-verify",
		DSN.TestUsername, DSN.TestPassword, DSN.TestHost, DSN.TestPort, DSN.TestDatabase)
	var err error

	for retry := 0; retry < 5; retry++ {
		DB, err = gorm.Open(mysql.Open(dsn), &gorm.Config{})
		if err != nil {
			log.Println("database connection error: ", err)
		}
		time.Sleep(3 * time.Second)
	}
	if err != nil {
		log.Println("failed to connect database")
		os.Exit(1)
	}
	log.Println("test database is connected")
}
