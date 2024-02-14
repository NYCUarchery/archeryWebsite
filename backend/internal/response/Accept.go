package response

import (
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
)

func AcceptDeleteSuccess(context *gin.Context, id uint, isChanged bool, message string) {
	if isChanged {
		errorMessage := fmt.Sprintf("Delete ID(%d): %s delete success", id, message)
		context.IndentedJSON(http.StatusOK, gin.H{"message": errorMessage})
	} else {
		errorMessage := fmt.Sprintf("Delete ID(%d): %s delete failed", id, message)
		context.IndentedJSON(http.StatusBadRequest, gin.H{"message": errorMessage})
	}
}

func AcceptNotChange(context *gin.Context, id uint, isChange bool, message string) bool {
	if !isChange {
		errorMessage := fmt.Sprintf("Delete ID(%d): %s no change ", id, message)
		fmt.Println(errorMessage)
		context.Writer.WriteHeader(204)
		return true
	}
	return false
}

func AcceptPrint(id uint, data string, message string) {
	fmt.Printf("%s with ID(%d) -> %v\n", message, id, data)
}
