package database

import (
	"errors"
	"sort"
)

var errUnsupportedOutcomeTeamSize = errors.New("unsupported elimination team_size")

// MatchOutcomeStatus is a read-only, score-derived state for an elimination
// match. It is deliberately not persisted: only a score save may change a
// winner flag, while ordinary reads must leave manual decisions untouched.
type MatchOutcomeStatus string

const (
	MatchOutcomeIncomplete         MatchOutcomeStatus = "incomplete"
	MatchOutcomeWinner             MatchOutcomeStatus = "winner"
	MatchOutcomeShootOff           MatchOutcomeStatus = "shoot_off"
	MatchOutcomeLockedConflict     MatchOutcomeStatus = "locked_conflict"
	MatchOutcomeUnsupportedBowType MatchOutcomeStatus = "unsupported_bow_type"
)

// MatchOutcome is the pure result of applying the standard elimination rules
// to two sides of a match. WinnerMatchResultID is nil for incomplete and
// shoot-off matches.
type MatchOutcome struct {
	Status              MatchOutcomeStatus
	WinnerMatchResultID *uint
}

// ComputeMatchOutcome determines whether standard regulation shooting is
// complete and, if so, the candidate winner. It never reads or writes the
// database and does not mutate match. Only the configured regulation ends are
// considered; shoot-off scores are intentionally outside this calculation.
func ComputeMatchOutcome(match Match, bowType string, teamSize int) MatchOutcome {
	waves, arrows, err := matchEndsAndArrowsForOutcome(teamSize)
	if err != nil {
		return MatchOutcome{Status: MatchOutcomeIncomplete}
	}
	if !isSupportedOutcomeBowType(bowType) {
		return MatchOutcome{Status: MatchOutcomeUnsupportedBowType}
	}
	if len(match.MatchResults) != 2 || match.MatchResults[0] == nil || match.MatchResults[1] == nil ||
		match.MatchResults[0].PlayerSetId == nil || match.MatchResults[1].PlayerSetId == nil {
		return MatchOutcome{Status: MatchOutcomeIncomplete}
	}

	results := sortedOutcomeResults(match.MatchResults)
	if len(results) != 2 || results[0] == nil || results[1] == nil {
		return MatchOutcome{Status: MatchOutcomeIncomplete}
	}
	if isCompoundOutcomeBowType(bowType) {
		return computeCompoundMatchOutcome(results, waves, arrows)
	}
	return computeRecurveMatchOutcome(results, waves, arrows, teamSize)
}

func matchEndsAndArrowsForOutcome(teamSize int) (int, int, error) {
	switch teamSize {
	case 1:
		return 5, 3, nil
	case 2:
		return 4, 4, nil
	case 3:
		return 4, 6, nil
	default:
		return 0, 0, errUnsupportedOutcomeTeamSize
	}
}

// Keep bow-type acceptance narrow and explicit. Existing data uses both the
// Traditional Chinese labels and English labels from imported/seeder data.
func isRecurveOutcomeBowType(bowType string) bool {
	return bowType == "反曲弓" || bowType == "Recurve"
}

func isCompoundOutcomeBowType(bowType string) bool {
	return bowType == "複合弓" || bowType == "Compound"
}

func isSupportedOutcomeBowType(bowType string) bool {
	return isRecurveOutcomeBowType(bowType) || isCompoundOutcomeBowType(bowType)
}

func sortedOutcomeResults(results []*MatchResult) []*MatchResult {
	ordered := append([]*MatchResult(nil), results...)
	sort.SliceStable(ordered, func(left, right int) bool {
		if ordered[left] == nil {
			return false
		}
		if ordered[right] == nil {
			return true
		}
		return ordered[left].ID < ordered[right].ID
	})
	return ordered
}

func sortedOutcomeEnds(result *MatchResult) []*MatchEnd {
	ordered := append([]*MatchEnd(nil), result.MatchEnds...)
	sort.SliceStable(ordered, func(left, right int) bool {
		if ordered[left] == nil {
			return false
		}
		if ordered[right] == nil {
			return true
		}
		return ordered[left].ID < ordered[right].ID
	})
	return ordered
}

func completeOutcomeEnd(end *MatchEnd, arrows int) (int, bool) {
	if end == nil || len(end.MatchScores) != arrows {
		return 0, false
	}
	total := 0
	for _, score := range end.MatchScores {
		// Only the persisted elimination score domain is valid here: -1 is
		// unscored, 0 is M, 1..10 are rings, and 11 is X.  Treat corrupted
		// values defensively as incomplete instead of inferring a winner.
		if score == nil || score.Score < 0 || score.Score > 11 {
			return 0, false
		}
		total += matchScoreValue(score.Score)
	}
	return total, true
}

func computeCompoundMatchOutcome(results []*MatchResult, waves, arrows int) MatchOutcome {
	leftEnds, rightEnds := sortedOutcomeEnds(results[0]), sortedOutcomeEnds(results[1])
	if len(leftEnds) < waves || len(rightEnds) < waves {
		return MatchOutcome{Status: MatchOutcomeIncomplete}
	}
	leftTotal, rightTotal := 0, 0
	for index := 0; index < waves; index++ {
		leftScore, leftComplete := completeOutcomeEnd(leftEnds[index], arrows)
		rightScore, rightComplete := completeOutcomeEnd(rightEnds[index], arrows)
		if !leftComplete || !rightComplete {
			return MatchOutcome{Status: MatchOutcomeIncomplete}
		}
		leftTotal += leftScore
		rightTotal += rightScore
	}
	return outcomeForTotals(results, leftTotal, rightTotal)
}

func computeRecurveMatchOutcome(results []*MatchResult, waves, arrows, teamSize int) MatchOutcome {
	leftEnds, rightEnds := sortedOutcomeEnds(results[0]), sortedOutcomeEnds(results[1])
	leftPoints, rightPoints := 0, 0
	winningPoints := 5
	if teamSize == 1 {
		winningPoints = 6
	}
	for index := 0; index < waves; index++ {
		if index >= len(leftEnds) || index >= len(rightEnds) {
			return MatchOutcome{Status: MatchOutcomeIncomplete}
		}
		leftScore, leftComplete := completeOutcomeEnd(leftEnds[index], arrows)
		rightScore, rightComplete := completeOutcomeEnd(rightEnds[index], arrows)
		if !leftComplete || !rightComplete {
			return MatchOutcome{Status: MatchOutcomeIncomplete}
		}
		if leftScore > rightScore {
			leftPoints += 2
		} else if leftScore < rightScore {
			rightPoints += 2
		} else {
			leftPoints++
			rightPoints++
		}
		if leftPoints >= winningPoints || rightPoints >= winningPoints {
			return outcomeForTotals(results, leftPoints, rightPoints)
		}
	}
	// Regulation ends without an early winner have a defined shoot-off only
	// at the standard 5:5 (individual) or 4:4 (team/mixed) tie.
	if leftPoints == rightPoints {
		return MatchOutcome{Status: MatchOutcomeShootOff}
	}
	return outcomeForTotals(results, leftPoints, rightPoints)
}

func outcomeForTotals(results []*MatchResult, leftTotal, rightTotal int) MatchOutcome {
	if leftTotal == rightTotal {
		return MatchOutcome{Status: MatchOutcomeShootOff}
	}
	winner := results[0].ID
	if rightTotal > leftTotal {
		winner = results[1].ID
	}
	return MatchOutcome{Status: MatchOutcomeWinner, WinnerMatchResultID: &winner}
}
