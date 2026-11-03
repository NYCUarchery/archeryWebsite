package endpoint

import (
	"backend/internal/database"
	"errors"
	"fmt"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

var errEliminationCreationConflict = errors.New("duplicate elimination or medal type")

// Lock the parent before any other transaction read so waiting creators see the committed state.
func lockCompetitionForEliminationCreation(tx *gorm.DB, competitionID uint) (database.Competition, error) {
	var competition database.Competition
	err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).Where("id = ?", competitionID).First(&competition).Error
	return competition, err
}

// The caller must hold the parent Competition lock for the entire transaction.
func ensureElimination(tx *gorm.DB, groupID uint, teamSize int) (database.Elimination, bool, error) {
	var eliminations []database.Elimination
	if err := tx.Where("group_id = ? AND team_size = ?", groupID, teamSize).Find(&eliminations).Error; err != nil {
		return database.Elimination{}, false, err
	}
	if len(eliminations) > 1 {
		return database.Elimination{}, false, fmt.Errorf("%w: group %d, team_size %d", errEliminationCreationConflict, groupID, teamSize)
	}
	changed := len(eliminations) == 0
	elimination := database.Elimination{GroupId: groupID, TeamSize: teamSize}
	if changed {
		if err := tx.Create(&elimination).Error; err != nil {
			return database.Elimination{}, false, err
		}
	} else {
		elimination = eliminations[0]
	}

	var medals []database.Medal
	if err := tx.Where("elimination_id = ?", elimination.ID).Find(&medals).Error; err != nil {
		return database.Elimination{}, false, err
	}
	seen := make(map[int]bool, len(medals))
	for _, medal := range medals {
		if seen[medal.Type] {
			return database.Elimination{}, false, fmt.Errorf("%w: elimination %d, medal type %d", errEliminationCreationConflict, elimination.ID, medal.Type)
		}
		seen[medal.Type] = true
	}
	for medalType := 0; medalType < 3; medalType++ {
		if seen[medalType] {
			continue
		}
		medal := database.Medal{EliminationId: elimination.ID, Type: medalType}
		if err := tx.Create(&medal).Error; err != nil {
			return database.Elimination{}, false, err
		}
		changed = true
	}
	return elimination, changed, nil
}
