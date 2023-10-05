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
	Organization	string `json:"organization" example:"user organization"`
	Overview		string `json:"overview" example:"user overview"`
}

type Category struct {
	Des   string `json:"des" example:"wc"`
	Dis   string `json:"dis" example:"50"`
}

type CompInfoResponse struct {
	Result 			string 		`json:"result" example:"success"`
	Name 			string 		`json:"name" example:"competition name"`
	Date 			string 		`json:"date" example:"2006-01-02T15:04:05+08:00"`
	HostID 			string 		`json:"hostID" example:"87"`
	ScoreboardURL 	string 		`json:"scoreboardURL" example:"Scoreboard URL"`
	Overview 		string 		`json:"overview" example:"overview"`
	Categories      []Category 	`json:"categories"`
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