package endpoint

import (
	"backend/internal/database"
	response "backend/internal/response"

	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
)

func IsGetQualification(context *gin.Context, id uint) (bool, database.Qualification) {
	if response.ErrorIdTest(context, id, database.GetQualificationIsExist(id), "Qualification") {
		return false, database.Qualification{}
	}
	data, err := database.GetOnlyQualification(id)
	if response.ErrorInternalErrorTest(context, id, "Get Qualification", err) {
		return false, data
	}
	response.AcceptPrint(id, fmt.Sprint(data), "Qualification")
	return true, data
}

func IsGetQualificationWLanes(context *gin.Context, id uint) (bool, database.Qualification) {
	if response.ErrorIdTest(context, id, database.GetQualificationIsExist(id), "Qualification") {
		return false, database.Qualification{}
	}
	data, err := database.GetQualificationWLanesByID(id)
	if response.ErrorInternalErrorTest(context, id, "Get Qualification with lanes", err) {
		return false, data
	}
	response.AcceptPrint(id, fmt.Sprint(data), "Qualification with lanes")
	return true, data
}

func IsGetQualificationWLanesPlayers(context *gin.Context, id uint) (bool, database.Qualification) {
	if response.ErrorIdTest(context, id, database.GetQualificationIsExist(id), "Qualification") {
		return false, database.Qualification{}
	}
	data, err := database.GetQualificationWLanesPlayersByID(id)
	if response.ErrorInternalErrorTest(context, id, "Get Qualification with lanes and players", err) {
		return false, data
	}
	response.AcceptPrint(id, fmt.Sprint(data), "Qualification with lanes and players")
	return true, data
}

func IsGetQualificationWUnassignedLanes(context *gin.Context, id uint) (bool, database.Qualification) {
	if response.ErrorIdTest(context, id, database.GetQualificationIsExist(id), "Qualification") {
		return false, database.Qualification{}
	}
	data, err := database.GetQualificationWUnassignedLanesByID(id)
	if response.ErrorInternalErrorTest(context, id, "Get Qualification with Unassigned lanes", err) {
		return false, data
	}
	response.AcceptPrint(id, fmt.Sprint(data), "Qualification with Unassigned lanes")
	return true, data
}

// Get One Qualification By ID godoc
//
//	@Summary		Show one Qualification
//	@Description	Get one Qualification by id
//	@Tags			Qualification
//	@Produce		json
//	@Param			id	path	int	true	"Qualification ID"
//	@Success		200	string	string
//	@Failure		400	string	string
//	@Router			/qualification/{id} [get]
func GetOnlyQualificationByID(context *gin.Context) {
	id := Convert2uint(context, "id")
	isExist, data := IsGetQualification(context, id)
	if !isExist {
		return
	}
	context.IndentedJSON(http.StatusOK, data)
}

// Get One Qualification with Lanes By ID godoc
//
//	@Summary		Show one Qualification
//	@Description	Get one Qualification with Lanes by id
//	@Tags			Qualification
//	@Produce		json
//	@Param			id	path	int	true	"Qualification ID"
//	@Success		200	string	string
//	@Failure		400	string	string
//	@Router			/qualification/lanes/{id} [get]
func GetQualificationWLanesByID(context *gin.Context) {
	id := Convert2uint(context, "id")
	isExist, data := IsGetQualificationWLanes(context, id)
	if !isExist {
		return
	}
	context.IndentedJSON(http.StatusOK, data)
}

// Get One Qualification with Unassigned Lanes By ID godoc
//
//	@Summary		Show one Qualification
//	@Description	Get one Qualification with Unassigned Lanes by id
//	@Tags			Qualification
//	@Produce		json
//	@Param			id	path	int	true	"Qualification ID"
//	@Success		200	string	string
//	@Failure		400	string	string
//	@Router			/data/qualification/lanes/Unassigned/{id} [get]
func GetQualificationWUnassignedLanesByID(context *gin.Context) {
	id := Convert2uint(context, "id")
	data := []database.Qualification{}
	isExist, wLaneData := IsGetQualificationWLanesPlayers(context, id)
	if !isExist {
		return
	}
	isExist, wUnassignedLaneData := IsGetQualificationWUnassignedLanes(context, id)
	if !isExist {
		return
	}
	data = append(data, wLaneData)
	data = append(data, wUnassignedLaneData)
	context.IndentedJSON(http.StatusOK, data)
}

