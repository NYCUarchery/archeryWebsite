package translate

import(
	"fmt"
	"net/http"
	"web_server_gin/database"

	"github.com/gin-gonic/gin"
)

// Get User form DB
func FindAllUsers(context *gin.Context) {
	users := database.FindAllUsers()
	context.IndentedJSON(http.StatusOK, users)
}

// Get User by ID 
func FindByUserID(context *gin.Context) {
	user := database.FindByUserID(context.Param("id"))
	if user.ID == 0 {
		context.IndentedJSON(http.StatusNotFound, "Error")
		return
	}
	fmt.Println("User ->", user)
	context.IndentedJSON(http.StatusOK, user)
}