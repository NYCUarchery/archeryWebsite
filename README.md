# archeryWebsite

請輸入

npm install

來安裝所需要的模組。

輸入下列指令可以啟動 vite，瀏覽計分版。
cd .\archery_game_scoring\
npm run dev -- --host

npm run build 會建立起整個前端的整合檔案./archery_game_scoring/dist。

# 後端伺服器啟動
## 設置
在web_server_gin目錄中
terminal 輸入 go mod init web_server_gin（應該會出現go.mod）
然後輸入 go mod tidy（應該會出現go.sum）

在archeyWebsite目錄中
terminal 輸入 go work init web_server_gin（應該會出現go.work）

之後在archeryWebsite目錄中
建立dsn_config.txt檔
內容是 DBname, UserName, PassWord, HostName, PortNumber 
共五項，同一行，用空白連接，按照上述順序

程式部分
注意：DB.go裡面不能是本地測試模式
注意：main.go要是用0.0.0.0得ip去運行

## api 註解
如果更新了gin swag的註解
在運行前需要在terminal中輸入 swag init （應該會出現doc檔案）

## 運行
在web_server_gin目錄中
terminal輸入go run main.go
如果terminal沒有出現異常就是在正常運行了