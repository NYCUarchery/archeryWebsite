package database

import (
	"log"
)

type User struct {
	ID            uint   `gorm:"primaryKey;autoIncrement" json:"id"`
	Username      string `gorm:"unique;not null" json:"name"`
	RealName	  string `json:"realName"`
	Password      string `gorm:"not null" json:"-"`
	Email         string `gorm:"unique;not null" json:"email"`
	InstitutionID uint   `json:"institutionID"`
	Overview      string `json:"overview"`
}

/*initiate 'User' structure in the database*/
func InitUser() {
	DB.AutoMigrate(&User{})
}

/*get all user data */
func FindAllUsers() []User {
	var users []User
	DB.Find(&users)
	return users
}

/* get one user data by ID*/
func FindByUserID(userID uint) (User, error) {
	var user User
	err := DB.Where("id = ?", userID).First(&user).Error
	return user, err
}

func FindByUsername(username string) User {
	var user User
	DB.Where("username = ?", username).First(&user)
	return user
}

/* post new user data */
func CreateUser(user User) error {
	err := DB.Create(&user).Error
	return err
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

func CheckEmailExistExclude(email string, uid uint) bool {
	var user User
	DB.Where("email = ?", email).First(&user)
	return user.ID != 0 && user.ID != uid
}

func SaveUserInfo(user *User) {
	DB.Save(user)
}

/*mushroom*/
func GetUserIsExist(id uint) bool {
	var user User
	DB.Table("users").Where("id = ?", id).First(&user)
	return user.ID != 0
}
