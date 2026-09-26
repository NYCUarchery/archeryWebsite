package endpoint

import (
	"backend/internal/database"
	"backend/internal/pkg"
	"encoding/csv"
	"errors"
	"io"
	"net/http"
	"strconv"
	"strings"
	"unicode/utf8"

	"github.com/gin-gonic/gin"
	mysql "github.com/go-sql-driver/mysql"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

const bulkCSVLimit = 1 << 20
const bulkRowLimit = 100

type BulkRegisterRequest struct {
	CompetitionID uint   `json:"competition_id"`
	Prefix        string `json:"prefix"`
	CSV           string `json:"csv"`
}

type BulkRegisterIssue struct {
	Line    int    `json:"line"`
	Field   string `json:"field"`
	Message string `json:"message"`
}

type BulkRegisterPreviewRow struct {
	Line     int    `json:"line"`
	UserName string `json:"user_name"`
	RealName string `json:"real_name"`
}

type BulkRegisterPreviewResponse struct {
	Count  int                      `json:"count"`
	Rows   []BulkRegisterPreviewRow `json:"rows"`
	Errors []BulkRegisterIssue      `json:"errors"`
}

type BulkRegisterErrorResponse struct {
	Errors []BulkRegisterIssue `json:"errors"`
}

type BulkRegisterCreatedRow struct {
	Line          int    `json:"line"`
	UserID        uint   `json:"user_id"`
	UserName      string `json:"user_name"`
	ParticipantID uint   `json:"participant_id"`
	PlayerID      uint   `json:"player_id"`
}

type BulkRegisterResponse struct {
	CompetitionID uint                     `json:"competition_id"`
	CreatedCount  int                      `json:"created_count"`
	Rows          []BulkRegisterCreatedRow `json:"rows"`
}

type bulkRegisterRow struct {
	BulkRegisterPreviewRow
	Password      string
	Email         *string
	InstitutionID uint
	Overview      string
}

var errBulkValidation = errors.New("bulk registration validation failed")

// PreviewBulkRegister godoc
//
//	@Summary	Preview CSV account registration and Player enrolment.
//	@Description	Dictator only. Validates up to 100 CSV rows without writing. Passwords are never returned.
//	@Tags		User
//	@Accept		json
//	@Produce	json
//	@Param		request	body		BulkRegisterRequest	true	"CSV, prefix, and competition"
//	@Success	200		{object}	BulkRegisterPreviewResponse
//	@Failure	400		{object}	BulkRegisterErrorResponse
//	@Failure	401		{object}	response.Response
//	@Failure	403		{object}	response.Response
//	@Failure	413		{object}	BulkRegisterErrorResponse
//	@Failure	500		{object}	BulkRegisterErrorResponse
//	@Router		/user/bulk/preview [post]
func PreviewBulkRegister(c *gin.Context) {
	request, ok := bindBulkRequest(c)
	if !ok {
		return
	}
	rows, preview, issues := parseBulkRegisterCSV(request.CSV, request.Prefix)
	if len(issues) == 0 {
		_, dbIssues, err := validateBulkRegisterDB(database.DB, request.CompetitionID, rows)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"errors": []BulkRegisterIssue{{Field: "server", Message: "資料庫檢查失敗"}}})
			return
		}
		issues = append(issues, dbIssues...)
	}
	c.JSON(http.StatusOK, BulkRegisterPreviewResponse{Count: len(preview), Rows: preview, Errors: issues})
}

