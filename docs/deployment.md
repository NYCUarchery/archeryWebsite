# Production 部署與 HTTPS

單機部署使用根目錄 `.env`、`docker-compose.yml` 與 Caddy。Caddy 負責首次簽發、續期與 HTTP → HTTPS；API 與前端共用 domain。操作從 repository root 執行。

## 工具與相容範圍

- Production 設定支援 Compose V1 **1.29.2** 與現行 `docker compose`。文件以 `docker compose` 為主；V1 使用者將命令前綴換為 `docker-compose`。
- 保留 `version: "3.8"` 是為 V1 相容；新 Compose 的 obsolete warning 可忽略。Production 不使用頂層 `name`、`develop`、`up --wait` 等新功能。
- Debian 12、Debian `docker.io` Engine 20.10.24 可先評估單獨安裝官方 Compose CLI plugin；安裝 plugin 與更換 Engine 是兩件事。先確認 CPU 架構、固定下載版本並驗 checksum；保留舊 V1 執行檔，確認 API 及 build 可用後才切換管理工具。手動安裝的 plugin 需自行維護更新。
- 安裝 plugin 本身不需重啟 daemon；首次由 V1 改用新 Compose `up` 可能重建容器，仍須安排維護時段。不要交替以兩種工具反覆 `up` 同一個 project。
- development watch 與隔離測試 runner 使用現行 Compose；不承諾 V1 支援這兩個入口。

