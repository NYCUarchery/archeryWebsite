package database

import (
	"fmt"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
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

var DB *gorm.DB

func GetDb() *gorm.DB {
	return DB
}

func Database_Initial() {
	// 建立資料庫連線
	// reference https://github.com/go-sql-driver/mysql#dsn-data-source-name
	dsn := "NYCUarchery:cegkuz-3hongA-nigpoz@tcp(172.190.212.47:3306)/testDB?charset=utf8mb4&parseTime=True&loc=Local"
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
