package endpoint

import (
	"backend/internal/database"
	"encoding/csv"
	"errors"
	"io"
	"net/http"
	"strconv"
	"strings"
	"unicode"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

const qualificationAssignmentCSVLimit = 1 << 20

var errQualificationAssignmentValidation = errors.New("qualification assignment validation failed")

type QualificationAssignmentRequest struct {
	CSV string `json:"csv"`
}
type QualificationAssignmentIssue struct {
	Line    int    `json:"line"`
	Field   string `json:"field"`
	Message string `json:"message"`
}
type QualificationAssignmentPreviewRow struct {
	Line       int    `json:"line"`
	PlayerName string `json:"player_name"`
	GroupName  string `json:"group_name"`
	Position   string `json:"position"`
	PlayerID   uint   `json:"player_id"`
	GroupID    uint   `json:"group_id"`
	LaneNumber int    `json:"lane_number"`
	Target     string `json:"target"`
}
type QualificationAssignmentPreviewResponse struct {
	Count  int                                 `json:"count"`
	Rows   []QualificationAssignmentPreviewRow `json:"rows"`
	Errors []QualificationAssignmentIssue      `json:"errors"`
}
type QualificationAssignmentErrorResponse struct {
	Errors []QualificationAssignmentIssue `json:"errors"`
}
type QualificationAssignmentImportResponse struct {
	AssignedCount int `json:"assigned_count"`
}
type qualificationAssignmentRow struct {
	QualificationAssignmentPreviewRow
	laneNumber, order         int
	playerID, groupID, laneID uint
}

// PreviewQualificationAssignments godoc
//
// @Summary Preview qualification player, group, and lane assignments from CSV.
// @Description Requires an approved Admin of the target competition. CSV headers player_name, group_name, and position may be in any order. Position uses lane number plus A-D, such as 1A. No data is written.
// @Tags Competition
// @Accept json
// @Produce json
// @Param id path int true "Competition ID"
// @Param request body QualificationAssignmentRequest true "CSV assignment data"
// @Success 200 {object} QualificationAssignmentPreviewResponse
// @Failure 400 {object} QualificationAssignmentErrorResponse
// @Failure 403 {object} response.Response
// @Failure 413 {object} QualificationAssignmentErrorResponse
// @Failure 500 {object} QualificationAssignmentErrorResponse
// @Router /competition/{id}/qualification-assignments/preview [post]
func PreviewQualificationAssignments(c *gin.Context) {
	id := Convert2uint(c, "id")
	request, ok := bindQualificationAssignmentRequest(c)
	if !ok {
		return
	}
	if !database.GetCompetitionIsExist(id) {
		c.JSON(http.StatusBadRequest, gin.H{"errors": []QualificationAssignmentIssue{{Field: "competition_id", Message: "賽事不存在"}}})
		return
	}
	if !requireCompetitionAdmin(c, id) {
		return
	}
	rows, issues := parseQualificationAssignmentCSV(request.CSV)
	if len(issues) == 0 {
		var err error
		issues, err = validateQualificationAssignments(database.DB, id, rows, false)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"errors": []QualificationAssignmentIssue{{Field: "server", Message: "資料庫檢查失敗"}}})
			return
		}
	}
	preview := make([]QualificationAssignmentPreviewRow, len(rows))
	for i := range rows {
		preview[i] = rows[i].QualificationAssignmentPreviewRow
	}
	c.JSON(http.StatusOK, QualificationAssignmentPreviewResponse{Count: len(preview), Rows: preview, Errors: issues})
}

