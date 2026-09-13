# 後端測試盤點

後端測試依資料依賴分為兩層。預設測試不會建立資料庫連線；依賴 MySQL 的測試必須同時指定 `integration` build tag 與明確的環境開關。

## 單元測試

從 `backend` 執行：

```bash
GOCACHE=/tmp/archery-go-build go test ./...
```

此層涵蓋：

- `internal/database`：對抗賽勝負、局點、JSON 格式。
- `internal/endpoint`：籤表尺寸與輸入驗證、對抗賽結果計算、控制流程驗證。
- `internal/pkg/test`：密碼、角色與 session helper。
- `internal/response/test`：成功與錯誤 response。
- `internal/routers`：控制 route 註冊。
- `internal/seeder`：情境名稱、fixture 規格、靶道與選手分配、排名分數、籤表規格。

`internal/endpoint/test/tools_test.go` 仍位於舊 test package，測設定檔解析、參數轉換與分數格式，屬於此層。

## MySQL 整合測試

所有會初始化 schema、清表或讀寫 `database.DB` 的測試均以 `//go:build integration` 隔離。此層包括：

- `internal/database/test`：Player、qualification 與 elimination progress 的實際資料庫行為。
- `internal/endpoint/test`：Player 與 MatchResult handler 的資料庫操作。
- `internal/endpoint/*_integration_test.go`：籤表、首輪同步、資格排名、選手／participant 控制、PlayerSet 自動建立與排序；包含 transaction、row lock 與併發情境。
- `internal/seeder/seeder_test.go`：三種 fixture 情境的實際建立、冪等性、隔離及帳號衝突 rollback。

由根目錄的隔離 runner 執行破壞性測試：

```bash
scripts/test.sh go-integration
```

每次產生獨立 Compose project，MySQL 資料存於 tmpfs，不公開 host port。設定檔由 runner 建立，不讀開發 DB 憑證。案例以共用 `ResetTestDatabase` helper 重建 schema；Seeder 的三個情境仍保留。

`testdb reset --fixture empty|legacy|accounts` 只接受 runner 配發的 `ARCHERY_TEST_CONFIG` 與相符的 `ARCHERY_TEST_RUN_ID`，且限制內網 `mysql:3306`、`archery_test` 帳號及本次專屬 schema。這是防止誤用開發環境的防護，不是對可任意修改程式與環境變數之主機使用者的安全隔離；實際資料存取邊界為獨立 Docker network 與僅授權單一 schema 的 DB 帳號。

Fixture 定義：`empty` 僅 schema；`legacy` 舊 SQL fixture 加測試主辦人；`accounts` 僅組織、主辦人、裁判與 24 位選手帳號，不建立比賽或 participant。Reset 失敗、設定缺失均回傳錯誤，不得以整套 skip 代替執行。

Go 整合輸出 JSON 事件、coverage 與服務 log 於 `test-artifacts/go-integration/<run ID>`；成功、測試失敗與中斷均清理本次 project，保留報告。需要 Docker Compose、Go 1.23 與已下載的 Go modules（`cd backend && go mod download`）。

舊 `Player_test.go` 的未登入成功與非法分數通過斷言已過期，改為真 session 驗證目前角色與分數契約；`MatchResult_test.go` 補齊實際雙方對戰鏈，再驗 approved Judge 更正已確認波。非放寬 assertion，亦未移除跨角色拒絕覆蓋。

`internal/endpoint/judge_permissions_integration_test.go` 補完整 lifecycle 不承擔的拒絕路徑。使用真 session、Participant 與 MySQL；不把 Admin 帳號當 Judge，也不以非法 payload 的拒絕代替權限驗證。

| 案例行為 | 資料及保留理由 |
| --- | --- |
| pending／外場 Judge 不得記個人對抗分數 | 合法當前階段及完整箭數；403 後整份籤表不變 |
| pending／外場 Judge 不得記資格分數 | 合法波次與箭數；403 後箭分、波確認、局及選手總分不變 |
| approved Judge 不得取消資格波確認 | 原波已確認，送 `false` 後仍保持確認；既有對抗 unconfirm 拒絕測試不重複新增 |
| approved Judge 不得建隊、推進或頒牌 | 各請求先驗 Judge 403／資料不變，再驗同賽事 Admin 的合法成功控制；手動頒牌另用未鎖定的 legacy 籤表，避免把完整籤表的 409 鎖定誤作角色差異 |

## 已知基線限制

- `go test ./...` 是唯一安全的預設入口，且不得因為本機存在 MySQL 而連線。
- `-tags=integration` 只選入資料庫測試；runner 統一設定開關與專屬設定。手動漏設定會明確失敗。
- 舊的 MySQL 測試共用 package-level `database.DB`，故整合套件需以 `-p 1` 執行，套件內的併發案例則保留原本行為。
- 前端案例、保留與搬移理由見 [前端測試分層](testing-frontend.md)。
