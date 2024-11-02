package response

import (
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
)

// for parse test
func ErrorReceiveDataTest(context *gin.Context, id uint, message string, err error) bool {
	if err != nil {
		errorMessage := fmt.Sprintf("bad request data ID(%d): %s %s", id, message, err.Error())
		context.IndentedJSON(http.StatusBadRequest, gin.H{"error": errorMessage})
		return true
	}
	return false
}

// for coder manual test
func ErrorReceiveDataFormat(context *gin.Context, message string) {
	errorMessage := fmt.Sprintf("bad request data: %s", message)
	context.IndentedJSON(http.StatusBadRequest, gin.H{"error": errorMessage})
}

// for empty request
func ErrorReceiveDataNilTest(context *gin.Context, id uint, data interface{}, message string) bool {
	if data == nil {
		errorMessage := fmt.Sprintf("bad request data is nil ID(%d): %s ", id, message)
		context.IndentedJSON(http.StatusBadRequest, gin.H{"error": errorMessage})
		return true
	}
	return false
}

// for requests about querying certain data by id
func ErrorIdTest(context *gin.Context, id uint, isExist bool, message string) bool {
	if !isExist {
		errorMessage := fmt.Sprintf("invalid ID(%d) : %s", id, message)
		context.IndentedJSON(http.StatusBadRequest, gin.H{"error": errorMessage})
		return true
	}
	return false
}

// more backend error got
func ErrorInternalErrorTest(context *gin.Context, id uint, message string, err error) bool {
	if err != nil {
		errorMessage := fmt.Sprintf("%s need fix ID(%d) : %s", message, id, err.Error())
		context.IndentedJSON(http.StatusInternalServerError, gin.H{"error": errorMessage})
		return true
	}
	return false
}
