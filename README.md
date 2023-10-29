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

請輸入

npm install

來安裝所需要的模組。

輸入下列指令可以啟動 vite，瀏覽計分版。
cd .\archery_game_scoring\
npm run dev -- --host

npm run build 會建立起整個前端的整合檔案./archery_game_scoring/dist。
