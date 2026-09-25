# 資料庫 migration

所有環境使用同一組版本化 SQL。dev Compose 的 backend 啟動前執行 `migrate up`。production server 的 migration 版本檢查失敗時只記錄警告，仍繼續初始化與啟動；development／test server 與 seeder 仍要求 clean 最新版本。server 不執行 AutoMigrate、修外鍵或刪欄位。production 若 DB 連線或必要初始化本身失敗仍會退出；舊版、dirty 或未知 schema 上的 API 可能失敗或寫入不符預期，應儘速完成手動 migration。

## 版本與資料

| 版本 | 結構與資料處理 |
| --- | --- |
| V1 | 依 production MySQL 8.4.2 dump 建立 20 張表，保留型別、nullable/default、主鍵、索引、外鍵及 collation；不含 production 資料或當時的自增計數。 |
| V2 | 新增 nullable `eliminations.bracket_seed_count`、nullable `match_results.target` 與 A/B/NULL CHECK；`match_results.player_set_id` 外鍵改為 `ON DELETE SET NULL`；移除 `match_results.total_points`。 |

舊 `bracket_seed_count` 保留 NULL，Go 讀為 0，沿用 legacy 對抗表行為；不猜種子數，不將舊表自動改成新版 bracket。舊 target 保留 NULL，不由靶道推算 A/B。`total_points` 改由既有箭分數即時計算；若原彙總與箭分數不同，新版顯示可能不同，原值僅留於升級前備份。

`player_set_match_tables` 保留 `(player_set_id, player_id)` 複合主鍵；Go model 與此一致。migration 不建立 Dictator 或 No Institution；版本檢查完成後，server/seeder 沿用既有必要資料初始化。

## 命令

Docker image 包含 `/app/migrate`，SQL 隨 binary 內嵌，不需額外掛載 migration 目錄。本機於 `backend` 執行：

```bash
go run ./cmd/migrate --env-file ../.env version
go run ./cmd/migrate --env-file ../.env baseline
go run ./cmd/migrate --env-file ../.env up
# 大表可明示延長每版 SQL 的執行上限。
go run ./cmd/migrate --env-file ../.env up --statement-timeout 15m
# 僅建立到 V1；production server 可啟動，但使用 V2 欄位的 API 可能失敗。
go run ./cmd/migrate --env-file ../.env up --to 1
```

CLI 只要求 `MYSQL_HOST`、`MYSQL_PORT`（預設 3306）、`MYSQL_DATABASE`、`MYSQL_USER`、`MYSQL_PASSWORD`；不要求 Session 或 Dictator 設定。只有明示 `--env-file` 才載入檔案，process environment 優先。host 連線須使用獨立開發 DB 與正確 host/port；production Compose 不公開 MySQL port。Compose service 本身仍會驗證 `.env` 中的部署設定。

- `version` 唯讀顯示未管理、空版本紀錄、版本及 dirty 狀態，不建立版本表。
- `baseline` 核對 V1 schema 後，只登記版本，不執行 V1 建表 SQL。核對包含表、欄位、索引、約束、引擎與 collation；忽略資料列與自增計數。結構不符或版本狀態不符即停止。
- `up` 預設升至最新；`--to` 指定已知目標版本，不允許降版。未管理且非空的 DB 須先 baseline。已達目標版本時不重跑 DDL。每版 SQL 預設最多執行 5 分鐘；`--statement-timeout` 可指定正值，例如 `15m`，由 MySQL driver 實際限制執行時間。
- baseline 與 up 使用同一互斥鎖。SQL 失敗保留 dirty，後續 migration、development／test server 與 seeder 拒絕繼續；production server 記警告後嘗試啟動。

## 全新 DB

先填妥 `.env`。以下在 repository root 執行；production Compose V1 1.29.2 可把 `docker compose` 換為 `docker-compose`：

```bash
docker compose -f docker-compose.yml build
docker compose -f docker-compose.yml up -d mysql
docker compose -f docker-compose.yml ps
# 確認 mysql 為 healthy 後執行。
docker compose -f docker-compose.yml run --rm --no-deps --entrypoint ./migrate backend up
docker compose -f docker-compose.yml run --rm --no-deps --entrypoint ./migrate backend version
docker compose -f docker-compose.yml up -d
```

空庫依序執行 V1、V2。開發環境改用 `docker-compose-dev.yml`，backend 啟動時會自動執行 `migrate up`。非空、未登記版本的 dev DB 仍會被 migration 拒絕，須先依 schema 狀態處理；已跑過 AutoMigrate 的 dev DB 不提供 V2 baseline 或任意 force 接管，請以不同 project／新 DB 初始化，勿刪除仍需保留的 volume。

## 既有 production 接管

先依 [部署指引](deployment.md) 確認 project、資料卷、DB 帳密與可還原備份；建置新版 image。維護期間停止所有舊 server、seeder 與其他寫入來源，取得最後備份後才執行：

```bash
docker compose -f docker-compose.yml stop backend
# 在此完成並驗證停止寫入後的最後備份。
docker compose -f docker-compose.yml run --rm --no-deps --entrypoint ./migrate backend version
docker compose -f docker-compose.yml run --rm --no-deps --entrypoint ./migrate backend baseline
docker compose -f docker-compose.yml run --rm --no-deps --entrypoint ./migrate backend up
docker compose -f docker-compose.yml run --rm --no-deps --entrypoint ./migrate backend version
docker compose -f docker-compose.yml up -d
```

既有 prod 不重跑 V1，不匯入 repository 內任何測試資料。baseline 不符時應比對實際 schema 與預期 V1，不得以改版本號繞過。確認 clean V2，再驗收登入、賽事、排名、對抗賽成績及重新啟動後的持久化。

## 失敗與回復

只提供向前 migration，沒有 `down` 或一般用途的 `force`。MySQL DDL 可能隱含 commit，整版 SQL 並非可原子回滾；dirty 表示該版本可能僅部分完成。停止寫入，保留錯誤與版本資訊，查明原因；修復方案須依實際已完成 DDL 決定，不可直接清除 dirty 重跑。

baseline 若中斷於版本表建立後、寫入 V1 前，可重跑 `baseline`：僅在版本表結構正確、紀錄為空且完整業務結構仍吻合 V1 時補登記，不重跑業務 DDL。若為新空庫且只有空版本表，可重跑 `up`。SQL 逾時後仍須按 dirty 狀態處理；逾時或關閉連線不等於已回滾 DDL。

需回舊版時，使用已驗證的升級前備份，還原至空的替代 DB，再以相符的舊 image／設定啟動。不能只換舊 image；V2 已刪除舊欄位。若原地回復，必須明確核對額外表與 `schema_migrations`：V1 接管前的 dump 不含版本表，直接覆蓋業務表會殘留 V2 版本紀錄。不要用 `down -v` 或 volume prune 代替回復。

`prod_dump.sql` 與備份含私人資料，不入版控、不放入 Docker build context。後續 schema 變更新增更高版本 SQL，並同步 `migration.LatestVersion` 與對應測試；已發佈的 migration 不修改。CI 以合成資料驗證 V1→V2，production dump 僅用於本機隔離還原演練。
