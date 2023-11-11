package translate

import (
	"bufio"
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/gin-gonic/gin"
)

// 對抗賽資料
func GetEliminationInfo(context *gin.Context) {
	gameName := context.Param("gameName")
	fmt.Printf("GetEliminationInfo worked, return info of %s", gameName)
	// phase（項目名字）
	// groups （所有人的資訊）
	//// players
	////// name
	////// rank
	////// score
	//// stages (八強、四強、季殿、冠亞)
	////// matches （兩個對打）
	//////// players
	////////// name
	////////// scores
	////////// points
	////////// is_winner
	//// result
	////// players
	//////// name
	//////// medal
}

// 比賽資訊
func GetGameInfo(context *gin.Context) {
	gameName := context.Param("gameName")
	fmt.Printf("GetGameInfo worked, return info of %s", gameName)
	// title 比賽名字
	// sub_title 比賽第幾屆
	// current_phase 現在的項目
	// current_phase_kind 現在項目得名字
	// current_stage 第幾局
}

// 項目資訊
func GetGroupInfo(context *gin.Context) {
	gameName := context.Param("gameName")
	fmt.Printf("GetGroupInfo worked, return info of %s", gameName)
	// groups 比賽有的各個項目的名字
}

// 對抗、資格、團體
func GetPhaseInfo(context *gin.Context) {
	gameName := context.Param("gameName")
	fmt.Printf("GetPhaseInfo worked, return info of %s", gameName)
	// phases 對抗、資格、團體
	// phase_kinds 類別
}

// 資格賽
func GetQualificationInfo(context *gin.Context) {
	gameName := context.Param("gameName")
	fmt.Printf("GetQualificationInfo worked, return info of %s", gameName)
	// phase 項目名
	// groups (新生 公開 大專)
	//// name 類別名
	//// player_num 總人數
	//// qualfication_num 篩選人數
	//// players
	////// rank 排名
	////// target 靶道
	////// name
	////// institution
	////// score
}

// 團體賽
func GetTeamEliminationInfo(context *gin.Context) {
	gameName := context.Param("gameName")
	fmt.Printf("GetTeamEliminationInfo worked, return info of %s", gameName)
	// phase
	// groups （新生 大專 公開）
	//// playsers
	////// name 隊伍名字
	////// rank 隊伍排名
	////// score 隊伍總分
	//// stages
	////// matches 比賽四強
	////// matches 冠亞
	////// matches 季殿
	//// result
	////// playsers
	//////// name
	//////// medal
}

// 'json:"name"' specify what a field’s name should be when the struct’s contents are serialized into JSON
type Album struct {
	Ranking     int64  `json:"rank"`
	Target      string `json:"target"`
	Name        string `json:"name"`
	Institution string `json:"institution"`
	Score       int64  `json:"score"`
}

// back side dummy data #for test
var dummyAlbums = []Album{
	{Ranking: 1, Target: "11C", Name: "A", Institution: "NYCU", Score: 340},
	{Ranking: 2, Target: "1A", Name: "B", Institution: "NTHU", Score: 240},
	{Ranking: 3, Target: "5B", Name: "C", Institution: "NUU?", Score: 140},
}

// response dummy data in JSON #for test
func GetAlbums(context *gin.Context) {
	context.IndentedJSON(http.StatusOK, dummyAlbums)
	// the output 20 indicates OK in net/http package.
	// "constent.IdentedJSON is more easier to debug and size is smaller than content.JSON"
}

// response normal data in JSON
func GetHTTPData(context *gin.Context) {
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
		context.IndentedJSON(http.StatusOK, gin.H{*ArrayName: data})
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
