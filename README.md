# NYCU Archery Website

一個用於射箭比賽紀錄分數的系統。

你需要`docker`來運行這個系統。

開發和測試上，前端需要`nodejs`和`npm`、後端需要`go`。

## Configurations

### 後端

- 後端有需要的設定檔都在`backend/config`裡面，目前有`db.yaml`、`dictator.yaml`、`session.yaml`。
- 相對應的地方會有對應的example檔案，可以複製一份改名成正確的檔名來使用。
- 每個config檔都是必要的。
- 應該看起來像是以下結構：

```shell
archeryWebsite
├── backend
│   ├── assets
│   │   ├── seeder
│   │   └── testData
│   ├── config
│   │   ├── db.yaml
│   │   ├── dictator.yaml
└───└───└── session.yaml
```
- db.yaml: 資料庫的設定檔。
- dictator.yaml: 用來設定唯一最高權限的設定檔。
- session.yaml: 用來設定session token key的設定檔。

### 前端

- 前端的設定檔是`./frontend/.env`，可以參考`./frontend/.env.example`來建立。如果是本地的話直接用預設值就好。

## 啟動本地環境

當前面的設定檔都弄好之後，可以用下面的指令來啟動本地環境：

```bash
docker compose up -f docker-compose-dev.yml up --build
```

如果是要測試或是按按看的話，可以用下面的指令來啟動測試環境：

```bash
docker compose -f docker-compose-test.yml up --build
```

## Backend Dev Environment

後端開發環境可以用 container 開一個 DB 來連，不用把整個 app compose 起來。

用下面的指令可以創建一個 mysql db container:

```bash
docker run --name mysql-container -e MYSQL_ROOT_PASSWORD=password -e MYSQL_DATABASE=db -e MYSQL_USER=user -e MYSQL_PASSWORD=password -p 3306:3306 -d mysql:latest
```

- And your /backend/config/db.yaml should be like this:

```yaml
username: root
password: password
host: localhost
port: 3306
database: db
mode: dev # dev or test
```

## Development Seeder

後端另有三個可重複執行的開發資料情境；它們**不會**隨一般 server 啟動而執行。先建立 `backend/config/db.yaml` 與 `dictator.yaml`，再於 `backend` 目錄執行：

```bash
go run ./cmd/seeder -scenario registered
go run ./cmd/seeder -scenario qualification_finished
go run ./cmd/seeder -scenario elimination_finished
# 或一次建立全部
go run ./cmd/seeder -scenario all
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
- seeder 建立的登入帳號為 `seeder.archer.01` 至 `seeder.archer.32`，其中複合弓項目使用 `seeder.archer.25` 至 `seeder.archer.32`；密碼皆為 `archery-seed-password`；僅可在 `db.yaml` 的 `dev` 或 `test` mode 使用，其他 mode 一律拒絕執行。
- 三場賽事各有一位 approved `Judge`，共用以下裁判帳號；此帳號不會建立 Player：

| 帳號 | 密碼 | 可登入情境 |
| --- | --- | --- |
| `seeder.judge` | `archery-seed-password` | `registered`、`qualification_finished`、`elimination_finished` |

- 此 Judge 帳號及所有 seeder 帳號**僅限 development/test**；不可用於 production。
- `Competition.Script` 的 seeder marker 保持不變，seeder 不遷移既有三項 fixture。舊 seeded DB 因缺少 Judge 不符合新版 invariant；欲採用新版 fixture，須於全新且可丟棄的 dev/test DB 重建。

可在可丟棄的 test DB 驗證資料不變量與冪等性：

```bash
SEEDER_INTEGRATION_TEST=1 go test ./internal/seeder -run TestSeedScenarioInvariants
```

## Run E2E Test

你需要先下載前端的packages跟安裝Playwright的使用的瀏覽器。
```bash
cd frontend
npm install
npx playwright install  
```

啟動一個測試用的docker-compose:
```
docker compose up -f docker-compose.test.yml up --build
```

然後在`./frontend`執行下面的指令來跑主要的 E2E 測試。
```
npx playwright test tests/e2e/recordingBoard.spec.ts --project=chromium --headed --workers=1
```

## Deployment

1. Set db credentials and a session key in `backend/config`. (Make sure it is consistent with `docker-compose.yml`)
2. Run `docker-compose up --build`.
3. Test it on `TCP/80` port.

## API Reference

如果更新了 gin swag 的註解，在運行前需要在 terminal 中輸入 swag init (應該會出現 doc 檔案)。
http://localhost/swagger/index.html#/

## Tech Stack

**Client:** React, TS, Redux, Preact/Signal, Material-UI, Sass

**Reverse proxy** nginx

**Server:** Go, Gin, Gorm

**Database** MySQL

## Appendix

### Custom Theme

因為 TS，在自訂 MUI 主題的時候，需要對 MUI 本身的套件進行擴展，不然 TS 的編譯器會報錯。針對自訂主題的擴展在`frontend_xxx/src/style/theme.d.ts`。
詳情見：https://mui.com/material-ui/customization/theming/
目前只有 frontend_scoring 實作了此項目。

## Tips
- 整個系統中，目前只會有一個dictator帳號可以創建比賽，該按鈕會在"我的比賽"頁面底下。這個帳號的帳密是由dictator.yml這個檔案決定的。 

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
