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
