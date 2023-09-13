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
	MenRecurve 		bool
	WomenRecurve 	bool
	MenCompound 	bool
	WomenCompound 	bool
}

type Participant struct {
	UserID uint `gorm:"primaryKey"`
	CompetitionID uint `gorm:"not null"`
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
}


