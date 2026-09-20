# 測試操作指引

本文件說明可重複執行的測試邊界、入口與產物。測試案例本身是行為規格；本文件不複製固定帳號、箭序或分數資料，請以對應測試檔為準。

## 快速選擇

| 目的 | 入口（於 repository root） | 主要範圍 |
| --- | --- | --- |
| Go 純單元 | `bash scripts/test.sh go-unit` | 不連資料庫的 Go 邏輯、router、helper、seeder 規格 |
| MySQL 整合 | `bash scripts/test.sh go-integration` | schema、transaction、handler、權限、Seeder |
| 前端純單元 | `bash scripts/test.sh frontend-unit` | Vitest 邏輯、oracle、執行模式與報告比較器周邊 |
| 前端 mock browser | `bash scripts/test.sh browser` | Playwright UI 互動與 API mock |
| 真服務 E2E | `bash scripts/test.sh e2e` | 瀏覽器、隔離服務、MySQL、真 API |
| 全層 | `bash scripts/test.sh all` | 依上表順序執行；不含額外的型別、lint、build 與 runner safety 檢查 |

可將檔名或 Playwright 選項附於相應入口，例如：

```bash
bash scripts/test.sh e2e competitionLifecycle.spec.ts --headed
bash scripts/test.sh e2e competitionLifecycle.spec.ts --debug
bash scripts/test.sh e2e --project=firefox
```

`--headed` 與 `--debug` 需要可用的桌面顯示環境；未指定時為 headless。真 E2E 必須走 runner，不可直接以 `playwright test` 取代，否則缺少隔離 manifest 會失敗。

明示 lifecycle 模式時：

```bash
ARCHERY_E2E_MODE=hybrid bash scripts/test.sh e2e competitionLifecycle.spec.ts
ARCHERY_E2E_MODE=full-ui bash scripts/test.sh e2e competitionLifecycle.spec.ts --headed
ARCHERY_E2E_MODE=full-ui bash scripts/test.sh e2e competitionLifecycle.spec.ts --debug
```

## 依賴與基本檢查

- Go 指令的 module root 是 [`backend/go.mod`](../backend/go.mod)，故從 `backend` 執行原生 Go 指令；預設測試可用 `GOCACHE=/tmp/archery-go-build go test ./...`。
- 隔離整合／E2E 需現行 Docker Compose（非 V1）、Go 1.23、Node 22 與已下載 Go modules（`cd backend && go mod download`）。
- 前端需 `cd frontend && npm ci`；Playwright browser 依所選 engine 安裝，例如 `npx playwright install --with-deps chromium`。瀏覽器 CI 固定 Ubuntu 24.04，且保留 `--with-deps`，使 Playwright 下載版本與系統相依套件同時對應。
- 升 Playwright 時，先查官方 release 與 Node engine，將 [`frontend/package.json`](../frontend/package.json) 的 `@playwright/test` 更新為精確版本，再於 `frontend` 執行 `npm install --package-lock-only`；提交 manifest 與 lockfile，並以各 CI browser engine 重跑測試。不可只改 browser binary 或手動補單一系統套件。
- 型別、lint 與 production build 分別在 `frontend` 執行 `npm run typecheck`、`npm run lint`、`npm run build`。
- runner／報告比較器安全測試於根目錄執行 `node --test scripts/test-env.test.mjs scripts/test-env-control.test.mjs scripts/compare-lifecycle-results.test.mjs`。

`scripts/test.sh` 是穩定總入口；可見 [`scripts/test.sh`](../scripts/test.sh)。前端 npm scripts、瀏覽器 project 與 reporter 設定分別見 [`frontend/package.json`](../frontend/package.json)、[`frontend/playwright.browser.config.ts`](../frontend/playwright.browser.config.ts)、[`frontend/playwright.config.ts`](../frontend/playwright.config.ts)。

## 層次與權責

### Go 單元與 MySQL 整合

`go-unit` 不應建立資料庫連線；資料庫案例以 `integration` build tag 隔離。整合 runner 固定以 `-tags=integration -p 1 -count=1` 執行，因部分舊案例共用 package-level `database.DB`；案例內明示的併發情境仍照原設計測試。

