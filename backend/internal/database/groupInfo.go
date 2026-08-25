package database

import (
	"errors"
	"log"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type Group struct {
	ID            uint      `json:"id" gorm:"primary_key"`
	CompetitionId uint      `json:"competition_id" `
	GroupName     string    `json:"group_name"`
	GroupRange    string    `json:"group_range"`
	BowType       string    `json:"bow_type"`
	GroupIndex    int       `json:"group_index"`
	Players       []*Player `json:"players" swagger:"interface{}"`
}

func InitGroupInfo() {
	DB.Table("groups").AutoMigrate(&Group{})
}

func DropGroupInfo() {
	if DB.Migrator().HasTable(&Group{}) {
		if err := DB.Migrator().DropTable(&Group{}); err != nil {
			log.Println("Failed to drop Group:", err)
			return
		}
	}
}

func GetGroupIsExist(id uint) bool {
	var group Group
	DB.Table("groups").Where("id = ?", id).First(&group)
	return group.ID != 0
}

func GetGroupInfoById(id uint) (Group, error) {
	var group Group
	result := DB.Table("groups").Where("id = ?", id).First(&group)
	return group, result.Error
}

func GetGroupInfoWPlayersById(id uint) (Group, error) {
	var group Group
	result := DB.
		Preload("Players", func(*gorm.DB) *gorm.DB {
			return DB.Order("`rank` asc")
		}).
		Model(&Group{}).
		Where("id = ?", id).
		First(&group)
	return group, result.Error
}

type GroupPlayer struct {
	ID     uint
	XCnt   int
	TenCnt int
}

// GroupRankingPlayer is the small, score-oriented view used to edit a
// qualification ranking.  Score counts deliberately distinguish an X (11)
// from a ten (10); a ten must not include Xs.
type GroupRankingPlayer struct {
	ID         uint   `json:"id"`
	Name       string `json:"name"`
	Rank       int    `json:"rank"`
	TotalScore int    `json:"total_score"`
	XCount     int    `json:"x_count"`
	TenCount   int    `json:"ten_count"`
}

var (
	ErrInvalidRankingOrder = errors.New("ranking player IDs are not a complete permutation of the group")
	ErrStaleRankingOrder   = errors.New("ranking order changed before update")
)

func GetGroupPlayerIdRankOrderById(groupId uint) ([]GroupPlayer, error) {
	return getGroupPlayerIdRankOrderById(DB, groupId)
}

func getGroupPlayerIdRankOrderById(db *gorm.DB, groupId uint) ([]GroupPlayer, error) {
	var data []GroupPlayer
	result := db.Table("players").
		Select(`players.id,
			COALESCE(SUM(CASE WHEN round_scores.score = 11 THEN 1 ELSE 0 END), 0) AS x_cnt,
			COALESCE(SUM(CASE WHEN round_scores.score = 10 THEN 1 ELSE 0 END), 0) AS ten_cnt`).
		Joins("LEFT JOIN rounds ON players.id = rounds.player_id").
		Joins("LEFT JOIN round_ends ON rounds.id = round_ends.round_id").
		Joins("LEFT JOIN round_scores ON round_ends.id = round_scores.round_end_id").
		Where("players.group_id = ? AND players.`rank` != -1", groupId).
		Group("players.id, players.total_score, players.shoot_off_score").
		Order("players.total_score DESC, x_cnt DESC, ten_cnt DESC, players.shoot_off_score DESC, players.id ASC").
		Find(&data)

	return data, result.Error
}

// GetGroupRankingPlayers includes every assigned, rankable player, including
// players that have not yet recorded any scores.
func GetGroupRankingPlayers(groupID uint) ([]GroupRankingPlayer, error) {
	return getGroupRankingPlayers(DB, groupID)
}

func getGroupRankingPlayers(db *gorm.DB, groupID uint) ([]GroupRankingPlayer, error) {
	var players []GroupRankingPlayer
	result := db.Table("players").
		Select(`players.id, players.name, players.rank, players.total_score,
			COALESCE(SUM(CASE WHEN round_scores.score = 11 THEN 1 ELSE 0 END), 0) AS x_count,
			COALESCE(SUM(CASE WHEN round_scores.score = 10 THEN 1 ELSE 0 END), 0) AS ten_count`).
		Joins("LEFT JOIN rounds ON players.id = rounds.player_id").
		Joins("LEFT JOIN round_ends ON rounds.id = round_ends.round_id").
		Joins("LEFT JOIN round_scores ON round_ends.id = round_scores.round_end_id").
		Where("players.group_id = ? AND players.`rank` != -1", groupID).
		Group("players.id, players.name, players.rank, players.total_score").
		Order("players.rank ASC, players.id ASC").
		Find(&players)
	return players, result.Error
}

func samePlayerIDs(left, right []uint) bool {
	if len(left) != len(right) {
		return false
	}
	seen := make(map[uint]struct{}, len(left))
	for _, id := range left {
		if id == 0 {
			return false
		}
		if _, exists := seen[id]; exists {
			return false
		}
		seen[id] = struct{}{}
	}
	for _, id := range right {
		if _, exists := seen[id]; !exists {
			return false
		}
	}
	seenRight := make(map[uint]struct{}, len(right))
	for _, id := range right {
		if id == 0 {
			return false
		}
		if _, exists := seenRight[id]; exists {
			return false
		}
		seenRight[id] = struct{}{}
	}
	return true
}

func samePlayerIDOrder(left, right []uint) bool {
	if len(left) != len(right) {
		return false
	}
	for index := range left {
		if left[index] != right[index] {
			return false
		}
	}
	return true
}

// UpdateGroupPlayerRanking atomically compares the order loaded by the
// client, then stores a complete new contiguous ranking.  The player rows are
// locked so a concurrent group change cannot yield a partial ranking.
func UpdateGroupPlayerRanking(groupID uint, expectedPlayerIDs, playerIDs []uint) ([]GroupRankingPlayer, error) {
	if !samePlayerIDs(expectedPlayerIDs, playerIDs) {
		return nil, ErrInvalidRankingOrder
	}

	var updated []GroupRankingPlayer
	err := DB.Transaction(func(tx *gorm.DB) error {
		var current []Player
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).
			Where("group_id = ? AND `rank` != -1", groupID).
			Order("`rank` ASC, id ASC").
			Find(&current).Error; err != nil {
			return err
		}

		currentIDs := make([]uint, len(current))
		for index, player := range current {
			currentIDs[index] = player.ID
		}
		// The request was internally valid before opening the transaction.  If
		// the locked database membership has changed, the caller's snapshot is
		// stale rather than malformed.
		if !samePlayerIDs(currentIDs, expectedPlayerIDs) {
			return ErrStaleRankingOrder
		}
		if !samePlayerIDOrder(currentIDs, expectedPlayerIDs) {
			return ErrStaleRankingOrder
		}

		for index, playerID := range playerIDs {
			if err := tx.Model(&Player{}).Where("id = ? AND group_id = ?", playerID, groupID).
				Update("rank", index+1).Error; err != nil {
				return err
			}
		}

		var err error
		updated, err = getGroupRankingPlayers(tx, groupID)
		return err
	})
	return updated, err
}

