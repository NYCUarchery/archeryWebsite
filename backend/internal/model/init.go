package model

import (
	"fmt"
	"time"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
	"gopkg.in/yaml.v2"
    "io/ioutil"
	"log"
)

type User struct {
	ID       	 uint   `gorm:"primaryKey;autoIncrement"`
	Name     	 string `gorm:"unique;not null"`
	Password 	 string `gorm:"not null"`
	Email 		 string `gorm:"unique;not null"`
	Organization string
	Overview	 string 
}

type Competition struct {
	ID   			uint   `gorm:"primaryKey;autoIncrement"`
	Name 			string `gorm:"unique;not null"`
	Date 			time.Time `gorm:"not null"`
	HostID 			uint `gorm:"not null"`
	ScoreboardURL	string
	Overview		string
}

type CompetitionCategory struct {
	ID 				uint   `gorm:"primaryKey;autoIncrement"`
	CompetitionID 	uint   `gorm:"not null"`
	Description 	string `gorm:"not null"`
	Distance 		int32  `gorm:"not null"`
}

type Participant struct {
	ID 				uint   `gorm:"primaryKey;autoIncrement"`
	UserID 			uint   `gorm:"not null"`
	CompetitionID 	uint   `gorm:"not null"`
	Status 			string `gorm:"not null"`
}

type ParticipantCategory struct {
	ParticipantID uint `gorm:"not null"`
	CategoryID    uint `gorm:"not null"`
}

type conf struct {
    DBuser 		string `yaml:"DBuser"`
	DBpasswd 	string `yaml:"DBpasswd"`
	DBip 		string `yaml:"DBip"`
	DBport 		string `yaml:"DBport"`
	DBname 		string `yaml:"DBname"`
}

func getConf(c *conf) {
    yamlFile, err := ioutil.ReadFile("config/db.yaml")
    if err != nil {
        log.Printf("yamlFile.Get err   #%v ", err)
    }
    err = yaml.Unmarshal(yamlFile, c)
    if err != nil {
        log.Fatalf("Unmarshal: %v", err)
    }
}

var DB *gorm.DB

func init() {
	var c conf 
	getConf(&c)

	var err error
	dsn := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?charset=utf8mb4&parseTime=True&loc=Local",
		c.DBuser, c.DBpasswd, c.DBip, c.DBport, c.DBname)

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
	DB.AutoMigrate(&CompetitionCategory{})
	DB.AutoMigrate(&ParticipantCategory{})
}


