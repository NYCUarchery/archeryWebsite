package response

type Response struct {
	Result string `json:"result" example:"result description"`
}

type UIDResponse struct {
	UID string `json:"uid" example:"your uid"`
}

type CompResponse struct {
	Result string `json:"result" example:"result description"`
	CompID int `json:"compID" example:"87"`
}

type UserInfoResponse struct {
	Result 			string `json:"result" example:"success"`
	Name 			string `json:"name" example:"user name"`
	Email 			string `json:"email" example:"user email"`
	InstitutionID	string `json:"institutionID" example:"user institution id"`
	Overview		string `json:"overview" example:"user overview"`
}

type Group struct {
	ID 				uint   `json:"id" example:"87"`
	CompetitionID 	uint   `json:"competition_id" example:"87"`
	GroupName		string `json:"groupName" example:"group name"`
	BowType		 	string `json:"bowType" example:"bow type"`
	GameRange 		int	   `json:"gameRange" example:"50"`
}

type CompInfoResponse struct {
	Result 			string 		`json:"result" example:"success"`
	Name 			string 		`json:"name" example:"competition name"`
	Date 			string 		`json:"date" example:"2006-01-02T15:04:05+08:00"`
	HostID 			string 		`json:"hostID" example:"87"`
	ScoreboardURL 	string 		`json:"scoreboardURL" example:"Scoreboard URL"`
	Overview 		string 		`json:"overview" example:"overview"`
	Groups      	[]Group 	`json:"groups"`
	Participants 	string 		`json:"participants" example:"[1, 2, 3, 87]"`
}

type Competition struct {
	Name 			string 		`json:"name" example:"competition name"`
	Date 			string 		`json:"date" example:"2006-01-02T15:04:05+08:00"`
	HostID 			string 		`json:"hostID" example:"87"`
	ScoreboardURL 	string 		`json:"scoreboardURL" example:"Scoreboard URL"`
	Overview 		string 		`json:"overview" example:"overview"`
}

type AllCompInfoResponse struct {
	Result  		string 			`json:"result" example:"success"`
	Competitions 	[]Competition 	`json:"competitions"`
}

