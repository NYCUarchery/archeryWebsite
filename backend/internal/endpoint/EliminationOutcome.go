package endpoint

import (
	"backend/internal/database"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

// loadMatchForAutomaticOutcome reloads both sides and every regulation score
// under the score-save transaction. The caller already holds the elimination
// lock; this preserves the established elimination -> match -> result locking
// order while preventing a decision from being made from stale arrow rows.
func loadMatchForAutomaticOutcome(tx *gorm.DB, matchID uint) (database.Match, error) {
	var match database.Match
	if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&match, matchID).Error; err != nil {
		return match, err
	}
	var results []database.MatchResult
	if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).Where("match_id = ?", matchID).Order("id ASC").Find(&results).Error; err != nil {
		return match, err
	}
	match.MatchResults = make([]*database.MatchResult, len(results))
	for resultIndex := range results {
		var ends []database.MatchEnd
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).Where("match_result_id = ?", results[resultIndex].ID).Order("id ASC").Find(&ends).Error; err != nil {
			return match, err
		}
		results[resultIndex].MatchEnds = make([]*database.MatchEnd, len(ends))
		for endIndex := range ends {
			var scores []database.MatchScore
			if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).Where("match_end_id = ?", ends[endIndex].ID).Order("id ASC").Find(&scores).Error; err != nil {
				return match, err
			}
			ends[endIndex].MatchScores = make([]*database.MatchScore, len(scores))
			for scoreIndex := range scores {
				ends[endIndex].MatchScores[scoreIndex] = &scores[scoreIndex]
			}
			results[resultIndex].MatchEnds[endIndex] = &ends[endIndex]
		}
		match.MatchResults[resultIndex] = &results[resultIndex]
	}
	return match, nil
}

func outcomeBowTypeForElimination(tx *gorm.DB, eliminationID uint) (string, error) {
	var relation struct{ BowType string }
	err := tx.Table("eliminations").
		Select("competition_group.bow_type AS bow_type").
		Joins("JOIN `groups` AS competition_group ON competition_group.id = eliminations.group_id").
		Where("eliminations.id = ?", eliminationID).
		Take(&relation).Error
	return relation.BowType, err
}

func matchIDForMatchResult(tx *gorm.DB, matchResultID uint) (uint, error) {
	var result database.MatchResult
	if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).Select("id", "match_id").First(&result, matchResultID).Error; err != nil {
		return 0, err
	}
	return result.MatchId, nil
}

func outcomeWouldChangeWinner(match database.Match, outcome database.MatchOutcome) bool {
	for _, result := range match.MatchResults {
		if result == nil {
			continue
		}
		wantWinner := outcome.Status == database.MatchOutcomeWinner && outcome.WinnerMatchResultID != nil && result.ID == *outcome.WinnerMatchResultID
		if result.IsWinner != wantWinner {
			return true
		}
	}
	return false
}

// applyAutomaticMatchOutcome runs only after an arrow-score save. Incomplete
// and unsupported matches deliberately preserve a manually selected winner.
// A changed completed result is not allowed to rewrite an already advanced
// bracket, but the score transaction itself still commits.
func applyAutomaticMatchOutcome(tx *gorm.DB, elimination database.Elimination, matchID uint) error {
	bowType, err := outcomeBowTypeForElimination(tx, elimination.ID)
	if err != nil {
		return err
	}
	match, err := loadMatchForAutomaticOutcome(tx, matchID)
	if err != nil {
		return err
	}
	outcome := database.ComputeMatchOutcome(match, bowType, elimination.TeamSize)
	if outcome.Status != database.MatchOutcomeWinner && outcome.Status != database.MatchOutcomeShootOff {
		return nil
	}
	if !outcomeWouldChangeWinner(match, outcome) {
		return nil
	}

	bracket, err := loadBracket(tx, elimination.ID)
	if err != nil {
		return err
	}
	locked, err := bracketWinnerMutationIsLocked(tx, bracket, elimination.ID, match.MatchResults[0].ID)
	if err != nil {
		return err
	}
	if locked {
		return nil
	}
	if outcome.Status == database.MatchOutcomeShootOff {
		return tx.Model(&database.MatchResult{}).Where("match_id = ?", matchID).Update("is_winner", false).Error
	}
	return tx.Model(&database.MatchResult{}).Where("match_id = ?", matchID).
		Update("is_winner", gorm.Expr("CASE WHEN id = ? THEN ? ELSE ? END", *outcome.WinnerMatchResultID, true, false)).Error
}

func applyAutomaticOutcomeForMatchResult(tx *gorm.DB, eliminationID, matchResultID uint) error {
	var elimination database.Elimination
	if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&elimination, eliminationID).Error; err != nil {
		return err
	}
	matchID, err := matchIDForMatchResult(tx, matchResultID)
	if err != nil {
		return err
	}
	return applyAutomaticMatchOutcome(tx, elimination, matchID)
}

