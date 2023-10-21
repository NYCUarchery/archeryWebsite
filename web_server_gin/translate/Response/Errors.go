package response

import (
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
)

func ErrorReceiveDataTest(context *gin.Context, id int, message string, err error) bool {
	if err != nil {
		errorMessage := fmt.Sprintf("bad request data\nID(%d): %s\n%s", id, message, err.Error())
		context.IndentedJSON(http.StatusBadRequest, gin.H{"error": errorMessage})
		return true
	}
	return false
}

func ErrorReceiveDataNilTest(context *gin.Context, id int, data interface{}, message string) bool {
	if data == nil {
		errorMessage := fmt.Sprintf("bad request data is nil\nID(%d): %s\n", id, message)
		context.IndentedJSON(http.StatusBadRequest, gin.H{"error": errorMessage})
		return true
	}
	return false
}

func ErrorIdTest(context *gin.Context, id int, isExist bool, message string) bool {
	if !isExist {
		errorMessage := fmt.Sprintf("invalid %s ID(%d)", message, id)
		context.IndentedJSON(http.StatusBadRequest, gin.H{"error": errorMessage})
		return true
	}
	return false
}

func ErrorInternalErrorTest(context *gin.Context, id int, message string, err error) bool {
	if err != nil {
		errorMessage := fmt.Sprintf("%s need fix ID(%d)\n%s", message, id, err.Error())
		context.IndentedJSON(http.StatusInternalServerError, gin.H{"error": errorMessage})
		return true
	}
	return false
}
