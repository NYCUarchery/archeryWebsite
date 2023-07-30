package data 

import (
	"fmt"
	"strings"
    "net/http"
	"os"
	"bufio"
	"path/filepath"
	"log"
	
    "github.com/gin-gonic/gin"
)

type ArrayAlbum struct {
	Item string `json:"item"`
}

// 'json:"name"' specify what a field’s name should be when the struct’s contents are serialized into JSON
type Album struct {
	Ranking int64 `json:"rank"`
	Target string `json:"target"`
	Name string `json:"name"`
	Institution string `json:"institution"`
	Score int64 `json:"score"`
}
/*
var array = []ArrayAlbum  {
	{Item: "新生"}
}
*/
// back side dummy data #for test  
var Albums = []Album {
	{Ranking:1, Target:"11C", Name:"A", Institution:"NYCU", Score:340}, 
	{Ranking:2, Target:"1A", Name:"B", Institution:"NTHU", Score:240}, 
	{Ranking:3, Target:"5B", Name:"C", Institution:"NUU?", Score:140}, 
}

// response dummy data in JSON #for test 
func GetAlbums (context *gin.Context) {
	context.IndentedJSON (http.StatusOK, Albums)
	// the output 20 indicates OK in net/http package.
	// "constent.IdentedJSON is more easier to debug and size is smaller than content.JSON"
}

// response normal data in JSON 
func GetHTTPData (context *gin.Context) {
	FileName := context.Param("dataName") // 取api的dataName部分
	/*讀絕對路徑檔案*/
	Pwd, _ := os.Getwd()
	//LastFile := path.Dir(Pwd)
	FilePath := filepath.Join(Pwd, "data")
	FilePath = filepath.Join(FilePath, FileName)
	data, err := readAlbumsFromFile(FilePath) 
	if err != nil { // 如果不存在FileName資料
		log.Fatalln("找不到檔案路徑:", FilePath, err)
	} else { //如果存在FileName資料
		context.IndentedJSON (http.StatusOK, data)
	}
}

func readAlbumsFromFile(FilePath string) ([]Album, error) {
	file, err := os.Open(FilePath)
	if err != nil {
		return nil, err
	}
	defer file.Close()

	var albums []Album
	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		line := scanner.Text()
		album, err := parseAlbum(line)
		if err != nil {
			fmt.Printf("parse error : %v\n", err)
			continue
		}
		albums = append(albums, album)
	}

	if err := scanner.Err(); err != nil {
		return nil, err
	}

	return albums, nil
}

func parseAlbum(line string) (Album, error) {
	/* Name Ranking Target Institution Score */
	var album Album
	values := strings.Fields(line)
	if len(values) != 5 {
		return album, fmt.Errorf("row form error %s", line)
	}

	if _, err := fmt.Sscanf(values[0], "%d", &album.Ranking); err != nil {
		return album, fmt.Errorf("parse Ranking error : %v", err)
	}
	album.Target = values[1]
	album.Name = values[2]
	album.Institution = values[3]
	if _, err := fmt.Sscanf(values[4], "%d", &album.Score); err != nil {
		return album, fmt.Errorf("parse Score error : %v", err)
	}

	return album, nil
}