func existingWinnerMatchesOutcome(match database.Match, outcome database.MatchOutcome) bool {
	return !outcomeWouldChangeWinner(match, outcome)
}

// decorateEliminationOutcomeStatuses is a read-only presentation helper. It
// computes status for current arrows without calling the score-save mutation;
// this is what preserves a manually chosen winner across progress-page loads.
func decorateEliminationOutcomeStatuses(elimination *database.Elimination, bowType string, medalsAwarded bool) {
	if elimination == nil {
		return
	}
	lastStage := len(elimination.Stages) - 1
	for stageIndex, stage := range elimination.Stages {
		if stage == nil {
			continue
		}
		for matchIndex, match := range stage.Matchs {
			if match == nil {
				continue
			}
			outcome := database.ComputeMatchOutcome(*match, bowType, elimination.TeamSize)
			match.OutcomeStatus = outcome.Status
			// A shoot-off is intentionally resolved by an administrator.  An
			// existing manual winner, including one already projected downstream,
			// therefore agrees with that score-derived state and is not a locked
			// score conflict.  Only a regulation winner can contradict advancement.
			if outcome.Status != database.MatchOutcomeWinner ||
				existingWinnerMatchesOutcome(*match, outcome) {
				continue
			}
			if loadedOutcomeMutationIsLocked(*elimination, stageIndex, matchIndex, lastStage, medalsAwarded) {
				match.OutcomeStatus = database.MatchOutcomeLockedConflict
			}
		}
	}
}

func decorateEliminationOutcomeStatusesForRead(elimination *database.Elimination) error {
	if elimination == nil {
		return nil
	}
	group, err := database.GetGroupInfoById(elimination.GroupId)
	if err != nil {
		return err
	}
	var medalCount int64
	if err := database.DB.Model(&database.Medal{}).
		Where("elimination_id = ? AND player_set_id <> 0", elimination.ID).
		Count(&medalCount).Error; err != nil {
		return err
	}
	decorateEliminationOutcomeStatuses(elimination, group.BowType, medalCount != 0)
	return nil
}

func decorateMatchOutcomeStatusForRead(match *database.Match) error {
	if match == nil {
		return nil
	}
	elimination, err := eliminationForMatch(match.ID)
	if err != nil {
		return err
	}
	fullElimination, err := database.GetEliminationWScoresById(elimination.ID)
	if err != nil {
		return err
	}
	if err := decorateEliminationOutcomeStatusesForRead(&fullElimination); err != nil {
		return err
	}
	for _, stage := range fullElimination.Stages {
		for _, candidate := range stage.Matchs {
			if candidate != nil && candidate.ID == match.ID {
				match.OutcomeStatus = candidate.OutcomeStatus
				return nil
			}
		}
	}
	return gorm.ErrRecordNotFound
}

func loadedOutcomeMutationIsLocked(elimination database.Elimination, stageIndex, matchIndex, lastStage int, medalsAwarded bool) bool {
	if stageIndex < 0 || stageIndex >= len(elimination.Stages) || lastStage < 0 {
		return false
	}
	if stageIndex == lastStage {
		return medalsAwarded
	}
	if stageIndex == lastStage-1 {
		finalMatches := elimination.Stages[lastStage].Matchs
		if len(finalMatches) == 1 {
			return finalMatches[0] != nil && matchIndex >= 0 && matchIndex < len(finalMatches[0].MatchResults) &&
				finalMatches[0].MatchResults[matchIndex] != nil && finalMatches[0].MatchResults[matchIndex].PlayerSetId != nil
		}
		if len(finalMatches) != 2 || matchIndex < 0 || matchIndex >= 2 {
			return false
		}
		for _, finalMatch := range finalMatches {
			if finalMatch == nil || len(finalMatch.MatchResults) <= matchIndex || finalMatch.MatchResults[matchIndex] == nil {
				return false
			}
			if finalMatch.MatchResults[matchIndex].PlayerSetId != nil {
				return true
			}
		}
		return false
	}
	nextStageIndex := stageIndex + 1
	if nextStageIndex >= len(elimination.Stages) || matchIndex < 0 {
		return false
	}
	targetMatchIndex, targetResultIndex := matchIndex/2, matchIndex%2
	nextStage := elimination.Stages[nextStageIndex]
	if nextStage == nil || targetMatchIndex >= len(nextStage.Matchs) || nextStage.Matchs[targetMatchIndex] == nil ||
		targetResultIndex >= len(nextStage.Matchs[targetMatchIndex].MatchResults) || nextStage.Matchs[targetMatchIndex].MatchResults[targetResultIndex] == nil {
		return false
	}
	return nextStage.Matchs[targetMatchIndex].MatchResults[targetResultIndex].PlayerSetId != nil
}
