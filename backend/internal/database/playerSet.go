package database

import (
	"errors"
	"log"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type PlayerSet struct {
	ID            uint      `json:"id"        gorm:"primary_key"`
	EliminationId uint      `json:"elimination_id"`
	TotalScore    int       `json:"total_score"`
	Rank          int       `json:"rank"`
	SetName       string    `json:"set_name"`
	Players       []*Player `json:"players" gorm:"many2many:player_set_match_tables;"`
}

type PlayerSetMatchTable struct {
	ID          uint `json:"id"          gorm:"primary_key"`
	PlayerId    uint `json:"player_id"`
	PlayerSetId uint `json:"player_set_id"`
}

func InitPlayerSet() {
	if !DB.Migrator().HasTable(&PlayerSet{}) {
		if err := DB.Table("player_sets").AutoMigrate(&PlayerSet{}); err != nil {
			log.Println("Failed to auto migrate PlayerSet:", err)
			return
		}
	}

	if !DB.Migrator().HasTable(&PlayerSetMatchTable{}) {
		if err := DB.Table("player_set_match_tables").AutoMigrate(&PlayerSetMatchTable{}); err != nil {
			log.Println("Failed to auto migrate PlayerSetMatchTable:", err)
			return
		}
	}
}

func DropPlayerSet() {
	if DB.Migrator().HasTable(&PlayerSetMatchTable{}) {
		if err := DB.Table("player_set_match_tables").Migrator().DropTable(&PlayerSetMatchTable{}); err != nil {
			log.Println("Failed to drop PlayerSetMatchTable:", err)
			return
		}
	}

	if DB.Migrator().HasTable(&PlayerSet{}) {
		if err := DB.Migrator().DropTable(&PlayerSet{}); err != nil {
			log.Println("Failed to drop PlayerSet:", err)
			return
		}
	}
}

func GetPlayerSetIsExist(id uint) bool {
	var data PlayerSet
	DB.Table("player_sets").Where("id = ?", id).First(&data)
	return data.ID != 0
}

func GetPlayerSetById(id uint) (PlayerSet, error) {
	var data PlayerSet
	result := DB.
		Preload("Players", func(*gorm.DB) *gorm.DB {
			return DB.Order("`rank` asc")
		}).
		Table("player_sets").
		Where("id = ?", id).
		First(&data)
	return data, result.Error
}

func GetPlayerIdsByPlayerSetId(id uint) ([]uint, error) {
	var data []uint
	result := DB.Table("player_set_match_tables").
		Where("player_set_id = ?", id).
		Pluck("player_id", &data)
	return data, result.Error
}
func GetPlayerWPlayerSetsByIDCompeitionID(id uint, eliminationId uint) (Player, error) {
	var data Player
	result := DB.
		Preload("PlayerSets", func(*gorm.DB) *gorm.DB {
			return DB.Order("`rank` asc").
				Where("elimination_id = ?", eliminationId)
		}).
		Model(&Player{}).
		Where("id = ?", id).
		First(&data)
	return data, result.Error
}

func GetPlayerSetsByEliminationId(id uint) ([]PlayerSet, error) {
	var data []PlayerSet
	result := DB.Table("player_sets").
		Where("elimination_id = ?", id).
		Order("`rank` asc, `total_score` desc").
		Find(&data)
	return data, result.Error
}

// PlayerSetRanking is the score-oriented projection used to seed an
// elimination. An X (11) is deliberately not counted as a ten (10).
type PlayerSetRanking struct {
	ID         uint   `json:"id"`
	SetName    string `json:"set_name"`
	Rank       int    `json:"rank"`
	TotalScore int    `json:"total_score"`
	XCount     int    `json:"x_count"`
	TenCount   int    `json:"ten_count"`
}

var (
	ErrInvalidPlayerSetRankingOrder = errors.New("ranking player set IDs are not a complete permutation of the elimination")
	ErrStalePlayerSetRankingOrder   = errors.New("player set ranking order changed before update")
)

// playerSetRankingQuery builds the shared score-oriented projection for every
// player set of an elimination. Team totals must be the SUM of each member's
// players.total_score; member scores are aggregated per player FIRST in a
// derived table, then joined, so a team with multiple players is not
// multiplied by its round_scores row count. The derived table is restricted
// to the players actually linked to this elimination's player sets: the
// outer WHERE player_sets.elimination_id = ? cannot be pushed into the inner
// side of the LEFT JOIN, so without this filter the derived table would
// aggregate every player and round_score in the database on every call.
func playerSetRankingQuery(db *gorm.DB, eliminationID uint) *gorm.DB {
	return db.Table("player_sets").
		Select("player_sets.id, player_sets.set_name, player_sets.`rank`, "+
			"COALESCE(SUM(member.total_score), 0) AS total_score, "+
			"COALESCE(SUM(member.x_count), 0) AS x_count, "+
			"COALESCE(SUM(member.ten_count), 0) AS ten_count").
		Joins("LEFT JOIN player_set_match_tables ON player_sets.id = player_set_match_tables.player_set_id").
		Joins(`LEFT JOIN (
			SELECT players.id AS player_id, players.total_score,
				COALESCE(SUM(CASE WHEN round_scores.score = 11 THEN 1 ELSE 0 END), 0) AS x_count,
				COALESCE(SUM(CASE WHEN round_scores.score = 10 THEN 1 ELSE 0 END), 0) AS ten_count
			FROM players
			LEFT JOIN rounds ON players.id = rounds.player_id
			LEFT JOIN round_ends ON rounds.id = round_ends.round_id
			LEFT JOIN round_scores ON round_ends.id = round_scores.round_end_id
			WHERE players.id IN (
				SELECT player_set_match_tables.player_id
				FROM player_set_match_tables
				JOIN player_sets ON player_sets.id = player_set_match_tables.player_set_id
				WHERE player_sets.elimination_id = ?)
			GROUP BY players.id, players.total_score
		) AS member ON member.player_id = player_set_match_tables.player_id`, eliminationID).
		Where("player_sets.elimination_id = ?", eliminationID).
		Group("player_sets.id, player_sets.set_name, player_sets.`rank`")
}

// GetPlayerSetRankings returns every player set of the elimination in its
// currently stored rank order. PlayerSets with no linked players or no
// RoundScore rows still appear, with 0 counts.
func GetPlayerSetRankings(db *gorm.DB, eliminationID uint) ([]PlayerSetRanking, error) {
	var rankings []PlayerSetRanking
	result := playerSetRankingQuery(db, eliminationID).
		Order("player_sets.`rank` ASC, player_sets.id ASC").
		Find(&rankings)
	return rankings, result.Error
}

// AutoRankPlayerSets recomputes the score-oriented projection, sorts by team
// total score, X count, then pure ten count, and writes a contiguous rank
// 1..N along with the recomputed player_sets.total_score.
func AutoRankPlayerSets(db *gorm.DB, eliminationID uint) ([]PlayerSetRanking, error) {
	var computed []PlayerSetRanking
	if err := playerSetRankingQuery(db, eliminationID).
		Order("total_score DESC, x_count DESC, ten_count DESC, player_sets.id ASC").
		Find(&computed).Error; err != nil {
		return nil, err
	}

	for index, playerSet := range computed {
		updates := map[string]interface{}{"rank": index + 1, "total_score": playerSet.TotalScore}
		if err := db.Model(&PlayerSet{}).Where("id = ? AND elimination_id = ?", playerSet.ID, eliminationID).
			Updates(updates).Error; err != nil {
			return nil, err
		}
	}

	return GetPlayerSetRankings(db, eliminationID)
}

// ReorderPlayerSets atomically compares the order loaded by the client, then
// stores a complete new contiguous ranking. The player set rows are locked
// so a concurrent change cannot yield a partial ranking.
func ReorderPlayerSets(db *gorm.DB, eliminationID uint, expectedIDs, desiredIDs []uint) ([]PlayerSetRanking, error) {
	if !samePlayerIDs(expectedIDs, desiredIDs) {
		return nil, ErrInvalidPlayerSetRankingOrder
	}

	var current []PlayerSet
	if err := db.Clauses(clause.Locking{Strength: "UPDATE"}).
		Where("elimination_id = ?", eliminationID).
		Order("`rank` ASC, id ASC").
		Find(&current).Error; err != nil {
		return nil, err
	}

	currentIDs := make([]uint, len(current))
	for index, playerSet := range current {
		currentIDs[index] = playerSet.ID
	}

	// A requested ID that exists but belongs to a different elimination is a
	// malformed request, not a stale snapshot: it could never have been part
	// of this elimination's ranking order.
	var requestedSets []PlayerSet
	if err := db.Where("id IN ?", expectedIDs).Find(&requestedSets).Error; err != nil {
		return nil, err
	}
	for _, playerSet := range requestedSets {
		if playerSet.EliminationId != eliminationID {
			return nil, ErrInvalidPlayerSetRankingOrder
		}
	}

	// The request was internally valid before opening the transaction.  If
	// the locked database membership has changed -- including a requested ID
	// that no longer exists (deleted concurrently) or a new set that
	// appeared -- the caller's snapshot is stale rather than malformed.
	if !samePlayerIDs(currentIDs, expectedIDs) {
		return nil, ErrStalePlayerSetRankingOrder
	}
	if !samePlayerIDOrder(currentIDs, expectedIDs) {
		return nil, ErrStalePlayerSetRankingOrder
	}

	// Recompute each set's team total from the same score-oriented projection
	// used elsewhere, so the stored player_sets.total_score column does not
	// drift from the ranking table on a manual reorder. A member-less set
	// legitimately gets 0.
	var computed []PlayerSetRanking
	if err := playerSetRankingQuery(db, eliminationID).Find(&computed).Error; err != nil {
		return nil, err
	}
	totalScoreByID := make(map[uint]int, len(computed))
	for _, playerSet := range computed {
		totalScoreByID[playerSet.ID] = playerSet.TotalScore
	}

	for index, playerSetID := range desiredIDs {
		updates := map[string]interface{}{"rank": index + 1, "total_score": totalScoreByID[playerSetID]}
		if err := db.Model(&PlayerSet{}).Where("id = ? AND elimination_id = ?", playerSetID, eliminationID).
			Updates(updates).Error; err != nil {
			return nil, err
		}
	}

	return GetPlayerSetRankings(db, eliminationID)
}

func CreatePlayerSet(data PlayerSet) (PlayerSet, error) {
	result := DB.Table("player_sets").Create(&data)
	return data, result.Error
}

func CreatePlayerSetMatchTable(data PlayerSetMatchTable) (PlayerSetMatchTable, error) {
	result := DB.Table("player_set_match_tables").Create(&data)
	return data, result.Error
}

func UpdatePlayerSetName(id uint, name string) error {
	result := DB.Table("player_sets").
		Where("id = ?", id).
		Update("set_name", name)
	return result.Error
}
func UpdatePlayerSetRank(id uint, rank int) error {
	result := DB.Table("player_sets").
		Where("id = ?", id).
		UpdateColumn("rank", rank)
	return result.Error
}
func DeletePlayerSetById(id uint) (bool, error) {
	result := DB.Table("player_sets").Where("id = ?", id).Delete(PlayerSet{})
	isChanged := result.RowsAffected != 0
	return isChanged, result.Error
}
func DeletePlayerSetMatchTableByPlayerSetId(id uint) (bool, error) {
	result := DB.Table("player_set_match_tables").Where("player_set_id = ?", id).Delete(PlayerSetMatchTable{})
	isChanged := result.RowsAffected != 0
	return isChanged, result.Error
}