// Get One Qualification with Lanes and Players By ID godoc
//
//	@Summary		Show one Qualification
//	@Description	Get one Qualification with Lanes and Players by id
//	@Tags			Qualification
//	@Produce		json
//	@Param			id	path	int	true	"Qualification ID"
//	@Success		200	string	string
//	@Failure		400	string	string
//	@Router			/data/qualification/lanes/players/{id} [get]
func GetQualificationWLanesPlayersByID(context *gin.Context) {
	id := Convert2uint(context, "id")
	if response.ErrorIdTest(context, id, database.GetQualificationIsExist(id), "Qualification") {
		return
	}
	data, err := database.GetQualificationWLanesPlayersByID(id)
	if response.ErrorInternalErrorTest(context, id, "Get Qualification with lanes and players", err) {
		return
	}
	response.AcceptPrint(id, fmt.Sprint(data), "Qualification with lanes and players")
	context.IndentedJSON(http.StatusOK, data)
}

// when group is created, qualification is created
// share same id with group
func PostQualificationThroughGroup(context *gin.Context, id uint) bool {
	var data database.Qualification
	/*insert data*/
	data, err := database.PostQualification(data)
	if response.ErrorInternalErrorTest(context, id, "Post Qualification", err) {
		return false
	}
	response.AcceptPrint(id, fmt.Sprint(data), "Qualification")
	return true
}

// Update Qualification godoc
//
//	@Summary		update one Qualification
//	@Description	Put whole new Qualification and overwrite with the id, and update lanes below it ,but cannot replace groupid
//	@Tags			Qualification
//	@Accept			json
//	@Produce		json
//	@Param			id				path	string	true	"Qualification ID"
//	@Param			Qualification	body	string	true	"Qualification"
//	@Success		200				string	string
//	@Failure		400				string	string
//	@Failure		404				string	string
//	@Failure		500				string	string
//	@Router			/qualification/whole/{id} [put]
func PutQualificationByID(context *gin.Context) {
	var data database.Qualification
	err := context.BindJSON(&data)
	id := Convert2uint(context, "id")
	/*parse data check*/
	if response.ErrorReceiveDataTest(context, id, "Qualification", err) {
		return
	}
	/*data is exist check*/
	success, oldData := IsGetQualification(context, id)
	if !success {
		return
	}
	/*check if qualification is belong to UnassignedGroup*/
	_, Group := IsGetGroupInfo(context, id)
	if Group.GroupIndex == -1 {
		response.ErrorIdTest(context, id, false, "Qualification is belong to UnassignedGroup, when update Qualification")
		return
	}
	/*check if lane start and end is valid*/
	group, _ := database.GetGroupInfoById(id)
	competitionId := group.CompetitionId
	fmt.Printf("competitionId: %d\n", competitionId)
	_, competition := IsGetOnlyCompetition(context, competitionId)
	UnassignedLaneId := competition.UnassignedLaneId
	fmt.Printf("UnassignedLaneId: %d\n", UnassignedLaneId)
	laneNum := competition.LanesNum
	if data.StartLaneNumber <= 0 || data.StartLaneNumber > laneNum || data.EndLaneNumber <= 0 || data.EndLaneNumber > laneNum || data.StartLaneNumber > data.EndLaneNumber {
		errorMessage := fmt.Sprintf("Lane number is invalid start: %d end: %d", data.StartLaneNumber, data.EndLaneNumber)
		context.IndentedJSON(http.StatusBadRequest, gin.H{"message": errorMessage})
		return
	}

	/*check if lanes are occupied*/
	laneQualificationIds := database.GetLaneQualificationId(UnassignedLaneId, data.StartLaneNumber, data.EndLaneNumber)
	UnassignedGroupId := competition.UnassignedGroupId
	for index, laneQualificationId := range laneQualificationIds {
		lanenumber := index + data.StartLaneNumber
		fmt.Printf("laneQualificationId: %d\n", laneQualificationId)
		fmt.Printf("lanenumber: %d\n", lanenumber)
		if laneQualificationId != UnassignedGroupId && laneQualificationId != id {
			errorMessage := fmt.Sprintf("Lane number %d is occupied", lanenumber)
			context.IndentedJSON(http.StatusBadRequest, gin.H{"message": errorMessage})
			return
		}
	}

	fmt.Printf("\n")
	/*update lanes' qualificationId*/
	oldLaneStart := oldData.StartLaneNumber
	oldLaneEnd := oldData.EndLaneNumber
	if oldLaneStart == 0 && oldLaneEnd == 0 {
		/*for default as 0*/
		oldLaneStart++
		oldLaneEnd++
	}
	for index := oldLaneStart; index <= oldLaneEnd; index++ {
		laneId := UnassignedLaneId + uint(index)
		fmt.Printf("laneId: %d\n", laneId)
		fmt.Printf("index: %d\n", index)
		success := UpdateLaneQualificationId(context, laneId, UnassignedGroupId)
		if !success {
			return
		}
	}
	fmt.Printf("\n")
	for index := data.StartLaneNumber; index <= data.EndLaneNumber; index++ {
		laneId := UnassignedLaneId + uint(index)
		fmt.Printf("laneId: %d\n", laneId)
		fmt.Printf("index: %d\n", index)
		success := UpdateLaneQualificationId(context, laneId, id)
		if !success {
			return
		}
	}

	/*update data*/
	isChanged, err := database.UpdateQualification(id, data)
	if response.ErrorInternalErrorTest(context, id, "Update Qualification", err) {
		return
	} else if response.ErrorIdTest(context, id, isChanged, "Qualification") {
		return
	}

	/*return data*/
	data, err = database.GetOnlyQualification(id)
	if response.ErrorInternalErrorTest(context, id, "Get Qualification", err) {
		return
	}
	response.AcceptPrint(id, fmt.Sprint(data), "Qualification")
	context.IndentedJSON(http.StatusOK, data)
}

