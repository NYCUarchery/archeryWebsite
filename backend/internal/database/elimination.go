package database

import (
	"log"
	"sort"

	"gorm.io/gorm"
)

type Elimination struct {
	ID                  uint         `json:"id"                  gorm:"primary_key"`
	GroupId             uint         `json:"group_id"            gorm:"constraint:oneToMany;"`
	CurrentStage        uint         `json:"current_stage"`
	CurrentEnd          uint         `json:"current_end"`
	TeamSize            int          `json:"team_size"`
	BracketSeedCount    int          `json:"bracket_seed_count"`
	BracketRosterLocked bool         `json:"bracket_roster_locked"`
	PlayerSets          []*PlayerSet `json:"player_sets"         gorm:"constraint:OnDelete:CASCADE;"`
	Stages              []*Stage     `json:"stages"              gorm:"constraint:OnDelete:CASCADE;"`
	Medals              []*Medal     `json:"medals"              gorm:"constraint:OnDelete:CASCADE;"`
}
type Stage struct {
	ID            uint     `json:"id"        gorm:"primary_key"`
	EliminationId uint     `json:"elimination_id"`
	Matchs        []*Match `json:"matchs" gorm:"constraint:OnDelete:CASCADE;"`
}

type Match struct {
	ID            uint               `json:"id"        gorm:"primary_key"`
	StageId       uint               `json:"stage_id"`
	OutcomeStatus MatchOutcomeStatus `json:"outcome_status,omitempty" gorm:"-" readonly:"true" enums:"incomplete,winner,shoot_off,locked_conflict,unsupported_bow_type"`
	MatchResults  []*MatchResult     `json:"match_results" gorm:"constraint:OnDelete:CASCADE;"`
}

// ComputeMatchPoints returns a copy with set points derived from the two
// complete, ordered sides of a match. It performs no database access and does
// not mutate its input. Incomplete ends retain the prior cumulative value
// without receiving points.
func ComputeMatchPoints(match Match) Match {
	computed := match
	computed.MatchResults = make([]*MatchResult, len(match.MatchResults))
	for resultIndex, result := range match.MatchResults {
		if result == nil {
			continue
		}
		resultCopy := *result
		computed.MatchResults[resultIndex] = &resultCopy
		resultCopy.MatchEnds = make([]*MatchEnd, len(result.MatchEnds))
		for endIndex, end := range result.MatchEnds {
			if end == nil {
				continue
			}
			endCopy := *end
			resultCopy.MatchEnds[endIndex] = &endCopy
		}
		sort.SliceStable(resultCopy.MatchEnds, func(left, right int) bool {
			if resultCopy.MatchEnds[left] == nil {
				return false
			}
			if resultCopy.MatchEnds[right] == nil {
				return true
			}
			return resultCopy.MatchEnds[left].ID < resultCopy.MatchEnds[right].ID
		})
	}
	sort.SliceStable(computed.MatchResults, func(left, right int) bool {
		if computed.MatchResults[left] == nil {
			return false
		}
		if computed.MatchResults[right] == nil {
			return true
		}
		return computed.MatchResults[left].ID < computed.MatchResults[right].ID
	})
	for _, result := range computed.MatchResults {
		if result == nil {
			continue
		}
		result.TotalPoints = 0
		for _, end := range result.MatchEnds {
			if end == nil {
				continue
			}
			end.Points = nil
			end.CumulativePoints = 0
		}
	}
	if len(computed.MatchResults) != 2 || computed.MatchResults[0] == nil || computed.MatchResults[1] == nil {
		return computed
	}

	left := computed.MatchResults[0]
	right := computed.MatchResults[1]
	leftCumulative, rightCumulative := 0, 0
	endCount := len(left.MatchEnds)
	if len(right.MatchEnds) > endCount {
		endCount = len(right.MatchEnds)
	}
	for index := 0; index < endCount; index++ {
		var leftEnd, rightEnd *MatchEnd
		if index < len(left.MatchEnds) {
			leftEnd = left.MatchEnds[index]
		}
		if index < len(right.MatchEnds) {
			rightEnd = right.MatchEnds[index]
		}

		leftScore, rightScore, complete := comparableEndScores(leftEnd, rightEnd)
		if complete {
			leftPoints, rightPoints := 1, 1
			if leftScore > rightScore {
				leftPoints, rightPoints = 2, 0
			} else if leftScore < rightScore {
				leftPoints, rightPoints = 0, 2
			}
			leftEnd.Points = &leftPoints
			rightEnd.Points = &rightPoints
			leftCumulative += leftPoints
			rightCumulative += rightPoints
		}
		if leftEnd != nil {
			leftEnd.CumulativePoints = leftCumulative
		}
		if rightEnd != nil {
			rightEnd.CumulativePoints = rightCumulative
		}
	}
	left.TotalPoints = leftCumulative
	right.TotalPoints = rightCumulative
	return computed
}

