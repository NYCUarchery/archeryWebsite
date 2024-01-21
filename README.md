# Archery Website

## Deployment

1. Set db credentials and a session key in `backend/config`. (Make sure it is consistent with `docker-compose.yml`)
2. Run `docker-compose up --build`.
3. Test it on `TCP/80` port.

## Testing Environment

- Auto reload for frontend

```bash
docker compose -f docker-compose-dev.yml up --build
```

## API Docs

如果更新了 gin swag 的註解
在運行前需要在 terminal 中輸入 swag init (應該會出現 doc 檔案)
http://localhost:8080/swagger/index.html#/

## UI Library: MUI

### Custom Theme

因為 TS，在自訂 MUI 主題的時候，需要對 MUI 本身的套件進行擴展，不然 TS 的編譯器會報錯。針對自訂主題的擴展在`前端/src/style/theme.d.ts`。
詳情見：https://mui.com/material-ui/customization/theming/
目前只有 frontend_scoring 實作了此項目。