官方資料：[Compose plugin 安裝](https://docs.docker.com/compose/install/linux/)、[V1 相容格式](https://docs.docker.com/compose/intro/history/)、[Engine 20.10 release notes](https://docs.docker.com/engine/release-notes/20.10/)。

## 根目錄 `.env`

```bash
cp .env.example .env
chmod 600 .env
```

`.env.example` 是本地開發範例；**production 必須改成自己的設定與機密**。已有 `.env` 時不要再次複製覆蓋。

| 欄位 | Production 設定 |
| --- | --- |
| `COMPOSE_PROJECT_NAME` | 原機升級填目前實際 project；新機可自訂。決定 DB volume 名稱。 |
| `ARCHERY_ENVIRONMENT` | `production`；啟用 Gin release mode 與 Secure cookie。 |
| `ARCHERY_SITE_ADDRESS` | 裸 domain，例如 `archery.club.nycu.edu.tw`；不可填 `:80` 或 `http://…`。 |
| `ARCHERY_ACME_EMAIL` | 收得到信的管理員 email。 |
| `MYSQL_HOST` / `MYSQL_PORT` | Compose 內為 `mysql` / `3306`。 |
| `MYSQL_DATABASE` / `MYSQL_USER` / `MYSQL_PASSWORD` | 對應實際 DB 與應用帳號；新站使用非 root 專用帳號。 |
| `MYSQL_ROOT_PASSWORD` | MySQL 管理密碼，只注入 MySQL container。 |
| `ARCHERY_SESSION_KEY` | 至少 32 bytes 的持久隨機 secret；可用 `openssl rand -hex 32` 產生。改值會使舊 session 失效。 |
| `ARCHERY_DICTATOR_USERNAME` / `ARCHERY_DICTATOR_PASSWORD` / `ARCHERY_DICTATOR_EMAIL` / `ARCHERY_DICTATOR_OVERVIEW` | 首次建立最高權限帳號；overview 可空。既有帳號不被重寫；同名普通帳號導致啟動失敗。 |
| `NEXT_PUBLIC_API_BASE_PATH` | 預設 `/api/`；此值公開且在 frontend **build 時**固定，變更須 rebuild。 |

密碼宜以單引號包覆，尤其含 `$`、`#` 或空白時；不做 `${OTHER_VAR}` 串接，避免不同 dotenv parser 的差異。新密碼使用隨機 hex 較易搬移。不要把 `.env` 當 shell script `source`，也不要公開貼出 `docker compose config` 完整輸出；其中會含密碼。

Compose 從 `.env` 插值，再按 service 白名單注入環境變數；shell 已設定的同名值優先。backend、server、seeder 不自動搜尋 `.env`，不再讀任何 YAML config。直接在 host 執行 Go 時，使用 `--env-file ../.env`；既有 process environment 優先於該檔。

## 首次部署

1. domain 的 A／AAAA 指向此 server；只有實際可連的 IPv6 才留 AAAA。對外 TCP 80／443 導向此主機且未被其他服務占用，並允許向 ACME issuer 發出 HTTPS 請求。確認 CAA 未禁止 issuer。
2. 填妥 `.env`，確認 `ARCHERY_ENVIRONMENT=production`、site address 是公開 domain。
3. 驗設定與建置，再啟動：

```bash
docker compose -f docker-compose.yml config --quiet
docker compose -f docker-compose.yml build
docker compose -f docker-compose.yml run --rm --no-deps reverse-proxy caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile
docker compose -f docker-compose.yml up -d mysql
# 確認 mysql healthy 後，手動建立 V1、V2。
docker compose -f docker-compose.yml run --rm --no-deps --entrypoint ./migrate backend up
docker compose -f docker-compose.yml up -d
docker compose -f docker-compose.yml ps
docker compose -f docker-compose.yml logs --tail=100 backend reverse-proxy
```

`up -d` 返回不代表服務或憑證已就緒。MySQL healthcheck 以 TCP 避開初始化暫時 server；backend 等待 MySQL healthy。待 backend 完成初始化、Caddy 成功取得憑證後，依下節驗收。取證失敗看 Caddy logs；不反覆刪憑證 volume，以免觸發 CA 限額。

`/api`、`/api/*`、`/swagger`、`/swagger/*` 原路徑轉送 backend；其他路徑送 frontend。MySQL、backend、frontend 不公開 host port，Caddy admin API 不公開。

## 原機升級：先識別資料，再切換

原 machine 上可能有尚未提交的 Compose／Nginx 修改，必須先保存；不要直接 reset checkout。遷移前使用現行管理指令（若是 V1，即 `docker-compose`）取得：

```bash
git status --short
git rev-parse HEAD
docker-compose -f docker-compose.yml ps -q mysql
# 把上一行 ID 代入；只列 project 與掛載，避免輸出 container 中的機密。
docker inspect --format '{{index .Config.Labels "com.docker.compose.project"}} {{range .Mounts}}{{.Name}}:{{.Destination}} {{end}}' MYSQL_CONTAINER_ID
```

將實際 project 寫入新 `.env` 的 `COMPOSE_PROJECT_NAME`。例如 project `archerywebsite` 的 DB volume 通常為 `archerywebsite_db_data`，但須以 inspect 為準；若實際是自訂 volume，先調整 Compose volume mapping 再部署。`docker compose config --volumes` 只顯示邏輯名稱，**不能據此證明實際 volume 相同**。

遷移次序：

1. 記下舊 commit、image IDs、project、DB volume；將舊 Compose／Nginx 設定、三份 backend YAML、session key 及現有 `.env` 安全備份。不要刪舊 Certbot volumes。
2. 使用目前有效的 DB 管理帳密完成 SQL dump，並在另一個可丟棄 DB 驗證可還原。若舊 MySQL container environment 已與實際密碼不同，必須用實際密碼，不能只照搬範例。
3. 將舊 YAML 逐值搬入根 `.env`，保留實際 database、DB 密碼、管理員 username 與 session key。production key 不符最低長度時產生新 key，安排使用者重新登入。MySQL `MYSQL_*` 初始化變數**不會修改既有 volume 中的帳號或密碼**；此次先保留現值，輪替另做。
4. 於獨立 worktree 建新版本、驗 config；使用原 project 名切換前，確認新 Compose 將掛載同一 DB volume。新 source 可在另一目錄，但舊 checkout 與 build artifacts 必須留供 rollback。
5. 維護時段停止舊 backend 接受寫入，作最後備份；依 [migration 指引](migrations.md#既有-production-接管) 驗證並登記 V1、執行 V2，確認 clean 最新版本後，才以相同 project 的新設定 `up -d`。此時 proxy 服務名仍為 `reverse-proxy`，由 Compose 重建成 Caddy；Caddy 自行簽新憑證，無須匯入 Certbot。
6. 做 HTTPS／登入／賽事讀取驗收，並重新 inspect MySQL mount，確認相同 volume；完成前不要輪替 DB 密碼或清理舊 images。

只測試新 branch 時，須用獨立 project、可丟棄 DB 與其他 host port；不要在 production checkout 直接執行開發 Compose 或測試用 `up`。

## 日常更新、備份與回復

### 備份

先設限輸出權限。以下在 **目前管理中的 project** 執行，會讀現有 MySQL container 的 root password；不將密碼展開至 host command line：

```bash
umask 077
mkdir -p backups
docker compose -f docker-compose.yml exec -T mysql sh -c 'export MYSQL_PWD="$MYSQL_ROOT_PASSWORD"; exec mysqldump -uroot --single-transaction --routines --events --triggers --no-tablespaces --set-gtid-purged=OFF "$MYSQL_DATABASE"' > "backups/db-$(date +%Y%m%d-%H%M%S).sql"
```

檢查命令退出碼與檔案大小，定期作還原演練；備份需另存於主機外安全位置。升級 schema 的回復點應在停止 backend 寫入後取得。`.env`、舊設定與 SQL 備份含機密，不入版控。

Caddy `/data` 保存憑證與 ACME 帳號，`/config` 保存狀態；以 volume 備份工具備存之。新 Compose 僅移除舊 Certbot 的宣告，不會自動刪除其既有 volume。[Caddy 儲存說明](https://caddyserver.com/docs/conventions/)

### 更新

worktree 無未保存修改後，更新到選定 release／commit 並建置。停止所有 backend 寫入、完成最後備份，再手動遷移；已有版本紀錄者不重跑 baseline：

```bash
git pull --ff-only
docker compose -f docker-compose.yml config --quiet
docker compose -f docker-compose.yml build
docker compose -f docker-compose.yml stop backend
# 在此完成停止寫入後的最後備份；未管理的 prod 先依 migration 指引 baseline。
docker compose -f docker-compose.yml run --rm --no-deps --entrypoint ./migrate backend up
docker compose -f docker-compose.yml run --rm --no-deps --entrypoint ./migrate backend version
docker compose -f docker-compose.yml up -d
docker compose -f docker-compose.yml ps
docker compose -f docker-compose.yml logs --tail=100 backend reverse-proxy
```

此流程不主動 pull MySQL 新 image；Engine／MySQL image 升級另排維護時段。Caddyfile 烘入 proxy image，修改後 rebuild 並 `up -d`；平時憑證續期由 Caddy 自行完成，不需 Certbot、cron 或手工 reload。[Automatic HTTPS](https://caddyserver.com/docs/automatic-https/)

### 回復

先停止新 backend 接受寫入。以已保存的舊 checkout、設定、原 project 與 image 重建舊服務；切回舊 Nginx 時需原憑證掛載仍可用。若該版本 schema 不相容，僅回舊 image 不足，須維護停機並從升級前 SQL 還原。不要讓新舊 backend 同時寫同一 DB。

**還原 SQL 會覆寫資料；只能在確認目標 project、停止 backend 且有可用備份後執行。以下檔名是明示佔位，需改成已驗證的備份。**

```bash
docker compose -f docker-compose.yml stop backend
docker compose -f docker-compose.yml exec -T mysql sh -c 'export MYSQL_PWD="$MYSQL_ROOT_PASSWORD"; exec mysql -uroot "$MYSQL_DATABASE"' < backups/VERIFIED-BACKUP.sql
docker compose -f docker-compose.yml up -d backend reverse-proxy
```

dump 可重建其所含表，但不保證刪除新版本額外建立的表。跨 schema 回復優先還原至空的替代 DB，再切換相符舊版；原地還原前須處理額外表與版本紀錄。接管前 dump 不含 `schema_migrations`，不可保留升級後 V2 紀錄。V2 已刪除 `match_results.total_points`，僅切換 image 不足。詳見 [migration 失敗與回復](migrations.md#失敗與回復)。

不要以 `down -v`、`volume prune` 或刪除 Docker data directory 作更新／回復手段。即使短暫回到 V1，仍須保持 project 與資料卷相同。

## 驗收與故障排查

將以下 domain 替換成 `.env` 的值：

```bash
curl -I http://archery.club.nycu.edu.tw/login
curl -I https://archery.club.nycu.edu.tw/login
curl --fail https://archery.club.nycu.edu.tw/api/competition/
```

- HTTP 應跳 HTTPS，HTTPS 憑證有效且 domain 正確；瀏覽器沒有 mixed-content 請求。
- 登入後 `mysession` cookie 具 `Secure`、`HttpOnly`、`SameSite=Lax`；驗重新整理、登出及賽事讀取。使用沿用的強 session key，保留 session 格式與名稱。
- 重建 Caddy container 後仍用相同 `caddy_data`；不要用清空 volume 測續期。
- ACME 失敗：查 DNS、AAAA、CAA、80／443、NAT／上游代理與 Caddy log。暫時的 CA 限額需等候，不反覆清空 state。
- 502：先查 backend DB 登入／啟動錯誤、frontend log，再查 Caddy upstream；`up -d` 不等於 readiness。
- 密碼錯誤：檢查實際 DB user 密碼、dotenv 單引號與 shell 同名變數；變更 `.env` 不會替既有 MySQL 帳號改密碼。
- DB 密碼輪替需先以管理連線修改 MySQL user，再同步 `.env` 並 recreate backend；root password 另同步 MySQL container env。session key 輪替會讓使用者登出。單改 Dictator 初始密碼不會改既有帳號密碼。
- Host Go 開發：僅啟 MySQL 時可於本地專用覆寫檔開 loopback DB port，並以 `MYSQL_HOST=127.0.0.1` 覆寫 `--env-file`；正式 Compose 不開 DB host port。

CI 驗證 V1／現行 Compose 的設定格式、Caddy 設定及隔離 E2E。公開 CA 首次簽發與真 DNS 只能在目標站驗收；本地驗證不等於已完成 production 發布。