// ImportQualificationAssignments godoc
//
// @Summary Atomically import qualification player, group, and lane assignments from CSV.
// @Description Requires an approved Admin of the target competition. Revalidates every row while locking competition players, groups, and lanes. Any invalid row rolls back the whole import.
// @Tags Competition
// @Accept json
// @Produce json
// @Param id path int true "Competition ID"
// @Param request body QualificationAssignmentRequest true "CSV assignment data"
// @Success 200 {object} QualificationAssignmentImportResponse
// @Failure 400 {object} QualificationAssignmentErrorResponse
// @Failure 403 {object} response.Response
// @Failure 413 {object} QualificationAssignmentErrorResponse
// @Failure 422 {object} QualificationAssignmentErrorResponse
// @Failure 500 {object} QualificationAssignmentErrorResponse
// @Router /competition/{id}/qualification-assignments [post]
func ImportQualificationAssignments(c *gin.Context) {
	id := Convert2uint(c, "id")
	request, ok := bindQualificationAssignmentRequest(c)
	if !ok {
		return
	}
	rows, issues := parseQualificationAssignmentCSV(request.CSV)
	err := database.DB.Transaction(func(tx *gorm.DB) error {
		var competition database.Competition
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&competition, id).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				issues = []QualificationAssignmentIssue{{Field: "competition_id", Message: "賽事不存在"}}
				return errQualificationAssignmentValidation
			}
			return err
		}
		if err := requireCompetitionAdminTx(c, tx, competition.ID); err != nil {
			return err
		}
		if len(issues) != 0 {
			return errQualificationAssignmentValidation
		}
		var err error
		issues, err = validateQualificationAssignments(tx, competition.ID, rows, true)
		if err != nil {
			return err
		}
		if len(issues) != 0 {
			return errQualificationAssignmentValidation
		}
		for _, row := range rows {
			if err := tx.Model(&database.Player{}).Where("id = ?", row.playerID).Updates(map[string]interface{}{"group_id": row.groupID, "lane_id": row.laneID, "order_number": row.order}).Error; err != nil {
				return err
			}
		}
		return nil
	})
	if writeControlAuthorizationError(c, err) {
		return
	}
	if errors.Is(err, errQualificationAssignmentValidation) {
		c.JSON(http.StatusUnprocessableEntity, gin.H{"errors": issues})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"errors": []QualificationAssignmentIssue{{Field: "server", Message: "匯入失敗；整批已回滾"}}})
		return
	}
	c.JSON(http.StatusOK, QualificationAssignmentImportResponse{AssignedCount: len(rows)})
}
func bindQualificationAssignmentRequest(c *gin.Context) (QualificationAssignmentRequest, bool) {
	var request QualificationAssignmentRequest
	c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, qualificationAssignmentCSVLimit+64*1024)
	if err := c.ShouldBindJSON(&request); err != nil {
		var maxErr *http.MaxBytesError
		status, message := http.StatusBadRequest, "請提供正確的 JSON 資料"
		if errors.As(err, &maxErr) {
			status, message = http.StatusRequestEntityTooLarge, "CSV 超過 1 MiB"
		}
		c.JSON(status, gin.H{"errors": []QualificationAssignmentIssue{{Field: "csv", Message: message}}})
		return request, false
	}
	if len(request.CSV) > qualificationAssignmentCSVLimit {
		c.JSON(http.StatusRequestEntityTooLarge, gin.H{"errors": []QualificationAssignmentIssue{{Field: "csv", Message: "CSV 超過 1 MiB"}}})
		return request, false
	}
	return request, true
}
func parseQualificationAssignmentCSV(input string) ([]qualificationAssignmentRow, []QualificationAssignmentIssue) {
	rows, issues := []qualificationAssignmentRow{}, []QualificationAssignmentIssue{}
	reader := csv.NewReader(strings.NewReader(strings.TrimPrefix(input, "\ufeff")))
	reader.FieldsPerRecord = -1
	header, err := reader.Read()
	if err != nil {
		return rows, []QualificationAssignmentIssue{{Line: 1, Field: "csv", Message: "CSV 必須包含標題列與資料"}}
	}
	required := map[string]bool{"player_name": true, "group_name": true, "position": true}
	columns := map[string]int{}
	if len(header) != 3 {
		issues = append(issues, QualificationAssignmentIssue{Line: 1, Field: "csv", Message: "CSV 必須剛好包含 player_name、group_name、position 三欄"})
	}
	for i, raw := range header {
		name := strings.TrimSpace(raw)
		if !required[name] {
			issues = append(issues, QualificationAssignmentIssue{Line: 1, Field: name, Message: "不支援的欄位"})
		} else if _, ok := columns[name]; ok {
			issues = append(issues, QualificationAssignmentIssue{Line: 1, Field: name, Message: "欄位重複"})
		} else {
			columns[name] = i
		}
	}
	for name := range required {
		if _, ok := columns[name]; !ok {
			issues = append(issues, QualificationAssignmentIssue{Line: 1, Field: name, Message: "缺少必填欄位"})
		}
	}
	if len(issues) > 0 {
		return rows, issues
	}
	seenPlayers, seenSlots := map[string]bool{}, map[string]bool{}
	for {
		record, err := reader.Read()
		if errors.Is(err, io.EOF) {
			break
		}
		if err != nil {
			line := 0
			var parseErr *csv.ParseError
			if errors.As(err, &parseErr) {
				line = parseErr.Line
			}
			return rows, append(issues, QualificationAssignmentIssue{Line: line, Field: "csv", Message: "CSV 格式錯誤"})
		}
		line, _ := reader.FieldPos(0)
		if len(record) != 3 {
			issues = append(issues, QualificationAssignmentIssue{Line: line, Field: "csv", Message: "欄位數與標題列不同"})
			continue
		}
		row := qualificationAssignmentRow{QualificationAssignmentPreviewRow: QualificationAssignmentPreviewRow{Line: line, PlayerName: strings.TrimSpace(record[columns["player_name"]]), GroupName: strings.TrimSpace(record[columns["group_name"]]), Position: strings.ToUpper(strings.TrimSpace(record[columns["position"]]))}}
		if row.PlayerName == "" {
			issues = append(issues, QualificationAssignmentIssue{Line: line, Field: "player_name", Message: "選手名稱不可空白"})
		} else if seenPlayers[row.PlayerName] {
			issues = append(issues, QualificationAssignmentIssue{Line: line, Field: "player_name", Message: "CSV 內選手名稱重複"})
		}
		seenPlayers[row.PlayerName] = true
		if row.GroupName == "" {
			issues = append(issues, QualificationAssignmentIssue{Line: line, Field: "group_name", Message: "組別名稱不可空白"})
		}
		if lane, order, ok := parseQualificationPosition(row.Position); !ok {
			issues = append(issues, QualificationAssignmentIssue{Line: line, Field: "position", Message: "靶位須為正整數加 A-D，例如 1A"})
		} else {
			row.laneNumber, row.order = lane, order
			slot := row.GroupName + "\x00" + row.Position
			if seenSlots[slot] {
				issues = append(issues, QualificationAssignmentIssue{Line: line, Field: "position", Message: "CSV 內同組靶位重複"})
			}
			seenSlots[slot] = true
		}
		rows = append(rows, row)
	}
	if len(rows) == 0 && len(issues) == 0 {
		issues = append(issues, QualificationAssignmentIssue{Line: 1, Field: "csv", Message: "至少需要一筆資料"})
	}
	return rows, issues
}
func parseQualificationPosition(position string) (int, int, bool) {
	if len(position) < 2 {
		return 0, 0, false
	}
	letter := position[len(position)-1]
	if letter < 'A' || letter > 'D' {
		return 0, 0, false
	}
	for _, r := range position[:len(position)-1] {
		if !unicode.IsDigit(r) {
			return 0, 0, false
		}
	}
	lane, err := strconv.Atoi(position[:len(position)-1])
	return lane, int(letter-'A') + 1, err == nil && lane > 0
}
func validateQualificationAssignments(db *gorm.DB, competitionID uint, rows []qualificationAssignmentRow, lock bool) ([]QualificationAssignmentIssue, error) {
	issues := []QualificationAssignmentIssue{}
	locking := func(q *gorm.DB) *gorm.DB {
		if lock {
			return q.Clauses(clause.Locking{Strength: "UPDATE"})
		}
		return q
	}
	var competition database.Competition
	if err := locking(db).First(&competition, competitionID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return []QualificationAssignmentIssue{{Field: "competition_id", Message: "賽事不存在"}}, nil
		}
		return nil, err
	}
	var groups []database.Group
	if err := locking(db).Where("competition_id = ?", competitionID).Find(&groups).Error; err != nil {
		return nil, err
	}
	var lanes []database.Lane
	if err := locking(db).Where("competition_id = ?", competitionID).Find(&lanes).Error; err != nil {
		return nil, err
	}
	var players []database.Player
	if err := locking(db.Model(&database.Player{}).Joins("JOIN participants ON participants.id = players.participant_id").Where("participants.competition_id = ? AND participants.role = ? AND participants.status = ?", competitionID, "Player", "approved")).Find(&players).Error; err != nil {
		return nil, err
	}
	var occupants []database.Player
	if err := locking(db.Model(&database.Player{}).Joins("JOIN lanes ON lanes.id = players.lane_id").Where("lanes.competition_id = ?", competitionID)).Find(&occupants).Error; err != nil {
		return nil, err
	}
	groupsByName := map[string][]database.Group{}
	for _, g := range groups {
		if g.ID != competition.UnassignedGroupId {
			groupsByName[strings.TrimSpace(g.GroupName)] = append(groupsByName[strings.TrimSpace(g.GroupName)], g)
		}
	}
	playersByName := map[string][]database.Player{}
	for _, p := range players {
		if p.TotalScore != -1 {
			playersByName[strings.TrimSpace(p.Name)] = append(playersByName[strings.TrimSpace(p.Name)], p)
		}
	}
	lanesByNumber := map[int][]database.Lane{}
	for _, l := range lanes {
		lanesByNumber[l.LaneNumber] = append(lanesByNumber[l.LaneNumber], l)
	}
	listed := map[uint]bool{}
	for i := range rows {
		r := &rows[i]
		ps := playersByName[r.PlayerName]
		if len(ps) != 1 {
			m := "找不到正式選手"
			if len(ps) > 1 {
				m = "選手名稱不唯一"
			}
			issues = append(issues, QualificationAssignmentIssue{Line: r.Line, Field: "player_name", Message: m})
		} else {
			r.playerID = ps[0].ID
			r.PlayerID = r.playerID
			listed[r.playerID] = true
		}
		gs := groupsByName[r.GroupName]
		if len(gs) != 1 {
			m := "找不到正式組別"
			if len(gs) > 1 {
				m = "組別名稱不唯一"
			}
			issues = append(issues, QualificationAssignmentIssue{Line: r.Line, Field: "group_name", Message: m})
		} else {
			r.groupID = gs[0].ID
			r.GroupID = r.groupID
		}
		matchedLanes := lanesByNumber[r.laneNumber]
		if len(matchedLanes) == 0 {
			issues = append(issues, QualificationAssignmentIssue{Line: r.Line, Field: "position", Message: "靶道不存在"})
		} else if len(matchedLanes) > 1 {
			issues = append(issues, QualificationAssignmentIssue{Line: r.Line, Field: "position", Message: "靶道設定不唯一"})
		} else {
			l := matchedLanes[0]
			r.laneID = l.ID
			r.LaneNumber = l.LaneNumber
			r.Target = string(rune('A' + r.order - 1))
			if r.groupID != 0 && l.QualificationId != r.groupID {
				issues = append(issues, QualificationAssignmentIssue{Line: r.Line, Field: "position", Message: "靶道不屬於指定組別"})
			}
		}
	}
	if len(issues) > 0 {
		return issues, nil
	}
	occupied := map[string]bool{}
	for _, p := range occupants {
		if !listed[p.ID] && p.Order >= 1 && p.Order <= 4 {
			occupied[qualificationSlot(p.LaneId, p.Order)] = true
		}
	}
	for _, r := range rows {
		if occupied[qualificationSlot(r.laneID, r.order)] {
			issues = append(issues, QualificationAssignmentIssue{Line: r.Line, Field: "position", Message: "靶位已被未匯入的選手占用"})
		}
	}
	return issues, nil
}
func qualificationSlot(laneID uint, order int) string {
	return strconv.FormatUint(uint64(laneID), 10) + ":" + strconv.Itoa(order)
}
