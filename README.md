# NYCU Archery Website

一個用於射箭比賽紀錄分數的系統。

你需要`docker`來運行這個系統。

開發和測試上，前端需要`nodejs`和`npm`、後端需要`go`。

## Configurations

開發與 production 共用根目錄 `.env`；backend 不再讀 YAML，frontend 不再需要獨立 `.env`（Docker build／watch 排除之）。

```bash
cp .env.example .env
chmod 600 .env
```

已有 `.env` 時勿覆蓋。範例只供本地開發，正式站必須更換機密、domain 與 `ARCHERY_ENVIRONMENT=production`；完整欄位與舊設定遷移見 [部署指引](docs/deployment.md)。

Compose 僅將各服務所需變數注入；前端只接收公開的 `NEXT_PUBLIC_API_BASE_PATH`（預設 `/api/`），production build 時固定。初始 Dictator 帳密不覆寫既有帳號，同名普通帳號也不會被升權。

## 啟動本地環境

當前面的設定檔都弄好之後，可以用下面的指令來啟動本地環境：

```bash
docker compose -f docker-compose-dev.yml build
docker compose -f docker-compose-dev.yml up -d
```

dev Compose 的 backend 啟動時先執行 `migrate up`，成功後才啟動 server；重啟亦會檢查版本。seeder 仍要求 clean 最新版本。空庫可直接啟動；未登記版本的既有資料庫須依 migration 指引處理。已跑過 AutoMigrate 的 dev DB 不在接管範圍，請用新的 project 名稱（例如 `-p archery-dev-fresh`）啟動新 DB，並在後續 dev Compose 命令沿用同一 `-p`；原資料卷會保留。`down -v` 只作用於指定的 Compose 檔與 project，不會清掉其他資料卷。命令、版本內容與回復方式見 [資料庫 migration](docs/migrations.md)。

以 `http://localhost` 存取（經 Caddy 同站代理）；需同步前端原始碼時，另執行 `docker compose -f docker-compose-dev.yml watch`。不要與使用相同 project 或 80 埠的 production 同時啟動。

自動化測試另走隔離入口，不使用上述 DB：

```bash
bash scripts/test.sh e2e
```

## Backend Dev Environment

直接在 host 跑 Go 時須明示 env file；不自動搜尋。先備妥獨立開發 MySQL，於本地覆寫檔開啟 loopback port，再以 process env 覆寫 host／port：

```bash
cd backend
MYSQL_HOST=127.0.0.1 MYSQL_PORT=3306 go run ./cmd/migrate --env-file ../.env up
MYSQL_HOST=127.0.0.1 MYSQL_PORT=3306 go run . --env-file ../.env
```

該 DB 的帳密必須與 `.env` 相符；正式 Compose 不公開 MySQL port。若已啟動 Caddy 占用 80 埠，勿同時啟動 host backend（同樣監聽 80）。一般開發建議使用上方完整 dev Compose。

## Development Seeder

後端另有三個可重複執行的開發資料情境；它們**不會**隨一般 server 啟動而執行。先啟動上述 dev Compose，再從根目錄執行：

```bash
docker compose -f docker-compose-dev.yml exec backend go run ./cmd/seeder -scenario registered
docker compose -f docker-compose-dev.yml exec backend go run ./cmd/seeder -scenario qualification_finished
docker compose -f docker-compose-dev.yml exec backend go run ./cmd/seeder -scenario elimination_finished
# 或一次建立全部
docker compose -f docker-compose-dev.yml exec backend go run ./cmd/seeder -scenario all
```

- 每個情境各建一場賽事；重跑以 `Competition.Script` 的 seeder marker 偵測，已存在的情境完全不改寫。
- 三場賽事的 `HostID` 都會查詢資料庫中 ID 最小、`Role=Dictator` 的 user，不假定其 ID。
- 每場賽事含 1 個 unassigned group 與 4 個正式項目（項目 = 正式 Group，各有獨立 Qualification、排名與個人對抗賽）：
  - 公開男子反曲弓組：靶道 1-4
  - 公開女子反曲弓組：靶道 5-8
  - 新人反曲弓組：靶道 9-12
  - 公開男子複合弓組：靶道 13-16
- 每個項目 8 位選手、4 條不重疊靶道、每靶道 2 人（order 1 與 2）；正式靶道為 1-16，靶道 0 保留為 unassigned lane。
- `registered`：主辦人為 approved Admin，32 位選手皆為 approved Player，各項目已有 Player／Round／End／箭位列，但箭值仍為 `-1`、RoundEnd 未 confirmed。
- `qualification_finished`：另有各項目完成的排名賽、項目內獨立名次 1-8、資格賽啟用狀態。
- `elimination_finished`：各項目另有完整個人對抗賽（8 強 4 場、4 強 2 場、冠軍賽與銅牌戰各 1 場）、結果、箭位及獎牌；末階段第一場為冠軍賽，與前端 `parseStagesToTree` 的讀取順序一致。
- seeder 建立的登入帳號為 `seeder.archer.01` 至 `seeder.archer.32`，其中複合弓項目使用 `seeder.archer.25` 至 `seeder.archer.32`；密碼皆為 `archery-seed-password`；僅可在 `ARCHERY_ENVIRONMENT=development` 或 `test` 使用，其他值一律拒絕執行。
- 三場賽事各有一位 approved `Judge`，共用以下裁判帳號；此帳號不會建立 Player：

