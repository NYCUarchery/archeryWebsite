package translate 

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

// 對抗賽資料
func GetEliminationInfo (context *gin.Context) {
	gameName := context.Param("gameName")
	fmt.Printf("GetEliminationInfo worked, return info of %s", gameName)
}

// 比賽資訊
func GetGameInfo (context *gin.Context) {
	gameName := context.Param("gameName")
	fmt.Printf("GetGameInfo worked, return info of %s", gameName)	
}

// 項目資訊
func GetGroupInfo (context *gin.Context) {
	gameName := context.Param("gameName")
	fmt.Printf("GetGroupInfo worked, return info of %s", gameName)		
}

// 對抗、資格、團體
func GetPhaseInfo (context *gin.Context) {
	gameName := context.Param("gameName")
	fmt.Printf("GetPhaseInfo worked, return info of %s", gameName)		
}

// 資格賽
func GetQualificationInfo (context *gin.Context) {
	gameName := context.Param("gameName")
	fmt.Printf("GetQualificationInfo worked, return info of %s", gameName)	
}

// 團體賽
func GetTeamEliminationInfo (context *gin.Context) {
	gameName := context.Param("gameName")
	fmt.Printf("GetTeamEliminationInfo worked, return info of %s", gameName)	
}

// 使用者資料
func GetUserInfo (context *gin.Context) {
	userName := context.Param("userName")
	fmt.Printf("GetUserInfo worked, return info of %s", userName)	
}

// 'json:"name"' specify what a field’s name should be when the struct’s contents are serialized into JSON
type Album struct {
	Ranking int64 `json:"rank"`
	Target string `json:"target"`
	Name string `json:"name"`
	Institution string `json:"institution"`
	Score int64 `json:"score"`
}

// back side dummy data #for test  
var dummyAlbums = []Album {
	{Ranking:1, Target:"11C", Name:"A", Institution:"NYCU", Score:340}, 
	{Ranking:2, Target:"1A", Name:"B", Institution:"NTHU", Score:240}, 
	{Ranking:3, Target:"5B", Name:"C", Institution:"NUU?", Score:140}, 
}

// response dummy data in JSON #for test 
func GetAlbums (context *gin.Context) {
	context.IndentedJSON (http.StatusOK, dummyAlbums)
	// the output 20 indicates OK in net/http package.
	// "constent.IdentedJSON is more easier to debug and size is smaller than content.JSON"
}

// response normal data in JSON 
func GetHTTPData (context *gin.Context) {
	FileName := context.Param("dataName") // 取api的dataName部分
	/*讀絕對路徑檔案*/
	Pwd, _ := os.Getwd()
	//LastFile := path.Dir(Pwd)
	FilePath := filepath.Join(Pwd, "translate")
	FilePath = filepath.Join(FilePath, FileName)
	ArrayName, data, err := readAlbumsFromFile(FilePath) 
	if err != nil { // 如果不存在FileName資料
		log.Fatalln("找不到檔案路徑:", FilePath, err)
	} else { //如果存在FileName資料
		context.IndentedJSON (http.StatusOK, gin.H{*ArrayName:data,})
	}
}


/*格式1.第一行是arrayname 2.其餘行是選手資料*/
func readAlbumsFromFile(FilePath string) (*string, []Album, error) {
	file, err := os.Open(FilePath)
	if err != nil {
		return nil, nil, err
	}
	defer file.Close()

	var albums []Album
	var ArrayName string
	firstIteration := 0
	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		line := scanner.Text()
		if firstIteration == 0 {
			firstIteration = 1 
			ArrayName = line
		} else {
			album, err := parseAlbum(line)
			if err != nil {
				fmt.Printf("parse error : %v\n", err)
				continue
			}
			albums = append(albums, album)
		}
	}

	if err := scanner.Err(); err != nil {
		return nil, nil, err
	}

	return &ArrayName, albums, nil
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
