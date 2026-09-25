# 首頁與比賽列表視覺提案 v3

獨立 HTML 設計預覽；未接入 Next.js、API 或正式路由。

## 開啟

以瀏覽器開啟 `index.html`，或於專案根目錄執行：

```sh
python3 -m http.server 4173 --bind 127.0.0.1 --directory mockups/home-v1
```

瀏覽 <http://127.0.0.1:4173/>。

- `index.html`：首頁。
- `recent_competitions.html`：比賽列表，每頁五筆，可切換兩頁示例。
- `my_competitions.html`：我的比賽，以一般使用者已登入狀態示意；可切換有比賽／無比賽。

三頁皆可直接以瀏覽器開啟，樣式與互動共用本目錄的 `styles.css`、`preview.js`、`logo.svg`。

## 設計方向

- 沿用主色 `#2056CC`、原有靶面標誌、白底卡片，增加留白與資訊層次。
- 保留導覽列的醒目登入按鈕；移除標語與大型示意圖。
- 首頁直接呈現近期比賽及公告；比賽僅展示既有 title、sub_title 欄位的示例文字，不展示地點或報名狀態。
- 頁尾在內容不足時貼齊視窗底部，長內容時自然接在末尾，不覆蓋內容。
- 登入、註冊與比賽詳情互動僅為示意，不送出資料。
- 本稿供首頁與共用導覽風格討論；不含 `/competition/*` 改版。

## 預覽圖片

- `desktop.png`：桌機首頁，1440px。
- `mobile.png`：手機首頁，390px。
- `desktop-login.png`、`mobile-login.png`：登入視窗。
- `small-mobile.png`：320px 窄螢幕。

- `competitions-desktop.png`、`competitions-mobile.png`：比賽列表。
- `my-competitions-desktop.png`、`my-competitions-mobile.png`：我的比賽。

我的比賽不替個別比賽捏造角色或狀態。正式建立比賽入口限 `Dictator`，本稿呈現一般使用者，因此不顯示。申請角色視窗只作本機示意，不建立帳號、登入狀態或送出申請。
