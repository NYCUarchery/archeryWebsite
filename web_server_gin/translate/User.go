package translate

import (
	"fmt"
	"net/http"
	"web_server_gin/database"
	response "web_server_gin/translate/Response"

	"github.com/gin-gonic/gin"
)

func IsGetUser(context *gin.Context, id uint) (bool, database.User) {
	if response.ErrorIdTest(context, id, database.GetUserIsExist(id), "User") {
		return false, database.User{}
	}
	data, err := database.GetUserById(id)
	if response.ErrorInternalErrorTest(context, id, "Get User", err) {
		return false, data
	}
	response.AcceptPrint(id, fmt.Sprint(data), "User")
	return true, data
}

func GetUserById(context *gin.Context) {
	var data database.User
	id := convert2uint(context, "id")
	IsExist, data := IsGetUser(context, id)
	if !IsExist {
		return
	}
	response.AcceptPrint(id, fmt.Sprint(data), "User")
	context.IndentedJSON(http.StatusOK, data)
}

func PostUser(context *gin.Context) {
	var data database.User
	err := context.BindJSON(&data)
	id := convert2uint(context, "id")
	if response.ErrorReceiveDataTest(context, id, "User", err) {
		return
	}
	data, err = database.CreateUser(data)
	if response.ErrorInternalErrorTest(context, id, "Post User", err) {
		return
	}
	id = data.ID
	IsExist, newData := IsGetUser(context, id)
	if !IsExist {
		return
	}
	response.AcceptPrint(id, fmt.Sprint(newData), "User")
	context.IndentedJSON(http.StatusOK, newData)
}

func PutUser(context *gin.Context) {
	var data database.User
	err := context.BindJSON(&data)
	id := convert2uint(context, "id")
	if response.ErrorReceiveDataTest(context, id, "User", err) {
		return
	}
	success, err := database.UpdateUser(id, data)
	if response.ErrorInternalErrorTest(context, id, "Put User", err) {
		return
	} else if !success {
		response.ErrorIdTest(context, id, false, "User")
		return
	}

	IsExist, newData := IsGetUser(context, id)
	if !IsExist {
		return
	}
	response.AcceptPrint(id, fmt.Sprint(newData), "User")
	context.IndentedJSON(http.StatusOK, newData)
}

func DeleteUser(context *gin.Context) {
	id := convert2uint(context, "id")
	success, err := database.DeleteUser(id)
	if response.ErrorInternalErrorTest(context, id, "Delete User", err) {
		return
	} else if !success {
		response.ErrorIdTest(context, id, false, "User")
		return
	}
	response.AcceptDeleteSuccess(context, id, success, "User")
}
