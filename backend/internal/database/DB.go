package database

import (
	"fmt"
	"os"
	"log"
	"time"
	"gopkg.in/yaml.v2"

	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

type conf struct {
    Username 		string 
	Password 		string 
	Host 			string 
	Port 			int    
	Database 		string 
}

var DB *gorm.DB

func getConf() (c conf) {
    yamlFile, err := os.ReadFile("config/db.yaml")
    if err != nil {
        log.Printf("yamlFile.Get err   #%v ", err)
    }
	
    err = yaml.Unmarshal(yamlFile, &c)
    if err != nil {
        log.Fatalf("Unmarshal: %v", err)
    }
	return
}

func DatabaseInitial() {
	connectDB()
	InitUser()
	InitInstitution()
	InitOldLaneInfo()
	InitCompetition()
	InitParticipant()
	InitGroupInfo()
	InitQualification()
	InitLane()
}

func connectDB() {
	DSN := getConf()
	
	dsn := fmt.Sprintf("%s:%s@tcp(%s:%d)/%s?charset=utf8mb4&parseTime=True&loc=Local&tls=skip-verify",
		DSN.Username, DSN.Password, DSN.Host, DSN.Port, DSN.Database)
	var err error

	for retry := 0; retry < 5; retry++ {
		DB, err = gorm.Open(mysql.Open(dsn), &gorm.Config{})
		if err != nil {
			fmt.Println("database connection error: ", err)
		}
		time.Sleep(3 * time.Second)
	}
	if err != nil {
		fmt.Println("failed to connect database")
		os.Exit(1)
	}
}