// BulkRegister godoc
//
//	@Summary	Create accounts and approved Players from CSV.
//	@Description	Dictator only. Creates users, approved Player participants, and the complete blank score graph in one transaction.
//	@Tags		User
//	@Accept		json
//	@Produce	json
//	@Param		request	body		BulkRegisterRequest	true	"CSV, prefix, and competition"
//	@Success	200		{object}	BulkRegisterResponse
//	@Failure	400		{object}	BulkRegisterErrorResponse
//	@Failure	401		{object}	response.Response
//	@Failure	403		{object}	response.Response
//	@Failure	409		{object}	BulkRegisterErrorResponse
//	@Failure	413		{object}	BulkRegisterErrorResponse
//	@Failure	422		{object}	BulkRegisterErrorResponse
//	@Failure	500		{object}	BulkRegisterErrorResponse
//	@Router		/user/bulk [post]
func BulkRegister(c *gin.Context) {
	request, ok := bindBulkRequest(c)
	if !ok {
		return
	}
	rows, _, issues := parseBulkRegisterCSV(request.CSV, request.Prefix)
	if len(issues) != 0 {
		c.JSON(http.StatusUnprocessableEntity, gin.H{"errors": issues})
		return
	}

	created := make([]BulkRegisterCreatedRow, 0, len(rows))
	failedLine := 0
	failedField := ""
	err := database.DB.Transaction(func(tx *gorm.DB) error {
		var competition database.Competition
		if request.CompetitionID == 0 {
			issues = []BulkRegisterIssue{{Field: "competition_id", Message: "請選擇賽事"}}
			return errBulkValidation
		}
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&competition, request.CompetitionID).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				issues = []BulkRegisterIssue{{Field: "competition_id", Message: "賽事不存在"}}
				return errBulkValidation
			}
			return err
		}
		_, dbIssues, err := validateBulkRegisterDB(tx, request.CompetitionID, rows)
		if err != nil {
			return err
		}
		if len(dbIssues) != 0 {
			issues = dbIssues
			return errBulkValidation
		}
		for _, row := range rows {
			failedLine = row.Line
			failedField = "password"
			hash, err := bcrypt.GenerateFromPassword([]byte(row.Password), bcrypt.DefaultCost)
			if err != nil {
				return err
			}
			failedField = "user_name"
			user := database.User{
				Role:          pkg.RoleToString(pkg.RUser),
				UserName:      row.UserName,
				RealName:      row.RealName,
				Password:      string(hash),
				Email:         row.Email,
				InstitutionID: row.InstitutionID,
				Overview:      row.Overview,
			}
			if err := tx.Create(&user).Error; err != nil {
				return err
			}
			failedField = "participant"
			participant := database.Participant{
				UserID: user.ID, CompetitionID: competition.ID,
				Role: pkg.RoleToString(pkg.RPlayer), Status: "approved",
			}
			if err := tx.Create(&participant).Error; err != nil {
				return err
			}
			failedField = "player"
			player, err := createPlayerGraphTx(tx, participant, competition, user)
			if err != nil {
				return err
			}
			created = append(created, BulkRegisterCreatedRow{
				Line: row.Line, UserID: user.ID, UserName: user.UserName,
				ParticipantID: participant.ID, PlayerID: player.ID,
			})
		}
		return nil
	})
	if errors.Is(err, errBulkValidation) {
		c.JSON(http.StatusUnprocessableEntity, gin.H{"errors": issues})
		return
	}
	if err != nil {
		var mysqlErr *mysql.MySQLError
		if errors.As(err, &mysqlErr) && mysqlErr.Number == 1062 {
			if strings.Contains(mysqlErr.Message, "uni_users_email") {
				failedField = "email"
			}
			c.JSON(http.StatusConflict, gin.H{"errors": []BulkRegisterIssue{{Line: failedLine, Field: failedField, Message: "資料已存在，請重新預覽"}}})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"errors": []BulkRegisterIssue{{Line: failedLine, Field: failedField, Message: "建立失敗；整批已回滾"}}})
		return
	}
	c.JSON(http.StatusOK, BulkRegisterResponse{
		CompetitionID: request.CompetitionID,
		CreatedCount:  len(created),
		Rows:          created,
	})
}

func bindBulkRequest(c *gin.Context) (BulkRegisterRequest, bool) {
	var request BulkRegisterRequest
	c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, bulkCSVLimit+64*1024)
	if err := c.ShouldBindJSON(&request); err != nil {
		var maxErr *http.MaxBytesError
		if errors.As(err, &maxErr) {
			c.JSON(http.StatusRequestEntityTooLarge, gin.H{"errors": []BulkRegisterIssue{{Field: "csv", Message: "CSV 超過 1 MiB"}}})
		} else {
			c.JSON(http.StatusBadRequest, gin.H{"errors": []BulkRegisterIssue{{Field: "csv", Message: "請提供正確的 JSON 資料"}}})
		}
		return request, false
	}
	if len(request.CSV) > bulkCSVLimit {
		c.JSON(http.StatusRequestEntityTooLarge, gin.H{"errors": []BulkRegisterIssue{{Field: "csv", Message: "CSV 超過 1 MiB"}}})
		return request, false
	}
	return request, true
}

