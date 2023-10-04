package model

func AddUser(user *User) (err error) {
	err = DB.Create(user).Error
	return
}

func UserInfoByName(name string) (user User){
	/* 
	if the user exists, then return the user info
	else return a user with user.ID == 0
	*/
	DB.Where("name = ?", name).Limit(1).First(&user)
	return
}

func UserInfoByID(id uint) (user User){
	/* 
	if the user exists, then return the user info
	else return a user with user.ID == 0
	*/
	DB.Where("id = ?", id).Limit(1).First(&user)
	return
}

func CheckEmailExist(email string) bool {
	var user User
	DB.Where("email = ?", email).Limit(1).First(&user)
	return user.ID != 0
}

func SaveUserInfo(user *User) {
	DB.Save(user)
}