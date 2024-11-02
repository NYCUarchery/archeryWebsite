package database

import (
	"database/sql/driver"
	"errors"
	"fmt"
	"log"
	"os"
	"strings"

	"gopkg.in/yaml.v2"
)

type Conf struct {
	Username string `yaml:"username"`
	Password string `yaml:"password"`
	Host     string `yaml:"host"`
	Port     int    `yaml:"port"`
	Database string `yaml:"database"`
	Mode     string `yaml:"mode"`
}

func GetConf(filePath string) (c Conf) {
	yamlFile, err := os.ReadFile(filePath)
	if err != nil {
		log.Printf("yamlFile.Get err   #%v ", err)
	}

	err = yaml.Unmarshal(yamlFile, &c)
	if err != nil {
		log.Fatalf("Unmarshal: %v", err)
	}
	return
}

func GetSQLDataFromFile(filepath string) []string {
	sqlBytes, err := os.ReadFile(filepath)
	if err != nil {
		log.Println("fail to load "+filepath+": ", err)
		os.Exit(1)
	}
	sqlString := string(sqlBytes)
	requests := strings.Split(sqlString, ";")
	requestArray := requests[:len(requests)-1]
	return requestArray
}

/*讓我可以存取[]string型別的東西*/

type Array []string

// 实现 sql.Scanner 接口，Scan 将 value 扫描至 Jsonb
func (a *Array) Scan(value interface{}) error {
	bytes, ok := value.([]byte)
	if !ok {
		return errors.New(fmt.Sprint("Failed to scan Array value:", value))
	}
	*a = strings.Split(string(bytes), ",")
	return nil
}

// 实现 driver.Valuer 接口，Value 返回 json value
func (a Array) Value() (driver.Value, error) {
	if len(a) > 0 {
		var str string = a[0]
		for _, v := range a[1:] {
			str += "," + v
		}
		return str, nil
	} else {
		return "", nil
	}
}
