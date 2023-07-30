package model

func UserInfo(username string) (user User, err error){
	err = DB.Where("username = ?", username).First(&user).Error
	return
}