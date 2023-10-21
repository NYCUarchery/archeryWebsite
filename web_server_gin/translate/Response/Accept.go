package response

import (
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
)

func AcceptDeleteSuccess(context *gin.Context, id int, isChanged bool, message string) {
	if isChanged {
		errorMessage := fmt.Sprintf("Delete ID(%d): %s success", id, message)
		context.IndentedJSON(http.StatusOK, gin.H{"message": errorMessage})
	} else {
		errorMessage := fmt.Sprintf("Delete ID(%d): %s fail", id, message)
		context.IndentedJSON(http.StatusOK, gin.H{"message": errorMessage})
	}
}

func AcceptNotChange(context *gin.Context, id int, isChange bool, message string) bool {
	if !isChange {
		errorMessage := fmt.Sprintf("Delete ID(%d): %s no change ", id, message)
		context.IndentedJSON(http.StatusNoContent, gin.H{"message": errorMessage})
		return true
	}
	return false
}

func AcceptPrint(id int, data string, message string) {
	fmt.Printf("%s with ID(%d) -> %v\n", message, id, data)
}
