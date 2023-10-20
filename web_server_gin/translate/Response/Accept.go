package response

import (
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
)

func AcceptDeleteSuccess(context *gin.Context, message string) {
	context.IndentedJSON(http.StatusOK, gin.H{"message": "Delete " + message + " success"})
}

func AcceptNotChange(context *gin.Context, isChange bool, message string) {
	if !isChange {
		context.IndentedJSON(http.StatusNoContent, gin.H{"message": message + " no change"})
		context.Abort()
	}
}

func AcceptPrint(id, data, message string) {
	fmt.Printf(message, " with ID(%v) -> %v\n", id, data)
}
