package pkg

import (
	"bytes"
	"fmt"
	"log"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"
	"time"

	. "backend/internal/pkg"

	"github.com/gin-contrib/sessions"
	"github.com/gin-gonic/gin"
	. "github.com/smartystreets/goconvey/convey"
)

func setmockSessionFile(t *testing.T) string {
	tempDir := t.TempDir()
	tempFile := "tempFile.yaml"
	tempFile = tempDir + "/" + tempFile
	configMockContent := `SessionKey: key`
	if err := os.WriteFile(tempFile, []byte(configMockContent), 0644); err != nil {
		panic(err)
	}
	return tempFile
}

func setmockRouterWithSession(t *testing.T) (*gin.Context, *gin.Engine, *httptest.ResponseRecorder) {
	tempFile := setmockSessionFile(t)
	writer := httptest.NewRecorder()
	context, server := gin.CreateTestContext(writer)
	server.Use(EnableCookieSessionMiddleware(tempFile))
	return context, server, writer
}

func TestGetConf(t *testing.T) {
	type conf struct {
		Username string `yaml:"username"`
		Password string `yaml:"password"`
		Host     string `yaml:"host"`
		Port     int    `yaml:"port"`
		Database string `yaml:"database"`
		Mode     string `yaml:"mode"`
	}
	tempDir := t.TempDir()
	Convey("The result should be the configuration of the file", t, func() {
		/*set up fake path and fake file, would be delete after test*/
		tempFile := "tempFile.yaml"
		tempFile = tempDir + "/" + tempFile
		configMockContent := // using inverse quote to write real multi-line string
			`username: user
password: password
host: mysql
port: 3306
database: db
mode: test`
		configAnswer := &conf{
			Username: "user",
			Password: "password",
			Host:     "mysql",
			Port:     3306,
			Database: "db",
			Mode:     "test",
		}
		err := os.WriteFile(tempFile, []byte(configMockContent), 0644)
		if err != nil {
			panic(err)
		}
		result := GetConf[conf](tempFile)
		So(result, ShouldResemble, configAnswer)
	})
	Convey("read file error should be logged", t, func() {
		var logOutput bytes.Buffer
		tempDir := t.TempDir()
		filepath := tempDir + "/notExitFile.yaml"
		log.SetOutput(&logOutput)

		result := GetConf[conf](filepath)
		logMessage := logOutput.String()
		t := time.Now()
		formatTime := t.Format("2006/01/02 15:04:05") // special format
		expectedLogMessage := formatTime + " yamlFile.Get err   #open " + filepath + ": no such file or directory \n"

		So(result, ShouldResemble, &conf{})
		So(logMessage, ShouldEqual, expectedLogMessage)
	})
}

func TestEnableCookieSessionMiddleware(t *testing.T) {
	Convey("Test EnableCookieSessionMiddleware is really enable the session", t, func() {
		context, server, writer := setmockRouterWithSession(t)
		test_content := "test"
		server.GET("/test", func(c *gin.Context) {
			session := sessions.Default(c)
			session.Set("username", test_content)
			session.Save()
			content := session.Get("username")
			c.JSON(200, gin.H{"message": content})
		})
		req := httptest.NewRequestWithContext(context, http.MethodGet, "/test", nil)
		server.ServeHTTP(writer, req)
		So(writer.Code, ShouldEqual, 200)
		So(writer.Body.String(), ShouldEqual, fmt.Sprintf("{\"message\":\"%s\"}", test_content))
	})
}

func TestIsAuthenticated(t *testing.T) {
	Convey("Test IsAuthenticated check authenticated", t, func() {
		context, server, writer := setmockRouterWithSession(t)
		server.Use(func(c *gin.Context) {
			session := sessions.Default(c)
			session.Set("username", "test")
			session.Save()
			c.Next()
		})
		server.GET("/test", func(c *gin.Context) {
			if IsAuthenticated(c) {
				c.JSON(200, gin.H{"message": "authenticated"})
			} else {
				c.JSON(401, gin.H{"message": "not authenticated"})
			}
		})
		req := httptest.NewRequestWithContext(context, http.MethodGet, "/test", nil)
		server.ServeHTTP(writer, req)
		So(writer.Code, ShouldEqual, 200)
		So(writer.Body.String(), ShouldEqual, "{\"message\":\"authenticated\"}")
	})
	Convey("Test IsAuthenticated check not authenticated", t, func() {
		context, server, writer := setmockRouterWithSession(t)
		server.Use(func(c *gin.Context) {
			session := sessions.Default(c)
			session.Clear()
			session.Save()
			c.Next()
		})
		server.GET("/test", func(c *gin.Context) {
			if IsAuthenticated(c) {
				c.JSON(200, gin.H{"message": "authenticated"})
			} else {
				c.JSON(401, gin.H{"message": "not authenticated"})
			}
		})
		req := httptest.NewRequestWithContext(context, http.MethodGet, "/test", nil)
		server.ServeHTTP(writer, req)
		So(writer.Code, ShouldEqual, 401)
		So(writer.Body.String(), ShouldEqual, "{\"message\":\"not authenticated\"}")
	})
}

// AuthSessionMiddleware
// SaveAuthSession
// UpdateAuthSession
// ClearAuthSession
// QuerySession
