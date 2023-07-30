package database



func FindAllUsers () []User{ 
	var users []User
	DB.Find(&users)
	return users 
}

func FindByUserID (userID string) User {
	var user User 
	DB.Where("id = ?", userID).First(&user)
	return user
}