package pkg

import (
	"log"
	"net/http"
	"os"

	"github.com/gin-contrib/sessions"
	"github.com/gin-contrib/sessions/cookie"
	"github.com/gin-gonic/gin"
	"gopkg.in/yaml.v2"
)

type SessionConf struct {
	SessionKey string `yaml:"SessionKey"`
}

type SessionContents struct {
	Username      string
	UserId        uint
	SystemRole    Role
	ParticipantId uint
	GameRole      Role
}
func GetConf[T any](filePath string) *T {
	var c T
	yamlFile, err := os.ReadFile(filePath)
	if err != nil {
		log.Printf("yamlFile.Get err   #%v ", err)
	}

	err = yaml.Unmarshal(yamlFile, &c)
	if err != nil {
		log.Fatalf("Unmarshal: %v", err)
	}
	return &c
}

func EnableCookieSessionMiddleware(session_file string) gin.HandlerFunc {
	var c SessionConf
	c = *GetConf[SessionConf](session_file)
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
