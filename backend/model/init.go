package model

import (
	"fmt"
	"time"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
	//"log"
)

type User struct {
	ID       uint   `gorm:"primaryKey;autoIncrement"`
	Name     string `gorm:"unique;not null"`
	Password string `gorm:"not null"`
}

type Competition struct {
	ID   uint   `gorm:"primaryKey;autoIncrement"`
	Name string `gorm:"unique;not null"`
	Date time.Time `gorm:"not null"`
	HostID uint `gorm:"not null"`
	MenRecurve bool
	WomenRecurve bool
	MenCompound bool
	WomenCompound bool
}

type Participant struct {
	UserID uint `gorm:"primaryKey"`
	CompetitionID uint `gorm:"not null"`
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
	DB.AutoMigrate(&Competition{})
	DB.AutoMigrate(&Participant{})
}
