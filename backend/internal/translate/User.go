package translate

import (
	"backend/internal/database"
	response "backend/internal/translate/Response"
	"fmt"
	"net/http"

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

// Get One User By ID godoc
//
//	@Summary		Show One User By ID
//	@Description	Get One User By ID
//	@Tags			User
//	@Produce		json
//	@Param			id	path	int	true	"User ID"
//	@Success		200	string	string
//	@Failure		400	string	string
//	@Router			/api/user/{id} [get]
func GetOnlyUserById(context *gin.Context) {
	var data database.User
	id := convert2uint(context, "id")
	IsExist, data := IsGetUser(context, id)
	if !IsExist {
		return
	}
	response.AcceptPrint(id, fmt.Sprint(data), "User")
	context.IndentedJSON(http.StatusOK, data)
}

func GetUserWParticipantsById(context *gin.Context) {
	var data database.User
	id := convert2uint(context, "id")
	if response.ErrorIdTest(context, id, database.GetUserIsExist(id), "User") {
		return
	}
	data, err := database.GetUserWParticipantsById(id)
	if response.ErrorInternalErrorTest(context, id, "Get User with participants ", err) {
		return
	}
	response.AcceptPrint(id, fmt.Sprint(data), "User with participants ")
	context.IndentedJSON(http.StatusOK, data)
}

// Post User godoc
//
//	@Summary		Create one User
//	@Description	Post one new User data with new id
//	@Tags			User
//	@Accept			json
//	@Produce		json
//	@Param			User	body	string	true	"User"
//	@Success		200		string	string
//	@Failure		400		string	string
//	@Router			/api/user [post]
func PostUser(context *gin.Context) {
	var data database.User
	err := context.BindJSON(&data)
	if response.ErrorReceiveDataTest(context, 0, "User", err) {
		return
	}
	data, err = database.CreateUser(data)
	if response.ErrorInternalErrorTest(context, 0, "Post User", err) {
		return
	}

	id := data.ID
	IsExist, newData := IsGetUser(context, id)
	if !IsExist {
		return
	}
	response.AcceptPrint(id, fmt.Sprint(newData), "User")
	context.IndentedJSON(http.StatusOK, newData)
}

// Update User godoc
//
//	@Summary		update one User
//	@Description	Put whole new User and overwrite with the id
//	@Tags			User
//	@Accept			json
//	@Produce		json
//	@Param			id		path	string	true	"User ID"
//	@Param			User	body	string	true	"User"
//	@Success		200		string	string
//	@Failure		400		string	string
//	@Failure		404		string	string
//	@Failure		500		string	string
//	@Router			/api/user/whole/{id} [put]
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

// Delete User by id godoc
//
//	@Summary		delete one User
//	@Description	delete one User by id
//	@Tags			User
//	@Accept			json
//	@Produce		json
//	@Param			id	path	string	true	"User ID"
//	@Success		200	string	string
//	@Failure		400	string	string
//	@Failure		404	string	string
//	@Router			/api/user/{id} [delete]
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