整合層涵蓋實際 schema／資料存取、籤表與資格排名、選手與 PlayerSet 管理、對抗賽結果、權限拒絕、transaction／lock 與 Seeder。請以 [`backend/internal/database`](../backend/internal/database)、[`backend/internal/endpoint`](../backend/internal/endpoint) 及 [`backend/internal/seeder`](../backend/internal/seeder) 的 `*_integration_test.go` 與測試檔為準。

切勿手動帶 `-tags=integration` 連向開發 DB。runner 產生專屬設定與帳號，不讀開發 DB 憑證；`ResetTestDatabase` 只接受 runner 所有的 schema、內網 `mysql:3306` 與相符 run ID。缺設定或 fixture 名稱錯誤均應失敗，而非 skip。此 guard 防止誤接開發環境，非能對可任意改程式或環境變數的 host owner 提供安全隔離；實際邊界是獨立 Docker network 與單一測試 DB 授權。防護實作見 [`backend/internal/database/test_setup.go`](../backend/internal/database/test_setup.go)，reset CLI 見 [`backend/cmd/testdb/main.go`](../backend/cmd/testdb/main.go)。

可用 fixtures 為：

- `empty`：只有 schema。
- `legacy`：既有 SQL fixture 加測試主辦人。
- `accounts`：lifecycle 用的組織與角色帳號；不建立比賽、participant、分數或賽果。

