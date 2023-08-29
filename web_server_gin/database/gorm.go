package database

import (
	"log"
)

type User struct {
	ID uint `json:"id"      gorm:"primary_key"`

	Ranking     int64  `json:"rank"`
	Target      string `json:"target"`
	Name        string `json:"name"`
	Institution string `json:"institution"`
	Score       int64  `json:"score"`
}

/*initiate 'User' structure in the database*/
func InitUsers() {
	DB.AutoMigrate(&User{})
}

/*get all user data */
func FindAllUsers() []User {
	var users []User
	DB.Find(&users)
	return users
}

/* get one user data by ID*/
func FindByUserID(userID string) User {
	var user User
	DB.Where("id = ?", userID).First(&user)
	return user
}

/* post new user data */
func CreateUser(user User) User {
	DB.Create(&user)
	return user
}

/*delete user by ID*/
func DeleteUser(userID string) bool {
	user := User{}
	result := DB.Where("id = ?", userID).Delete(&user)
	log.Println(result)
	return result.RowsAffected != 0
}

/*updata user*/
func UpdataUser(userID string, user User) User {
	DB.Model(&user).Where("id = ?", userID).Updates(user)
	return user
}
