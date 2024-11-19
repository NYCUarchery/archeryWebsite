package database

import (
	. "backend/internal/pkg"
	"log"
)

type User struct {
	ID            uint   `gorm:"primaryKey;autoIncrement" json:"id"`
	Role          string `gorm:"not null" json:"role"`
	UserName      string `gorm:"unique;not null" json:"user_name"`
	RealName      string `json:"real_name"`
	Password      string `gorm:"not null" json:"-"`
	Email         string `gorm:"unique;not null" json:"email"`
	InstitutionID uint   `json:"institution_id"`
	Overview      string `json:"overview"`
}

/*initiate 'User' structure in the database*/
func InitUser() {
	DB.AutoMigrate(&User{})
}

func DropUser() {
	if DB.Migrator().HasTable(&User{}) {
		if err := DB.Migrator().DropTable(&User{}); err != nil {
			log.Println("Failed to drop User:", err)
			return
		}
	}
}

/*get all user data */
func FindAllUsers() []User {
	var users []User
	DB.Find(&users)
	return users
}

func MoveUsersToNoInstitutionByInstitutionID(InstitutionID uint) error {
	err := DB.Model(&User{}).Where("institution_id = ?", InstitutionID).
		Update("institution_id", NoInstitutionID).Error
	return err
}

/* get one user data by ID*/
func FindByUserID(userID uint) (User, error) {
	var user User
	err := DB.Where("id = ?", userID).First(&user).Error
	return user, err
}

func FindByUsername(username string) User {
	var user User
	DB.Where("user_name = ?", username).First(&user)
	return user
}

func GetUserNameIsExist(username string) bool {
	var user User
	DB.Where("user_name = ?", username).First(&user)
	isFounded := user.ID != 0
	return isFounded
}

func GetEmailIsExist(email string) bool {
	var user User
	DB.Where("email = ?", email).First(&user)
	isFounded := user.ID != 0
	return isFounded
}

func GetUserNameIsExistExclude(username string, uid uint) bool {
	var user User
	DB.Where("user_name = ?", username).First(&user)
	return user.ID != 0 && user.ID != uid
}

func GetEmailIsExistExclude(email string, uid uint) bool {
	var user User
	DB.Where("email = ?", email).First(&user)
	return user.ID != 0 && user.ID != uid
}

/* post new user data */
func CreateUser(user User) (User, error) {
	err := DB.Create(&user).Error
	return user, err
}

/*delete user by ID*/
func DeleteUser(userID uint) bool {
	user := User{}
	result := DB.Where("id = ?", userID).Delete(&user)
	log.Println(result)
	return result.RowsAffected != 0
}

/*updata user*/
func UpdataUser(userID uint, user User) (User, error) {
	err := DB.Model(&user).Where("id = ?", userID).Updates(&user).Error
	return user, err
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

func GetUserRole(id uint) (string, error) {
	var user User
	result := DB.Model(&User{}).Where(("id = ?"), id).First(&user)
	return user.Role, result.Error
}

func UpdateUserRole(id uint, role Role) error {
	result := DB.Model(&User{}).Where("id = ?", id).Update("role", role)
	return result.Error
}
