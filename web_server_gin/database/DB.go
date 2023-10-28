package database

import (
	"bufio"
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"github.com/gin-gonic/gin"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

type dsn_details struct {
	database string
	username string
	password string
	host     string
	port     string
}

var DB *gorm.DB
var DSN dsn_details

func GetDb() *gorm.DB {
	return DB
}

func getDSNFileByMode() string {
	switch gin.Mode() {
	case "release":
		return "../dsn_config.txt"
	case "debug":
		return "../test_dsn_config.txt"
	case "test":
		return "../dsn_config.txt"
	default:
		return "../text_dsn_config.txt"
	}
}

func getDSN() {
	Pwd, _ := os.Getwd()
	FilePath := filepath.Join(Pwd, getDSNFileByMode())
	file, err := os.Open(FilePath)
	if err != nil {
		fmt.Println("Error opening file:", err)
		return
	}
	defer file.Close()
	scanner := bufio.NewScanner(file)
	if scanner.Scan() {
		line := scanner.Text()
		values := strings.Fields(line)
		DSN.database = values[0]
		DSN.username = values[1]
		DSN.password = values[2]
		DSN.host = values[3]
		DSN.port = values[4]
	} else {
		fmt.Println("Error reading file:", scanner.Err())
	}
}

func DatabaseInitial() {
	connectDB()
	InitOldLaneInfo()
	InitCompetition()
	InitGroupInfo()
	InitQualification()
	InitLane()
}

func connectDB() {
	// 建立資料庫連線
	// reference https://github.com/go-sql-driver/mysql#dsn-data-source-name
	getDSN()
	dsn := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?charset=utf8mb4&parseTime=True&loc=Local&tls=skip-verify",
		DSN.username, DSN.password, DSN.host, DSN.port, DSN.database)
	var err error
	DB, err = gorm.Open(mysql.Open(dsn), &gorm.Config{})
	if err != nil {
		fmt.Println("資料庫徹底連線失敗：", err)
	}
}
