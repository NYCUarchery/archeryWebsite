package response

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func ErrorReceiveDataTest(context *gin.Context, err error, message string) bool {
	if err != nil {
		context.IndentedJSON(http.StatusBadRequest,
			gin.H{"error": "bad request data in " + message + " \n" + err.Error()})
		return true
	}
	return false
}

func ErrorReceiveDataNilTest(context *gin.Context, data interface{}, message string) bool {
	if data == nil {
		context.IndentedJSON(http.StatusBadRequest,
			gin.H{"error": "bad request data is nil\n" + message + " \n"})
		return true
	}
	return false
}

func ErrorIdTest(context *gin.Context, isExist bool, message string) bool {
	if !isExist {
		context.IndentedJSON(http.StatusBadRequest,
			gin.H{"error": "invalid " + message + " ID"})
		return true
	}
	return false
}

func ErrorInternalErrorTest(context *gin.Context, err error, message string) bool {
	if err != nil {
		context.IndentedJSON(http.StatusInternalServerError,
			gin.H{"error": message + " need fix " + err.Error()})
		return true
	}
	return false
}
