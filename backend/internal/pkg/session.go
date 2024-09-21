package pkg

import (
	"io/ioutil"
	"log"
	"net/http"

	"github.com/gin-contrib/sessions"
	"github.com/gin-contrib/sessions/cookie"
	"github.com/gin-gonic/gin"
	"gopkg.in/yaml.v2"
)

type SessionConf struct {
	SessionKey string `yaml:"SessionKey"`
}

func getConf(c *SessionConf) {
	yamlFile, err := ioutil.ReadFile("config/session.yaml")
	if err != nil {
		log.Printf("yamlFile.Get err   #%v ", err)
	}
	err = yaml.Unmarshal(yamlFile, c)
	if err != nil {
		log.Fatalf("Unmarshal: %v", err)
	}
}

func EnableCookieSessionMiddleware() gin.HandlerFunc {
	var c SessionConf
	getConf(&c)
	store := cookie.NewStore([]byte(c.SessionKey))
	return sessions.Sessions("mysession", store)
}

func AuthSessionMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		if !IsAuthenticated(c) {
			c.JSON(http.StatusUnauthorized, gin.H{"result": "require login"})
			c.Abort()
			return
		}
		c.Next()
	}
}

func IsAuthenticated(c *gin.Context) bool {
	session := sessions.Default(c)

	username := session.Get("username")

	return username != nil
}

func SaveAuthSession(c *gin.Context, id uint, username string) {
	session := sessions.Default(c)
	session.Options(sessions.Options{Path: "/"})
	session.Set("username", username)
	session.Set("id", id)
	session.Save()
}

func ClearAuthSession(c *gin.Context) {
	session := sessions.Default(c)
	session.Options(sessions.Options{Path: "/"})
	session.Clear()
	session.Save()
}

func QuerySession(c *gin.Context, item string) interface{} {
	session := sessions.Default(c)
	return session.Get(item)
}
