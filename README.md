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

## API Docs

如果更新了 gin swag 的註解
在運行前需要在 terminal 中輸入 swag init (應該會出現 doc 檔案)
http://localhost:8080/swagger/index.html#/