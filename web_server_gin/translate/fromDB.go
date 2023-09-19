package translate

import (
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

/* post new user data */
func PostUser(context *gin.Context) {
	user := database.User{}
	err := context.BindJSON(&user)
	if err != nil {
		context.IndentedJSON(http.StatusNotAcceptable, "Error : "+err.Error())
		return
	}
	newUser := database.CreateUser(user)
	context.IndentedJSON(http.StatusOK, newUser)
}

/*delete user by ID*/
func DeleteUser(context *gin.Context) {
	if !database.DeleteUser(context.Param("id")) {
		context.IndentedJSON(http.StatusNotFound, "Error")
		return
	}
	context.IndentedJSON(http.StatusOK, "Successfully")
}

/*updata user*/
func UpdataUser(context *gin.Context) {
	user := database.User{}
	err := context.BindJSON(&user)
	if err != nil {
		context.IndentedJSON(http.StatusBadRequest, "Error")
		return
	}
	user = database.UpdataUser(context.Param("id"), user)
	if user.ID == 0 {
		context.IndentedJSON(http.StatusNotFound, "Error")
		return
	}
	context.IndentedJSON(http.StatusOK, user)
}
