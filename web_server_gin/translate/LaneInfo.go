package translate

import(
	"fmt"
	"net/http"
	"web_server_gin/database"

	"github.com/gin-gonic/gin"
)

func GetLaneInfoByID (context *gin.Context) {	
	data := database.GetLaneInfoByID(context.Param("id"))
	if data.ID == 0 {
		context.IndentedJSON(http.StatusNotFound, "Error")
		return
	}
	fmt.Println("LaneInfo with ID(", context.Param("id"), ") -> ", data)
	context.IndentedJSON(http.StatusOK, data)
}

func PostLaneInfo (context *gin.Context)  {
	data := database.LaneData{}
	err := context.BindJSON(&data)
	if err != nil {
		context.IndentedJSON(http.StatusNotAcceptable,"Error : " + err.Error())
		return
	}
	newData := database.PostLaneInfo(data)
	context.IndentedJSON(http.StatusOK, newData)
}
