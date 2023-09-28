# archeryWebsite

請輸入

npm install

來安裝所需要的模組。

輸入下列指令可以啟動 vite, 瀏覽計分版。
cd .\archery_game_scoring\
npm run dev -- --host

npm run build 會建立起整個前端的整合檔案./archery_game_scoring/dist。

# 後端伺服器啟動 web_server_gin
## 設置
1. 在web_server_gin目錄中
terminal 輸入 go mod init web_server_gin (應該會出現go.mod)
然後輸入 go mod tidy (應該會出現go.sum)

2. 在archeyWebsite目錄中
terminal 輸入 go work init web_server_gin (應該會出現go.work)

3. 之後在archeryWebsite目錄中
建立dsn_config.txt檔 (僅release mode必要)
建立text_dsn_config.txt檔 (僅debug mode必要)
內容是都是 DBname, UserName, PassWord, HostName, PortNumber 
共五項，同一行，用空白連接，按照上述順序

## api 註解
如果更新了gin swag的註解
在運行前需要在terminal中輸入 swag init (應該會出現doc檔案)

## 運行 
### release mode
在web_server_gin目錄中
terminal輸入 export GIN_MODE=release ; go run main.go
如果terminal是在新的一行開始, 就是正常運行了
註: 這是給實際用的時候, terminal畫面簡潔, 運行的資源比較少

### debug mode 
預設就是debug mode 
在web_server_gin目錄中
terminal輸入 export GIN_MODE=debug ; go run main.go
或是只輸入 go run main.go
如果terminal寫一堆東西, 內文沒顯示異狀, 就是正常運行了
註: 任何情況都可以用, 但terminal會一直顯示一堆東西, 用的資源也比較多