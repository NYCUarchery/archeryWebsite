package database

import (
	pkg "backend/internal/pkg"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"runtime"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

func EnsureTestModeMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		if gin.Mode() != gin.TestMode {
			c.JSON(400, gin.H{"error": "Not in test mode"})
			c.Abort()
		}
		c.Next()
	}
}

func TestDatabaseInitial() {
	connectTestDB()
	DropTables()
	setTables()
	InitDummyData()

	CreateNoInstitution()
	setDictator()

	log.Println("Test database is initialized")
}

func InitDummyData() {
	_, filename, _, ok := runtime.Caller(0)
	if !ok {
		fmt.Println("Unable to get caller information")
		os.Exit(1)
	}
	dir := filepath.Dir(filename)
	dummyDataPath := filepath.Join(dir, "../../assets/testData/dummyData_v2.sql")
	requests := GetSQLDataFromFile(dummyDataPath)
	for _, request := range requests {
		result := DB.Exec(request)
		if result.Error != nil {
			fmt.Println("fail to execute sql: ", result.Error)
			os.Exit(1)
		}
	}
	log.Println("load dummyData.sql successfully")
}

func TestDBRestore() {
	DropTables()
	setTables()
	InitDummyData()

	CreateNoInstitution()
	setDictator()

	log.Println("Test database is restored")
}

func connectTestDB() {
	_, filename, _, ok := runtime.Caller(0)
	if !ok {
		fmt.Println("Unable to get caller information")
		os.Exit(1)
	}
	dir := filepath.Dir(filename)
	testDataPath := filepath.Join(dir, "../../config/db.yaml")
	DSN := pkg.GetConf[Conf](testDataPath)

	dsn := fmt.Sprintf("%s:%s@tcp(%s:%d)/%s?charset=utf8mb4&parseTime=True&loc=Local&tls=skip-verify",
		DSN.Username, DSN.Password, DSN.Host, DSN.Port, DSN.Database)
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

func CloseTestDB() {
	DropTables()
	sqlDB, err := DB.DB()
	if err != nil {
		log.Println("failed to get sqlDB")
		return
	}
	sqlDB.Close()
}
