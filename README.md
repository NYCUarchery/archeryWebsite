# Archery Website

## Deployment

1. Set db credentials and a session key in `backend/config`. (Make sure it is consistent with `docker-compose.yml`)
2. Run `docker-compose up --build`.
3. Test it on `TCP/6969` port.


## Testing Environment

- Auto reload for frontend

```bash
docker compose -f docker-compose-dev.yml up --build
```

# archeryWebsite
# Front-end testing and building

請輸入

npm install

來安裝所需要的模組。

在.\archery_game_scoring\下輸入下列指令可以啟動 vite 渲染前端。
npm run dev -- --host

npm run build 會建立起整個前端的整合檔案./archery_game_scoring/dist。
在本地運行後端，程式會直接讀取./archery_game_scoring/dist。
已經接入的 API 需要有伺服器的回應，不然前端可能無法正常運行。

# 後端伺服器啟動 web_server_gin

## 設置

1. 在 web_server_gin 目錄中
   terminal 輸入 go mod init web_server_gin (應該會出現 go.mod)
   然後輸入 go mod tidy (應該會出現 go.sum)

2. 在 archeyWebsite 目錄中
   terminal 輸入 go work init web_server_gin (應該會出現 go.work)

3. 之後在 archeryWebsite 目錄中
   建立 dsn_config.txt 檔 (僅 release mode 必要)
   建立 text_dsn_config.txt 檔 (僅 debug mode 必要)
   內容是都是 DBname, UserName, PassWord, HostName, PortNumber
   共五項，同一行，用空白連接，按照上述順序

## api 註解

如果更新了 gin swag 的註解
在運行前需要在 terminal 中輸入 swag init (應該會出現 doc 檔案)
http://localhost:8080/swagger/index.html#/

## 運行

### 小提醒

1. 可能要先裝 swag
2. 要先前端靜態檔案建起來

### debug mode

預設就是 debug mode
在 web_server_gin 目錄中
terminal 輸入 export GIN_MODE=debug ; go run main.go
或是只輸入 go run main.go
如果 terminal 寫一堆東西, 內文沒顯示異狀, 就是正常運行了
註: 任何情況都可以用, 但 terminal 會一直顯示一堆東西, 用的資源也比較多

### test mode

在 web_server_gin 目錄中
terminal 輸入 export GIN_MODE=test ; go run main.go
如果 terminal 是在新的一行開始, 就是正常運行了
註: 當作是不顯示太多東西的 debug mode, 用於 release mode 前的 mode

### release mode

在 web_server_gin 目錄中
terminal 輸入 export GIN_MODE=release ; go run main.go
如果 terminal 是在新的一行開始, 就是正常運行了
註: 這是給實際用的時候, terminal 畫面簡潔, 運行的資源比較少
