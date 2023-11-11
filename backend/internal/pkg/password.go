package pkg

import "golang.org/x/crypto/bcrypt"

func EncryptPassword(plaintext string) string {
	enc, _ := bcrypt.GenerateFromPassword([]byte(plaintext), bcrypt.DefaultCost)
	return string(enc)
}

func Compare(hashedPassword, password string) error {
	return bcrypt.CompareHashAndPassword([]byte(hashedPassword), []byte(password))
}
