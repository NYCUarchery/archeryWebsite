package pkg

import (
	"log"
	"net/http"

	"github.com/gin-contrib/sessions"
	"github.com/gin-contrib/sessions/cookie"
	"github.com/gin-gonic/gin"
)

var sessionName = "mysession"

type SessionConfig struct {
	Key string
}

type SessionContents struct {
	Username      string
	UserId        uint
	SystemRole    Role
	ParticipantId uint
	GameRole      Role
}

var defaultSessionOptions = sessions.Options{
	Path:   "/", // "/" : root path for all pages
	Domain: "",  // default is current domain
	// MaxAge=0 means no 'Max-Age' attribute specified.
	// MaxAge<0 means delete cookie now, equivalently 'Max-Age: 0'.
	// MaxAge>0 means Max-Age attribute present and given in seconds.
	MaxAge: 3600 * 24, // set to 1 day
	// Secure:   true, // ture : using https
	HttpOnly: true, // true : Don't allow JS to access the cookie
}

func EnableCookieSessionMiddleware(config SessionConfig) gin.HandlerFunc {
	store := cookie.NewStore([]byte(config.Key))
	return sessions.Sessions(sessionName, store)
}

func AuthSessionMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		PrintSession(c)
		if !IsAuthenticated(c) {
			println("AuthSessionMiddleware : not authenticated")
			println("username : ", QuerySession(c, "username"))

			print("username : ", QuerySession(c, "username"))
			c.JSON(http.StatusUnauthorized, gin.H{"result": "not authenticated"})
			c.Abort()
			return
		}
		c.Next()
	}
}

func IsAuthenticated(c *gin.Context) bool {
	session := sessions.Default(c)
	log.Println("isAuthenticated : ", session.Get("username"))
	username := session.Get("username")
	log.Println("username != nil : ", username != nil)
	return username != nil
}

func SaveAuthSession(c *gin.Context, sessionContents SessionContents) {
	session := sessions.Default(c)
	session.Options(defaultSessionOptions)
	session.Set("userid", sessionContents.UserId)
	session.Set("username", sessionContents.Username)
	session.Set("systemrole", int(sessionContents.SystemRole))
	session.Set("participantid", sessionContents.ParticipantId)
	session.Set("gamerole", int(sessionContents.GameRole))
	if err := session.Save(); err != nil {
		log.Println("failed to save session: ", err)
	}
}

func UpdateAuthSession(c *gin.Context, item string, value interface{}) {
	session := sessions.Default(c)
	session.Set(item, value) // not data type checked
	session.Save()
}

func ClearAuthSession(c *gin.Context) {
	session := sessions.Default(c)
	session.Options(sessions.Options{Path: "/", MaxAge: -1})
	session.Clear()
	session.Save()
}

func QuerySession(c *gin.Context, item string) interface{} {
	session := sessions.Default(c)
	log.Println("query session item(", item, ") : ", session.Get(item))
	return session.Get(item)
}

func PrintSession(c *gin.Context) {
	session := sessions.Default(c)
	userid := session.Get("userid")
	username := session.Get("username")
	systemrole := session.Get("systemrole")
	participantid := session.Get("participantid")
	gamerole := session.Get("gamerole")
	log.Println("session : ")
	log.Println("\tuserid : ", userid)
	log.Println("\tusername : ", username)
	log.Println("\tsystemrole : ", systemrole)
	log.Println("\tparticipantid : ", participantid)
	log.Println("\tgamerole : ", gamerole)
}
