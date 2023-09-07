package model

func AddUser(user *User) {
	DB.Create(user)
}

func UserInfoByName(name string) (user User, err error){
	/* 
	if the user exists, then return the user info
	else return a user with user.ID == 0
	*/
	err = DB.Where("name = ?", name).First(&user).Error
	return
}

func SaveUserInfo(user *User) {
	DB.Save(user)
}