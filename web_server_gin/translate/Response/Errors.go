package response

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func ErrorReceiveDataTest(context *gin.Context, err error, message string) bool {
	id := context.Param("id")
	if err != nil {
		context.IndentedJSON(http.StatusBadRequest,
			gin.H{"error": "bad request data \nID(" + id + "):" + message + " \n" + err.Error()})
		return true
	}
	return false
}

func ErrorReceiveDataNilTest(context *gin.Context, data interface{}, message string) bool {
	id := context.Param("id")
	if data == nil {
		context.IndentedJSON(http.StatusBadRequest,
			gin.H{"error": "bad request data is nil\n" + "ID(" + id + "):" + message + " \n"})
		return true
	}
	return false
}

func ErrorIdTest(context *gin.Context, isExist bool, message string) bool {
	id := context.Param("id")
	if !isExist {
		context.IndentedJSON(http.StatusBadRequest,
			gin.H{"error": "invalid " + message + " ID(" + id + ")"})
		return true
	}
	return false
}

func ErrorInternalErrorTest(context *gin.Context, err error, message string) bool {
	id := context.Param("id")
	if err != nil {
		context.IndentedJSON(http.StatusInternalServerError,
			gin.H{"error": message + " need fix ID(" + id + ") \n" + err.Error()})
		return true
	}
	return false
}
