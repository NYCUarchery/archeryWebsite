package database

type LaneStage struct { // DB : land_stage
	ID            uint     `json:"id"`
    Status        string   `json:"status"`
    AllScores     [][]int  `json:"all_scores"`
    Totals        []int    `json:"totals"`
    Confirmations []bool   `json:"confirmations"`
}	
type LaneData struct { // DB : lane_data
	ID           uint     `json:"id"`
    LaneNum      int      `json:"lane_num"`
    UserIds      []int    `json:"user_ids"`
    UserNames    []string `json:"user_names"`
    ScoreNum     int      `json:"score_num"`
    StageNum     int      `json:"stage_num"`
    Stages       []LaneStage  `json:"stages"`
}

func GetLaneInfoByID (ID string) LaneData { 
	var data LaneData
	DB.Where("id = ?", ID).First(&ID)
	return data 
}

// data is in http body 
func PostLaneInfo (data LaneData) LaneData {
	DB.Create(&data)
	return data
}