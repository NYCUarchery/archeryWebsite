package model

func AddUser(user *User) {
	DB.Create(user)
}

func UserInfo(username string) (user User, err error){
	/* 
	if the user exists, then return the user info
	else return a user with user.ID == 0
	*/
	err = DB.Where("username = ?", username).First(&user).Error
	return
}