// RefreshCompetitionRanks refreshes all formal groups as one transaction.
// The unassigned group is intentionally not part of a qualification ranking.
func RefreshCompetitionRanks(competitionID uint) error {
	return DB.Transaction(func(tx *gorm.DB) error {
		var competition Competition
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&competition, competitionID).Error; err != nil {
			return err
		}

		var groupIDs []uint
		if err := tx.Table("groups").
			Where("competition_id = ? AND id != ?", competitionID, competition.UnassignedGroupId).
			Order("group_index ASC, id ASC").
			Pluck("id", &groupIDs).Error; err != nil {
			return err
		}

		for _, groupID := range groupIDs {
			var lockedPlayers []Player
			if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).
				Where("group_id = ? AND `rank` != -1", groupID).
				Order("id ASC").
				Find(&lockedPlayers).Error; err != nil {
				return err
			}

			players, err := getGroupPlayerIdRankOrderById(tx, groupID)
			if err != nil {
				return err
			}
			for index, player := range players {
				if err := tx.Model(&Player{}).Where("id = ?", player.ID).Update("rank", index+1).Error; err != nil {
					return err
				}
			}
		}
		return nil
	})
}

func CreateGroupInfo(group Group) (Group, error) {
	result := DB.Table("groups").Create(&group)
	return group, result.Error
}

func UpdateGroupInfo(id uint, group Group) (bool, error) {
	result := DB.Table("groups").Where("id = ?", id).Updates(&group)
	isChanged := result.RowsAffected != 0
	return isChanged, result.Error
}

func UpdateGroupInfoIndex(id uint, index int) (bool, error) {
	result := DB.Table("groups").Where("id = ?", id).Update("group_index", index)
	isChanged := result.RowsAffected != 0
	return isChanged, result.Error
}

func DeleteGroupInfo(id uint) (bool, error) {
	result := DB.Table("groups").Where("id = ?", id).Delete(&Group{})
	isChanged := result.RowsAffected != 0
	return isChanged, result.Error
}
