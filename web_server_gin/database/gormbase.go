package database

import (
	"fmt"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
	"os"
	"bufio"
	"path/filepath"
	"strings"
	//"time"
)

type User struct {
	ID   uint   `gorm:"primaryKey"`

	Ranking int64 `gorm:"column:ranking"`
	Target  string `gorm:"column:target"`
	Name    string `gorm:"column:name"`
	Institution string `gorm:"column:institution"`
	Score int64 `gorm:"column:name"`
}

type dsn_details struct {
	database string 
    username string 
    password string 
    host string 
    port string
}

var DB *gorm.DB
var DSN dsn_details 

func GetDb() *gorm.DB {
	return DB
}

func getdsn() {
	Pwd, _ := os.Getwd()
	FilePath := filepath.Join(Pwd, "database")
	FilePath = filepath.Join(FilePath, "dsn_config.txt")
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

func Database_Initial() {
	// 建立資料庫連線
	// reference https://github.com/go-sql-driver/mysql#dsn-data-source-name
	getdsn()
    dsn := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?charset=utf8mb4&parseTime=True&loc=Local&tls=skip-verify",
        DSN.username, DSN.password, DSN.host, DSN.port, DSN.database)
	_, err := gorm.Open(mysql.Open(dsn), &gorm.Config{})
	if err != nil {
		fmt.Println("資料庫徹底連線失敗：", err)
	}

	/*
	// 自動建立資料表
	err = tempdb.AutoMigrate(&User{})
	if err != nil {
		fmt.Println("建立資料表失敗：", err)
	}

	// 設定connnection pool
	sqlDB, err := tempdb.DB()
	// SetMaxIdleConns sets the maximum number of connections in the idle connection pool.
	sqlDB.SetMaxIdleConns(10)
	// SetMaxOpenConns sets the maximum number of open connections to the database.
	sqlDB.SetMaxOpenConns(100)
	// SetConnMaxLifetime sets the maximum amount of time a connection may be reused.
	sqlDB.SetConnMaxLifetime(time.Hour)

	DB = tempdb // for gorm database implementation
	*/
}