func parseBulkRegisterCSV(input, prefix string) ([]bulkRegisterRow, []BulkRegisterPreviewRow, []BulkRegisterIssue) {
	rows := []bulkRegisterRow{}
	preview := []BulkRegisterPreviewRow{}
	issues := []BulkRegisterIssue{}
	reader := csv.NewReader(strings.NewReader(strings.TrimPrefix(input, "\ufeff")))
	reader.FieldsPerRecord = -1
	header, err := reader.Read()
	if err != nil {
		return rows, preview, []BulkRegisterIssue{{Line: 1, Field: "csv", Message: "CSV 必須包含標題列與資料"}}
	}
	allowed := map[string]bool{
		"user_name": true, "real_name": true, "password": true,
		"email": true, "institution_id": true, "overview": true,
	}
	columns := make(map[string]int, len(header))
	for i, raw := range header {
		name := strings.ToLower(strings.TrimSpace(raw))
		switch {
		case !allowed[name]:
			issues = append(issues, BulkRegisterIssue{Line: 1, Field: name, Message: "不支援的欄位"})
		case hasColumn(columns, name):
			issues = append(issues, BulkRegisterIssue{Line: 1, Field: name, Message: "欄位重複"})
		default:
			columns[name] = i
		}
	}
	for _, name := range []string{"user_name", "real_name", "password"} {
		if !hasColumn(columns, name) {
			issues = append(issues, BulkRegisterIssue{Line: 1, Field: name, Message: "缺少必填欄位"})
		}
	}
	if len(issues) != 0 {
		return rows, preview, issues
	}
	prefix = strings.TrimSpace(prefix)
	userNames := map[string]bool{}
	emails := map[string]bool{}
	for {
		record, err := reader.Read()
		if errors.Is(err, io.EOF) {
			break
		}
		if err != nil {
			var parseErr *csv.ParseError
			line := 0
			if errors.As(err, &parseErr) {
				line = parseErr.Line
			}
			issues = append(issues, BulkRegisterIssue{Line: line, Field: "csv", Message: "CSV 格式錯誤"})
			break
		}
		line, _ := reader.FieldPos(0)
		if len(rows) >= bulkRowLimit {
			issues = append(issues, BulkRegisterIssue{Line: line, Field: "csv", Message: "每批最多 100 筆"})
			break
		}
		if len(record) != len(header) {
			issues = append(issues, BulkRegisterIssue{Line: line, Field: "csv", Message: "欄位數與標題列不同"})
			continue
		}
		value := func(name string) string {
			if i, ok := columns[name]; ok {
				return record[i]
			}
			return ""
		}
		suffix := strings.TrimSpace(value("user_name"))
		userName := prefix + suffix
		realName := strings.TrimSpace(value("real_name"))
		password := value("password")
		row := bulkRegisterRow{
			BulkRegisterPreviewRow: BulkRegisterPreviewRow{Line: line, UserName: userName, RealName: realName},
			Password:               password, InstitutionID: database.NoInstitutionID,
			Overview: strings.TrimSpace(value("overview")),
		}
		if suffix == "" {
			issues = append(issues, BulkRegisterIssue{Line: line, Field: "user_name", Message: "帳號片段不可空白"})
		} else if utf8.RuneCountInString(userName) > 191 {
			issues = append(issues, BulkRegisterIssue{Line: line, Field: "user_name", Message: "完整帳號超過 191 字"})
		}
		if realName == "" {
			issues = append(issues, BulkRegisterIssue{Line: line, Field: "real_name", Message: "真名不可空白"})
		}
		if strings.TrimSpace(password) == "" {
			issues = append(issues, BulkRegisterIssue{Line: line, Field: "password", Message: "密碼不可空白"})
		} else if len(password) > 72 {
			issues = append(issues, BulkRegisterIssue{Line: line, Field: "password", Message: "密碼不得超過 72 位元組"})
		}
		userKey := strings.ToLower(userName)
		if suffix != "" && userNames[userKey] {
			issues = append(issues, BulkRegisterIssue{Line: line, Field: "user_name", Message: "CSV 內完整帳號重複"})
		}
		userNames[userKey] = true
		if email := strings.TrimSpace(value("email")); email != "" {
			if utf8.RuneCountInString(email) > 191 {
				issues = append(issues, BulkRegisterIssue{Line: line, Field: "email", Message: "電子郵件超過 191 字"})
			}
			emailKey := strings.ToLower(email)
			if emails[emailKey] {
				issues = append(issues, BulkRegisterIssue{Line: line, Field: "email", Message: "CSV 內電子郵件重複"})
			}
			emails[emailKey] = true
			row.Email = &email
		}
		if text := strings.TrimSpace(value("institution_id")); text != "" {
			id, parseErr := strconv.ParseUint(text, 10, 32)
			if parseErr != nil || id == 0 {
				issues = append(issues, BulkRegisterIssue{Line: line, Field: "institution_id", Message: "機構 ID 必須為正整數"})
			} else {
				row.InstitutionID = uint(id)
			}
		}
		rows = append(rows, row)
		preview = append(preview, row.BulkRegisterPreviewRow)
	}
	if len(rows) == 0 && len(issues) == 0 {
		issues = append(issues, BulkRegisterIssue{Line: 1, Field: "csv", Message: "至少需要一筆資料"})
	}
	return rows, preview, issues
}

