# NYCU Archery Website

一個用於射箭比賽紀錄分數的系統。

## Deployment

1. Set db credentials and a session key in `backend/config`. (Make sure it is consistent with `docker-compose.yml`)
2. Run `docker-compose up --build`.
3. Test it on `TCP/80` port.

## Test Environment

- To reload frontend, you need to restart the frontend container.

Run:

```bash
docker compose -f docker-compose-dev.yml up --build
```

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