// delete qualification when group is deleted
// cannot delete qualification solely
// update lanes' qualification id to UnassignedGroup
func DeleteQualificationThroughGroup(context *gin.Context, id uint) bool {
	/*check data exist*/
	isExist, oldData := IsGetQualification(context, id)
	if !isExist {
		return false
	}
	/*update lanes' qualification Id*/
	group, _ := database.GetGroupInfoById(id)
	competitionId := group.CompetitionId
	_, competition := IsGetOnlyCompetition(context, competitionId)
	UnassignedGroupId := competition.UnassignedGroupId
	UnassignedLaneId := competition.UnassignedLaneId
	oldLaneStart := oldData.StartLaneNumber
	oldLaneEnd := oldData.EndLaneNumber
	if oldLaneStart != 0 && oldLaneEnd != 0 {
		for index := oldLaneStart; index <= oldLaneEnd; index++ {
			laneId := UnassignedLaneId + uint(index)
			fmt.Printf("laneId: %d\n", laneId)
			fmt.Printf("index: %d\n", index)
			success := UpdateLaneQualificationId(context, laneId, UnassignedGroupId)
			if !success {
				return false
			}
		}
	}

	/*delete data*/
	isChanged, err := database.DeleteQualification(id)
	if response.ErrorInternalErrorTest(context, id, "Delete Qualification", err) {
		return false
	} else if !isChanged {
		response.AcceptNotChange(context, id, isChanged)
		return false
	}
	response.AcceptPrint(id, fmt.Sprint(id), "Qualification")
	return true
}

func DeleteQualificationThroughGroupThroughCompetition(context *gin.Context, id uint) bool {
	/*check data exist*/
	isExist, _ := IsGetQualification(context, id)
	if !isExist {
		return false
	}

	/*delete data*/
	isChanged, err := database.DeleteQualification(id)
	if response.ErrorInternalErrorTest(context, id, "Delete Qualification", err) {
		return false
	} else if !isChanged {
		response.AcceptNotChange(context, id, isChanged)
		return false
	}
	response.AcceptPrint(id, fmt.Sprint(id), "Qualification")
	return true
}
