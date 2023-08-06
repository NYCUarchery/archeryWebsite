package model

import (
	"fmt"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
	//"log"
)

type User struct {
	ID       uint   `gorm:"primaryKey;autoIncrement"`
	Username string `gorm:"unique;not null"`
	Password string `gorm:"not null"`
}

var DB *gorm.DB

func init() {

	var err error
	dsn := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?charset=utf8mb4&parseTime=True&loc=Local",
		DBuser, DBpasswd, DBip, DBport, DBname)

	DB, err = gorm.Open(mysql.Open(dsn), &gorm.Config{})

	if err != nil {
        fmt.Printf("mysql connect error %v", err)
    }

    if DB.Error != nil {
        fmt.Printf("database error %v", DB.Error)
    }

    DB.AutoMigrate(&User{})
}