| 帳號 | 密碼 | 可登入情境 |
| --- | --- | --- |
| `seeder.judge` | `archery-seed-password` | `registered`、`qualification_finished`、`elimination_finished` |

- 此 Judge 帳號及所有 seeder 帳號**僅限 development/test**；不可用於 production。
- `Competition.Script` 的 seeder marker 保持不變，seeder 不遷移既有三項 fixture。舊 seeded DB 因缺少 Judge 不符合新版 invariant；欲採用新版 fixture，須於全新且可丟棄的 dev/test DB 重建。

可在可丟棄的 test DB 驗證資料不變量與冪等性：

```bash
scripts/test.sh go-integration -run TestSeedScenarioInvariants
```

## 對抗賽首輪更新

1. 管理員建立對抗表，產生固定大小的空白階段與對戰。
2. 建立隊伍並儲存排名；隊伍與排名變更不會自動更新對抗表。
3. 在第一階段按「依隊伍排名更新第一階段」，依目前儲存的排名填入首輪。所有隊伍須完成排名，排名不得重複或超出種子名額；允許缺號，其位置保留為空位。

此操作會覆寫尚未開始的首輪人工安排。若要更換的對戰已有成績、確認、勝方或受影響的後續賽果，整次更新會被拒絕；請使用人工修正流程處理。隊伍若仍被對戰或獎牌引用，須先移除或更換引用才可刪除。

資格賽／對抗賽資料模型、計分、確認與裁判更正規則見 [計分模型與操作契約](docs/scoring.md)。

## Tests

需要 Go 1.23、Node 22、Docker Compose，以及 Chromium。先下載依賴：

```bash
(cd backend && go mod download)
(cd frontend && npm ci && npx playwright install --with-deps chromium)
```

從根目錄使用統一入口：

```bash
scripts/test.sh go-unit
scripts/test.sh go-integration
scripts/test.sh frontend-unit
scripts/test.sh browser
scripts/test.sh e2e
scripts/test.sh all
```

真 E2E 與 Go 整合由 runner 建立各自的 tmpfs MySQL／Compose project，不讀取開發 DB 憑證；請使用上述入口，不要直接連開發資料庫。Server 重啟不清賽事，亦無 `/api/test/restore`。

測試分層、資料庫隔離、`hybrid`／`full-ui`、headed／debug 指令、CI、報告與故障排查，統一見 [測試操作指引](docs/testing.md)。

## Deployment

Production 使用根目錄 `.env` 與 `docker-compose.yml`，支援 Compose V1 **1.29.2** 及現行 `docker compose`。Caddy 自動簽發與續期 HTTPS 憑證。

首次部署、舊 Nginx／YAML 遷移、DB volume 保留、備份／回復及驗收步驟，見 [Production 部署與 HTTPS](docs/deployment.md)。**舊站先確認原 project 與 DB volume，再切換；不要直接套用開發範例。**

## API Reference

如果更新了 gin swag 的註解，在運行前需要在 terminal 中輸入 swag init (應該會出現 doc 檔案)。
http://localhost/swagger/index.html#/

## Tech Stack

**Client:** React, TS, Redux, Preact/Signal, Material-UI, Sass

**Reverse proxy** Caddy

**Server:** Go, Gin, Gorm

**Database** MySQL

## Appendix

### Custom Theme

因為 TS，在自訂 MUI 主題的時候，需要對 MUI 本身的套件進行擴展，不然 TS 的編譯器會報錯。針對自訂主題的擴展在`frontend_xxx/src/style/theme.d.ts`。
詳情見：https://mui.com/material-ui/customization/theming/
目前只有 frontend_scoring 實作了此項目。

## Tips
- Dictator 帳號可以創建比賽，按鈕位於「我的比賽」頁面底下。初次帳密由 `ARCHERY_DICTATOR_USERNAME`／`ARCHERY_DICTATOR_PASSWORD` 設定；帳號建立後，以資料庫保存的密碼為準。

#### 一些問題

目前在正確的擴展套件後，編譯器仍然會有一些意見，然而整個前段是可以正常建起來的。所以目前是用可以讓編譯器安靜的各種方法先讓它安靜。
在使用 custom color 的時候要進行斷言`as unknow as undifined`

## FAQ

#### 註冊帳號時沒有組織可以選怎麼辦？

目前要手動戳 API POST `http://localhost/api/institution`。

POST body:

```
{
    name: "institution"
}
```