func comparableEndScores(left, right *MatchEnd) (int, int, bool) {
	if left == nil || right == nil || len(left.MatchScores) == 0 || len(left.MatchScores) != len(right.MatchScores) {
		return 0, 0, false
	}
	leftTotal, rightTotal := 0, 0
	for index := range left.MatchScores {
		leftScore := left.MatchScores[index].Score
		rightScore := right.MatchScores[index].Score
		if leftScore < 0 || rightScore < 0 {
			return 0, 0, false
		}
		leftTotal += matchScoreValue(leftScore)
		rightTotal += matchScoreValue(rightScore)
	}
	return leftTotal, rightTotal, true
}

func matchScoreValue(score int) int {
	if score > 10 {
		return 10
	}
	return score
}

func computeEliminationMatchPoints(elimination *Elimination) {
	for _, stage := range elimination.Stages {
		for _, match := range stage.Matchs {
			computed := ComputeMatchPoints(*match)
			*match = computed
		}
	}
}

func InitElimination() {
	DB.AutoMigrate(&Elimination{})
	DB.AutoMigrate(&Stage{})
	DB.AutoMigrate(&Match{})
}

func DropElimination() {
	if DB.Migrator().HasTable(&Match{}) {
		if err := DB.Migrator().DropTable(&Match{}); err != nil {
			log.Println("Failed to drop Match:", err)
			return
		}
	}
	if DB.Migrator().HasTable(&Stage{}) {
		if err := DB.Migrator().DropTable(&Stage{}); err != nil {
			log.Println("Failed to drop Stage:", err)
			return
		}
	}
	if DB.Migrator().HasTable(&Elimination{}) {
		if err := DB.Migrator().DropTable(&Elimination{}); err != nil {
			log.Println("Failed to drop Elimination:", err)
			return
		}
	}
}

func GetEliminationIsExist(id uint) bool {
	var data Elimination
	DB.Table("eliminations").Where("id = ?", id).First(&data)
	return data.ID != 0
}

func GetStageIsExist(id uint) bool {
	var data Stage
	DB.Table("stages").Where("id = ?", id).First(&data)
	return data.ID != 0
}

func GetMatchIsExist(id uint) bool {
	var data Match
	DB.Table("matches").Where("id = ?", id).First(&data)
	return data.ID != 0
}

func GetOnlyEliminationById(id uint) (Elimination, error) {
	var data Elimination
	result := DB.Table("eliminations").Where("id = ?", id).First(&data)
	return data, result.Error
}

func GetEliminationByGroupId(groupId uint) ([]Elimination, error) {
	var eliminations []Elimination
	result := DB.Where("group_id = ?", groupId).
		Select("id, team_size").
		Order("team_size ASC").
		Find(&eliminations)
	return eliminations, result.Error
}

func GetEliminationWPlayerSetsById(id uint) (Elimination, error) {
	var data Elimination
	result := DB.
		Preload("PlayerSets", func(*gorm.DB) *gorm.DB {
			return DB.Order("`rank` asc")
		}).
		Model(&Elimination{}).
		Where("id = ?", id).
		First(&data)
	return data, result.Error
}

func GetEliminationWStagesMatchesById(id uint) (Elimination, error) {
	var data Elimination
	result := DB.
		Preload("Stages", func(tx *gorm.DB) *gorm.DB {
			return tx.Order("id asc")
		}).
		Preload("Stages.Matchs", func(tx *gorm.DB) *gorm.DB {
			return tx.Order("id asc")
		}).
		Model(&Elimination{}).
		Where("id = ?", id).
		First(&data)
	return data, result.Error
}

func GetEliminationWScoresById(id uint) (Elimination, error) {
	var data Elimination
	result := DB.
		Preload("Stages", func(tx *gorm.DB) *gorm.DB {
			return tx.Order("id asc")
		}).
		Preload("Stages.Matchs", func(tx *gorm.DB) *gorm.DB {
			return tx.Order("id asc")
		}).
		Preload("Stages.Matchs.MatchResults", func(tx *gorm.DB) *gorm.DB {
			return tx.Order("id asc")
		}).
		Preload("Stages.Matchs.MatchResults.MatchEnds", func(tx *gorm.DB) *gorm.DB {
			return tx.Order("id asc")
		}).
		Preload("Stages.Matchs.MatchResults.MatchEnds.MatchScores", func(tx *gorm.DB) *gorm.DB {
			return tx.Order("id asc")
		}).
		Model(&Elimination{}).
		Where("id = ?", id).
		First(&data)
	if result.Error == nil {
		computeEliminationMatchPoints(&data)
	}
	return data, result.Error
}

