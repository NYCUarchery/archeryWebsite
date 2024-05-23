package tools

import (
	"log"
	"os"
	"strconv"

	"github.com/gin-gonic/gin"
	"gopkg.in/yaml.v2"
)

type conf struct {
	Username string
	Password string
	Host     string
	Port     int
	Database string
	Mode     string
}

func GetConf() (c conf) {
	yamlFile, err := os.ReadFile("config/db.yaml")
	if err != nil {
		log.Printf("yamlFile.Get err   #%v ", err)
	}

	err = yaml.Unmarshal(yamlFile, &c)
	if err != nil {
		log.Fatalf("Unmarshal: %v", err)
	}
	return
}

func Convert2int(c *gin.Context, name string) int {
	dataStr := c.Param(name)
	data, _ := strconv.Atoi(dataStr)

	return data
}

func Convert2bool(c *gin.Context, name string) bool {
	dataStr := c.Param(name)

	data, _ := strconv.ParseBool(dataStr)
	return data
}

func Convert2uint(c *gin.Context, name string) uint {
	dataStr := c.Param(name)
	data, _ := strconv.ParseUint(dataStr, 10, 32)
	return uint(data)
}

func Scorefmt(score int) int {
	if score < 0 {
		return 0
	} else if score > 10 {
		return 10
	}
	return score
}
