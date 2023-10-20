package response

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func ErrorReceiveDataTest(context *gin.Context, err error, message string) {
	if err != nil {
		context.IndentedJSON(http.StatusBadRequest,
			gin.H{"error": "bad request data in " + message + " \n" + err.Error()})
		context.Abort()
	}
}

func ErrorReceiveDataNilTest(context *gin.Context, data interface{}, message string) {
	if data == nil {
		context.IndentedJSON(http.StatusBadRequest,
			gin.H{"error": "bad request data is nil\n" + message})
		context.Abort()
	}
}

func ErrorIdTest(context *gin.Context, id int, message string) {
	if id == 0 {
		context.IndentedJSON(http.StatusBadRequest,
			gin.H{"error": "invalid " + message + " ID"})
		context.Abort()
	}
}

func ErrorInternalErrorTest(context *gin.Context, err error) {
	if err != nil {
		context.IndentedJSON(http.StatusInternalServerError,
			gin.H{"error": err.Error()})
		context.Abort()
	}
}