CLI 為 `testdb reset --fixture empty|legacy|accounts`，只接受 runner 配發的 `ARCHERY_TEST_DATABASE`、`ARCHERY_TEST_DB_PASSWORD`、`ARCHERY_TEST_RUN_ID` 及固定的 `ARCHERY_TEST_DB_HOST=mysql`、`ARCHERY_TEST_DB_PORT=3306`、`ARCHERY_TEST_DB_USER=archery_test`、`ARCHERY_TEST_ENVIRONMENT=test`；不回讀一般 `MYSQL_*` 或 YAML。三種 development Seeder 情境另見 [README](../README.md#development-seeder)，與上述 fixture 不同。

E2E runner 先以 `empty` 建環境；自動 fixture 於每一真 E2E case 建立 page/context 前關閉既有 contexts，再 reset 該 case 的 fixture。lifecycle 指定 `accounts`；其流程中不得 reset。

### 前端單元與 mock browser

Vitest 不啟動 Next 或瀏覽器。保留純函式／資料 oracle（排名、獎牌、分數與晉級邊界）、hybrid API guard，及 lifecycle 結果快照比較等可快速定位的檢查；見 [`frontend/tests/unit`](../frontend/tests/unit)。這些 oracle 不應呼叫產品計分函式產生預期值。

mock browser 由 browser config 啟動 Next，且可平行執行；驗證籤表、賽程、記分、資格賽、裁判窄螢幕、草稿與 RWD 等短互動。其 fixture 會拒絕未明確 mock 的 `/api/` 請求，故網路遺漏會立即顯示。案例與 mock fixture 見 [`frontend/tests/browser`](../frontend/tests/browser)。

預設 browser 只跑 Chromium；需要跨 engine 時在 `frontend` 執行：

```bash
npm run test:browser:firefox
npm run test:browser:webkit
npm run test:e2e:firefox
npm run test:e2e:webkit
```

後兩項仍會呼叫隔離 runner。短測試不因 lifecycle 覆蓋同頁面而刪除：mock UI 留住 RWD、草稿與 request 細節；DB 整合留住權限、BYE、加射、併發與持久化邊界。

## 真 E2E 與 lifecycle

E2E runner 於 [`scripts/test-env.mjs`](../scripts/test-env.mjs) 建立每次專屬 Compose project、tmpfs MySQL、隨機密碼與 session key；資料庫不公開 host port。不生成 YAML，不讀 root `.env`，並排除呼叫者的 `COMPOSE_*`／`MYSQL_*`。私有 JSON manifest 保存測試控制權杖與隨機設定。它先重置 `empty` fixture，再啟動 backend、production frontend、proxy，將隨機 loopback port 的 base URL 與 manifest 傳給 Playwright。真 E2E 固定一 worker、零 retry，首個失敗即停止；timeout 用於防止永久掛起，非效能門檻。

正常完成、測試失敗、逾時、SIGINT 或 SIGTERM 時，runner 都會嘗試收集 service log、移除 reset container、停止其擁有的 Compose project，並刪除暫存設定。若 cleanup 第一次失敗會重試；cleanup 仍失敗即使測試通過也視為失敗。SIGKILL 或 host crash 時此 finally cleanup 不可保證執行。只可清理由本次 manifest 識別的 project；若 control lock 遺留或過期，勿原地接管，丟棄整個專屬 project。

fixture 的外部控制是 host-side runner 操作，不是 HTTP API：`reset` 依序關閉 browser contexts、停止 backend、reset、重新啟動並等候就緒；`restart` 只關閉 contexts、停止並啟動 backend，絕不 flush 或 reset 資料。控制實作見 [`frontend/tests/e2e/fixtures.ts`](../frontend/tests/e2e/fixtures.ts) 與 [`scripts/test-env-control.mjs`](../scripts/test-env-control.mjs)。

`/api/test/restore` 已移除；所有 server mode 啟動只做 schema 與必要基礎初始化，不清賽事，也不自動執行 development Seeder。

[`competitionLifecycle.spec.ts`](../frontend/tests/e2e/competitionLifecycle.spec.ts) 涵蓋反曲、複合兩組，各 12 人；個人各取前 8 名，各組另建 4 支三人隊。第 9–12 名不得進個人籤表，仍可參團。完成定義是兩組個人／團體共四項頒牌，沒有新增整場 `finished` 欄位。

流程涵蓋申請／核准、資格賽、個人與團體賽、晉級、頒牌、三次裁判更正、草稿、跨角色讀回與重啟持久化；另驗 A→B→A 及個人→團體→個人切換，各項進度互不污染。資格賽固定箭序在 [`lifecycle/data.ts`](../frontend/tests/e2e/lifecycle/data.ts)，其餘預期與操作見 [lifecycle helpers](../frontend/tests/e2e/lifecycle)。資料中的 `X` 是測試壓縮記號，實際填 `10`，不可與產品內十環值 `11` 混用。

`ARCHERY_E2E_MODE` 只接受 `hybrid` 或 `full-ui`；未設定預設 `hybrid`，空白或未知值失敗。兩模式共用同一 lifecycle 與結果 assertion：

| 模式 | 業務寫入 |
| --- | --- |
| `full-ui` | 全部經 UI，作為完整端到端展示。 |
| `hybrid` | 只將固定、重複的申請／核准與填分改走正式 API；建賽、設定、建隊、排名、建表、進度、晉級、頒牌、更正、草稿、切組與跨角色讀回仍走 UI。 |

hybrid 不可用 Seeder、直接 DB 寫入、後門或 UI 失敗後 fallback。API 操作使用真實角色 session，先解析並驗證資源範圍與目前狀態，且不得覆寫已由 UI 確認的資料。模式解析與 API guard 見 [`frontend/tests/e2e/lifecycle/execution.ts`](../frontend/tests/e2e/lifecycle/execution.ts)，正式 API helper 見 [`frontend/tests/e2e/lifecycle/formalApi.ts`](../frontend/tests/e2e/lifecycle/formalApi.ts)。

其餘申請者各自以獨立 API context 登入、核對本人並申請；Admin 核准，真正 approved Judge 的 `page.request` 補分。儲存後才確認，逐次讀回箭值、總分與確認狀態；UI 抽樣亦驗實際 request 目標與 payload。裁判更正保留暫定分數及原時機，不提前 API 補答案。最終仍驗 24 位 Player、Judge 無 Player、建立者為 Admin。

固定抽樣如下；full-ui 對同一批操作全部經 UI。實際數值由 coverage ledger 驗證，勿以文件取代測試：

| 項目 | hybrid UI | hybrid API |
| --- | --- | --- |
| 申請／核准 | Archer 01、13、Judge，共 3 人 | 其餘 22 位選手 |
| 資格賽選手波次 | Archer 01、13 首波；Judge 替 Archer 02、14 各填六波，共 14 | 130 |
| 對抗賽每方波次 | 四項首場全波；後續各階段 Match 1 首波，皆含雙方，共 42 | 142 |

## 結果附件與比較

lifecycle 無論成功或失敗都附 `lifecycle-coverage-ledger`；`lifecycle-result-snapshot` 非 finally 附件，僅成功走至結果收集點才附上，故失敗時不保證存在：

- `lifecycle-coverage-ledger`：模式及 UI/API 固定抽樣計數。
- `lifecycle-result-snapshot`：排除本次生成 ID 的資格賽、隊伍／成員、對戰、確認狀態、進度與獎牌語意快照。

比較器要求每份輸入恰有一個 lifecycle case、無失敗／skip／retry、模式與 ledger 相符，並比較 `full-ui` 與一至兩份 `hybrid` 的快照：

```bash
node scripts/compare-lifecycle-results.mjs \
  full-ui test-artifacts/e2e/<full-ui>/results.json \
  hybrid test-artifacts/e2e/<hybrid>/results.json
```

可加入第二份 hybrid 結果。缺 attachment、計數錯誤或快照不同均非零結束。實作與其單元測試見 [`scripts/compare-lifecycle-results.mjs`](../scripts/compare-lifecycle-results.mjs) 及 [`scripts/compare-lifecycle-results.test.mjs`](../scripts/compare-lifecycle-results.test.mjs)。

完整驗收需兩個全新環境的 hybrid 與一次 full-ui 通過並比對一致；零 retry、無新增 skip。比較器列出 step 耗時，應同機循序測量，另記環境準備／建置 cache 狀態，不任設效能門檻。

## 產物、CI 與故障排查

| 層次 | 主要產物 |
| --- | --- |
| Go unit | `test-artifacts/go-unit/go-test.jsonl`、`coverage.out`（設定 `ARCHERY_TEST_REPORT_DIR` 時） |
| Go integration | `test-artifacts/go-integration/<run-id>/`：JSON、coverage、service log |
| 前端 unit | `frontend/coverage/`（coverage 指令） |
| mock browser | `frontend/playwright-report/browser/`、`frontend/test-results/browser/` |
| 真 E2E | `test-artifacts/e2e/<run-id>/`：JSON、HTML、trace、截圖、service log |

Playwright 只在失敗時保留 trace 與截圖；lifecycle trace 關閉連續 screenshot filmstrip，但保留失敗頁面證據。先讀 JSON／HTML、trace、服務 log 與 attachment，按模式、UI/API、角色、組別、階段、對戰與波次定位；不可以 retry 或改走另一條路徑掩蓋失敗。

接受 lifecycle 的故障注入時，僅在可丟棄 source 副本做單一 UI 範圍 mutation，預期對應 A→B 切換／scope assertion 失敗；移除副本後比對原專案未變，再在全新隔離環境跑正向流程。此法驗證 assertion 能捕捉缺陷，不將故障 run 當通過結果。

PR workflow 於 [`.github/workflows/test.yml`](../.github/workflows/test.yml) 執行 runner safety、Go unit、隔離 integration、frontend typecheck/lint/build/unit coverage/mock browser 與 Chromium E2E；PR lifecycle 固定 `hybrid`。`workflow_dispatch` 可選 `hybrid`／`full-ui` 與 Chromium、Firefox、WebKit。各 artifact job 以 `always()` 上傳；coverage 是基線報告，非百分比門檻。

常見問題：

- Go 在 repository root 報找不到 module：改在 `backend` 執行，或使用 `scripts/test.sh`。
- E2E 缺 manifest／連到本機服務：改走 `scripts/test.sh e2e` 或 `npm run test:e2e*`。
- browser 啟動失敗：確認對應 Playwright browser 已安裝；headed/debug 另確認 display。
- integration reset 拒絕設定：不要補開發 DB 環境變數，檢查是否透過 runner 啟動。
- cleanup 失敗：保留 runner 輸出的 artifact 與 project 名稱供診斷；僅在確認其由本次 runner 建立後，處理該專屬 project。
