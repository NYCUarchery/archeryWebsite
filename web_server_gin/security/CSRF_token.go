package security

import (
	"crypto/rand"
	"encoding/base64"
)

type Token struct {
    Token string `json:"token"`
}

/*產生token*/
func GenerateToken() (string, error) {
	bytes := make([]byte, 32) // allocate and initiate 32 bytes space

	_, err := rand.Read(bytes) // generate random nums 
	if err != nil { // if token generating error occur
		return "", err
	}

	token := base64.URLEncoding.EncodeToString(bytes) // to string type 
	return token, nil 
}

/*使用token的部分還沒寫*/
