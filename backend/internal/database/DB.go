package database

import (
	"fmt"
	"log"
	"os"
	"path/filepath"
	"runtime"
	"time"

	pkg "backend/internal/pkg"

	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

var DB *gorm.DB

func SetupDatabaseByMode(mode string) {
	if mode == "test" || mode == "dev" {
		TestDatabaseInitial()
	} else {
		DatabaseInitial()
	}
}

func DatabaseInitial() {
	connectDB()
	setTables()
	CreateNoInstitution()
	setDictator()
}

func setTables() {
	InitUser()
	InitInstitution()
	InitParticipant()

	InitPlayer()
	InitPlayerSet()

	InitCompetition()
	InitGroupInfo()
	InitQualification()
	InitLane()

	InitElimination()
	InitMatchResult()
	InitMedal()

	log.Println("All tables are created")
}

func DropTables() {
	DropMedal()
	DropMatchResult()
	DropPlayerSet()
	DropElimination()

	DropPlayer()
	DropLane()
	DropQualification()
	DropGroupInfo()

	DropParticipant()
	DropCompetition()
	DropUser()
	DropInstitution()

	log.Println("All tables are dropped")
}

func connectDB() {
	DSN := pkg.GetConf[Conf]("config/db.yaml")

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
	log.Println("Database \"" + DSN.Database + "\" is connected")
}

func setDictator() {
	type dictatorConf struct {
		UserName string `json:"username"`
		Password string `json:"password"`
		Email    string `json:"email"`
		Overview string `json:"overview"`
	}
	_, filename, _, ok := runtime.Caller(0)
	if !ok {
		log.Println("Unable to get caller information for setDictator")
		os.Exit(1)
	}
	dir := filepath.Dir(filename)
	config_path := filepath.Join(dir, "../../config/dictator.yaml")
	old_user := User{}
	new_user := &User{}
	dictator_config := pkg.GetConf[dictatorConf](config_path)
	if dictator_config.UserName == "" {
		log.Println("Dictator config is not set")
		os.Exit(1)
	}
	if dictator_config.Password == "" {
		log.Println("Dictator password is not set")
		os.Exit(1)
	}
	if dictator_config.Email == "" {
		log.Println("Dictator email is not set")
		os.Exit(1)
	}
	new_user = &User{
		Role:     pkg.RoleToString(pkg.RDictator),
		UserName: dictator_config.UserName,
		RealName: "Dictator",
		Password: pkg.EncryptPassword(dictator_config.Password),
		Email:    dictator_config.Email,
		Overview: dictator_config.Overview,
	}

	old_user = FindByUsername(dictator_config.UserName)
	if old_user.ID == 0 {
		_, err := CreateUser(*new_user)
		log.Println("Dictator is created")
		if err != nil {
			log.Println("Failed to create dictator")
			os.Exit(1)
		}
		return
	}
	if pkg.Compare(old_user.Password, dictator_config.Password) != nil {
		log.Println("Dictator password is unmatch, cannot update dictator and init database")
		os.Exit(1)
	}
	_, err := UpdataUser(old_user.ID, *new_user)
	if err != nil {
		log.Println("Failed to update dictator")
		os.Exit(1)
	}
	log.Println("Dictator is updated")
}