func GetEliminationTeamSizeByMatchResultId(matchResultId uint) (int, error) {
	var teamSize int
	subQueryA := DB.
		Table("match_results").
		Select("match_results.match_id").
		Where("match_results.id = ?", matchResultId)
	subQueryB := DB.
		Table("matches").
		Select("matches.stage_id").
		Joins("JOIN (?) AS A ON A.match_id = matches.id", subQueryA)
	subQueryC := DB.
		Table("stages").
		Select("stages.elimination_id").
		Joins("JOIN (?) AS B ON B.stage_id = stages.id", subQueryB)
	result := DB.Table("eliminations").
		Select("eliminations.team_size").
		Joins("JOIN (?) AS C ON C.elimination_id = eliminations.id", subQueryC).
		Scan(&teamSize)

	return teamSize, result.Error
}

func GetEliminationById(id uint) (Elimination, error) {
	var data Elimination
	result := DB.
		Preload("PlayerSets", func(tx *gorm.DB) *gorm.DB {
			return tx.Order("`rank` asc").
				Preload("Players")
		}).
		Preload("Medals").
		Preload("Stages", func(tx *gorm.DB) *gorm.DB {
			return tx.Order("id asc")
		}).
		Preload("Stages.Matchs", func(tx *gorm.DB) *gorm.DB {
			return tx.Order("id asc")
		}).
		Preload("Stages.Matchs.MatchResults", func(tx *gorm.DB) *gorm.DB {
			return tx.Order("id asc")
		}).
		Preload("Stages.Matchs.MatchResults.MatchEnds", func(tx *gorm.DB) *gorm.DB {
			return tx.Order("id asc")
		}).
		Preload("Stages.Matchs.MatchResults.MatchEnds.MatchScores", func(tx *gorm.DB) *gorm.DB {
			return tx.Order("score DESC")
		}).
		Model(&Elimination{}).
		Where("id = ?", id).
		First(&data)
	if result.Error == nil {
		computeEliminationMatchPoints(&data)
	}
	return data, result.Error
}

func GetStageById(id uint) (Stage, error) {
	var data Stage
	result := DB.
		Model(&Stage{}).
		Where("id = ?", id).
		First(&data)
	return data, result.Error
}

func GetMatchWScoresById(id uint) (Match, error) {
	var data Match
	result := DB.
		Preload("MatchResults", func(tx *gorm.DB) *gorm.DB {
			return tx.Order("id asc").Preload("PlayerSet")
		}).
		Preload("MatchResults.MatchEnds", func(tx *gorm.DB) *gorm.DB {
			return tx.Order("id asc")
		}).
		Preload("MatchResults.MatchEnds.MatchScores", func(tx *gorm.DB) *gorm.DB {
			return tx.Order("score DESC")
		}).
		Model(&Match{}).
		Where("id = ?", id).
		First(&data)
	if result.Error == nil {
		data = ComputeMatchPoints(data)
	}
	return data, result.Error
}

func CreateElimination(data Elimination) (Elimination, error) {
	result := DB.Model(&Elimination{}).Create(&data)
	return data, result.Error
}

func CreateStage(data Stage) (Stage, error) {
	result := DB.Model(&Stage{}).Create(&data)
	return data, result.Error
}

func CreateMatch(data Match) (Match, error) {
	result := DB.Model(&Match{}).Create(&data)
	return data, result.Error
}

func UpdateEliminationCurrentStagePlus(id uint) error {
	result := DB.
		Model(&Elimination{}).
		Where("id = ?", id).
		Update("CurrentStage", gorm.Expr("current_stage + ?", 1))
	return result.Error
}
func UpdateEliminationCurrentStageMinus(id uint) error {
	result := DB.
		Model(&Elimination{}).
		Where("id = ?", id).
		Update("CurrentStage", gorm.Expr("current_stage - ?", 1))
	return result.Error
}
func UpdateEliminationCurrentEndPlus(id uint) error {
	result := DB.
		Model(&Elimination{}).
		Where("id = ?", id).
		Update("CurrentEnd", gorm.Expr("current_end + ?", 1))
	return result.Error
}
func UpdateEliminationCurrentEndMinus(id uint) error {
	result := DB.
		Model(&Elimination{}).
		Where("id = ?", id).
		Update("CurrentEnd", gorm.Expr("current_end - ?", 1))
	return result.Error
}

// UpdateEliminationProgress changes stage and end in one database statement so
// the player display never observes a partially-updated progress value.
// Callers must validate the selected stage and end before updating.
func UpdateEliminationProgress(id uint, currentStage uint, currentEnd uint) error {
	result := DB.Model(&Elimination{}).
		Where("id = ?", id).
		Updates(map[string]interface{}{
			"current_stage": currentStage,
			"current_end":   currentEnd,
		})
	return result.Error
}

func DeleteElimination(id uint) (bool, error) {
	result := DB.Delete(&Elimination{}, "id =?", id)
	isChanged := result.RowsAffected != 0
	return isChanged, result.Error
}
