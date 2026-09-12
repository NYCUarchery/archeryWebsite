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

所有會呼叫 `SetupDatabaseByMode("test")`、`TestDBRestore()`、`DropTables()` 或讀寫 `database.DB` 的測試均以 `//go:build integration` 隔離。此層包括：

- `internal/database/test`：Player、qualification 與 elimination progress 的實際資料庫行為。
- `internal/endpoint/test`：Player 與 MatchResult handler 的資料庫操作。
- `internal/endpoint/*_integration_test.go`：籤表、首輪同步、資格排名、選手／participant 控制、PlayerSet 自動建立與排序；包含 transaction、row lock 與併發情境。
- `internal/seeder/seeder_test.go`：三種 fixture 情境的實際建立、冪等性、隔離及帳號衝突 rollback。

暫時以既有開關保護破壞性測試：

```bash
ARCHERY_MYSQL_INTEGRATION=1 \
GOCACHE=/tmp/archery-go-build \
go test -tags=integration -p 1 ./internal/database/test ./internal/endpoint/test ./internal/endpoint/...

SEEDER_INTEGRATION_TEST=1 \
GOCACHE=/tmp/archery-go-build \
go test -tags=integration -p 1 ./internal/seeder
```

上述指令目前仍使用 `backend` 的 test-mode 資料庫初始化，會清表或重建 schema；只可指向可丟棄的 MySQL。後續測試基礎設施將以專屬 Compose project 與外部 reset 取代它。

## 已知基線限制

- `go test ./...` 是唯一安全的預設入口，且不得因為本機存在 MySQL 而連線。
- `-tags=integration` 只選入資料庫測試；仍須分別設定 `ARCHERY_MYSQL_INTEGRATION=1` 或 `SEEDER_INTEGRATION_TEST=1` 才會執行。
- 舊的 MySQL 測試共用 package-level `database.DB`，故整合套件需以 `-p 1` 執行，套件內的併發案例則保留原本行為。
- 此提交只做 Go 分層；前端單元、mock browser、真 E2E 與 CI 的盤點及入口由後續提交處理。
