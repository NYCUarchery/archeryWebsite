package database

import (
	. "backend/internal/database"
	"bytes"
	"log"
	"os"
	"testing"
	"time"

	. "github.com/smartystreets/goconvey/convey"
)

func TestGetConf(t *testing.T) {
	Convey("Given a valid file path to test endpoint//tools//getConf", t, func() {
		tempDir := t.TempDir()
		Convey("The result should be the configuration of the file", func() {
			/*set up fake path and fake file, would be delete after test*/
			tempFile := "tempFile.yaml"
			tempFile = tempDir + "/" + tempFile
			configMockContent := // using inverse quote to write real multi-line string
				`username: user
password: password
host: mysql
port: 3306
database: db
mode: test
TestUsername: testuser
TestPassword: testpassword
TestHost: testmysql
TestPort: 3307
TestDatabase: testdb`
			configAnswer := Conf{
				Username:     "user",
				Password:     "password",
				Host:         "mysql",
				Port:         3306,
				Database:     "db",
				Mode:         "test",
				TestUsername: "testuser",
				TestPassword: "testpassword",
				TestHost:     "testmysql",
				TestPort:     3307,
				TestDatabase: "testdb",
			}
			err := os.WriteFile(tempFile, []byte(configMockContent), 0644)
			if err != nil {
				panic(err)
			}
			result := GetConf(tempFile)
			So(result, ShouldResemble, configAnswer)
		})
		Convey("read file error should be log", func() {
			var logOutput bytes.Buffer
			tempDir := t.TempDir()
			filepath := tempDir + "/notExitFile.yaml"
			log.SetOutput(&logOutput)

			result := GetConf(filepath)
			logMessage := logOutput.String()
			t := time.Now()
			formatTime := t.Format("2006/01/02 15:04:05") // special format
			expectedLogMessage := formatTime + " yamlFile.Get err   #open " + filepath + ": no such file or directory \n"

			So(result, ShouldResemble, Conf{})
			So(logMessage, ShouldEqual, expectedLogMessage)
		})
	})
}