func hasColumn(columns map[string]int, name string) bool {
	_, found := columns[name]
	return found
}

func validateBulkRegisterDB(db *gorm.DB, competitionID uint, rows []bulkRegisterRow) (database.Competition, []BulkRegisterIssue, error) {
	issues := []BulkRegisterIssue{}
	var competition database.Competition
	if competitionID == 0 {
		issues = append(issues, BulkRegisterIssue{Field: "competition_id", Message: "請選擇賽事"})
	} else {
		if err := db.First(&competition, competitionID).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				issues = append(issues, BulkRegisterIssue{Field: "competition_id", Message: "賽事不存在"})
			} else {
				return competition, nil, err
			}
		} else if competition.UnassignedGroupId == 0 || competition.UnassignedLaneId == 0 || competition.RoundsNum <= 0 {
			issues = append(issues, BulkRegisterIssue{Field: "competition_id", Message: "賽事尚未備妥組別、靶位與回合"})
		}
	}
	seenUsernames := make([]string, 0, len(rows))
	seenEmails := make([]string, 0, len(rows))
	for _, row := range rows {
		if same, err := bulkMatchesPrior(db, row.UserName, seenUsernames); err != nil {
			return competition, nil, err
		} else if same {
			issues = append(issues, BulkRegisterIssue{Line: row.Line, Field: "user_name", Message: "CSV 內完整帳號重複"})
		}
		seenUsernames = append(seenUsernames, row.UserName)
		var count int64
		if err := db.Model(&database.User{}).Where("user_name = ?", row.UserName).Count(&count).Error; err != nil {
			return competition, nil, err
		}
		if count != 0 {
			issues = append(issues, BulkRegisterIssue{Line: row.Line, Field: "user_name", Message: "帳號已存在"})
		}
		if row.Email != nil {
			if same, err := bulkMatchesPrior(db, *row.Email, seenEmails); err != nil {
				return competition, nil, err
			} else if same {
				issues = append(issues, BulkRegisterIssue{Line: row.Line, Field: "email", Message: "CSV 內電子郵件重複"})
			}
			seenEmails = append(seenEmails, *row.Email)
			if err := db.Model(&database.User{}).Where("email = ?", *row.Email).Count(&count).Error; err != nil {
				return competition, nil, err
			}
			if count != 0 {
				issues = append(issues, BulkRegisterIssue{Line: row.Line, Field: "email", Message: "電子郵件已存在"})
			}
		}
		if err := db.Model(&database.Institution{}).Where("id = ?", row.InstitutionID).Count(&count).Error; err != nil {
			return competition, nil, err
		}
		if count == 0 {
			issues = append(issues, BulkRegisterIssue{Line: row.Line, Field: "institution_id", Message: "機構不存在"})
		}
	}
	return competition, issues, nil
}

// MySQL's unique indexes use accent-insensitive collation. Preview must use
// the same comparison so it catches collisions before the write transaction.
func bulkMatchesPrior(db *gorm.DB, value string, prior []string) (bool, error) {
	if len(prior) == 0 {
		return false, nil
	}
	var same int
	err := db.Raw("SELECT (CAST(? AS CHAR CHARACTER SET utf8mb4) COLLATE utf8mb4_0900_ai_ci) IN ?", value, prior).Scan(&same).Error
	return same != 0, err
}
