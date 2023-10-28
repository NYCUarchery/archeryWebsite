package database

type User struct {
	ID            uint   `json:"id" gorm:"primary_key"`
	InstitutionId uint   `json:"institution_id"`
	Name          string `json:"name"`
	Password      string `json:"password"`
	Email         string `json:"email"`
	Overview      string `json:"overview"`
}

func InitUser() {
	DB.AutoMigrate(&User{})
}

func GetUserIsExist(id uint) bool {
	var user User
	DB.Table("users").Where("id = ?", id).First(&user)
	return user.ID != 0
}

func GetUserById(id uint) (User, error) {
	var user User
	result := DB.Table("users").Where("id = ?", id).First(&user)
	return user, result.Error
}

func GetUserByEmail(email string) (User, error) {
	var user User
	result := DB.Table("users").Where("email = ?", email).First(&user)
	return user, result.Error
}

func CreateUser(user User) (User, error) {
	result := DB.Table("users").Create(&user)
	return user, result.Error
}

func UpdateUser(id uint, user User) (bool, error) {
	result := DB.Table("users").Where("id = ?", id).Updates(&user)
	isChanged := result.RowsAffected != 0
	return isChanged, result.Error
}

func DeleteUser(id uint) (bool, error) {
	result := DB.Table("users").Where("id = ?", id).Delete(&User{})
	isChanged := result.RowsAffected != 0
	return isChanged, result.Error
}
