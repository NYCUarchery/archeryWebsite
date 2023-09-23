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
	CompetitionID 	uint `gorm:"not null"`
	Description 	string  `gorm:"not null"`
	Distance 		int32 `gorm:"not null"`
}

type Participant struct {
	UserID 			uint `gorm:"not null"`
	CompetitionID 	uint `gorm:"not null"`
}

type Response struct {
	Result string `json:"result" example:"result description"`
}

type UIDResponse struct {
	UID string `json:"uid" example:"your uid"`
}

type CompResponse struct {
	Result string `json:"result" example:"result description"`
	CompID int `json:"compID" example:"87"`
}

type CompInfoResponse struct {
	Result string `json:"result" example:"result description"`
	Name string `json:"name" example:"competition name"`
	Date string `json:"date" example:"2023-09-23"`
	HostID string`json:"hostID" example:"87"`
	ScoreboardURL string `json:"scoreboardURL" example:"Scoreboard URL"`
	Overview string `json:"overview" example:"overview"`
	Categories string `json:"categories" example:"[{des: "des", dis: 50}, ...]"`
	Participants string `json:"participants" example:"[1, 2, 3, 87]"`
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
}


