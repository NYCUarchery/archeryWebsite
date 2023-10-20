package response

import (
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
)

func AcceptDeleteSuccess(context *gin.Context, isChanged bool, message string) {
	if isChanged {
		context.IndentedJSON(http.StatusOK, gin.H{"message": "Delete " + message + " success"})
	} else {
		context.IndentedJSON(http.StatusOK, gin.H{"message": "Delete " + message + " fail"})
	}
}

func AcceptNotChange(context *gin.Context, isChange bool, message string) bool {
	if !isChange {
		context.IndentedJSON(http.StatusNoContent, gin.H{"message": message + " no change"})
		return true
	}
	return false
}

func AcceptPrint(id int, data string, message string) {
	fmt.Printf("%s with ID(%d) -> %v\n", message, id, data)
}
