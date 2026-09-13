# 完整比賽 E2E

`frontend/tests/e2e/competitionLifecycle.spec.ts` 使用單一 test 與具名 `test.step`，由帳號 fixture 經 UI 建立同一場比賽。Checkpoint 7 已通過：兩組資格賽、個人八強及團體四強至頒牌、第 8／9 名邊界、未晉級者參團、同隊成員讀回與組別／賽制隔離。裁判更正與重啟驗收尚待 checkpoint 8，不因 helper 存在而視為完成。

2026-09-13 隔離實跑 `r1789270044129_fa0de4a6`：Chromium 1 passed、0 skipped、0 retries；個人流程耗時 10.6 分鐘。PR 的 E2E job 自動收錄此案例。

Checkpoint 7 隔離實跑 `r1789275197626_ee0726fd`：Chromium 1 passed、0 skipped、0 retries；兩組個人與團體四項頒牌流程耗時 13.0 分鐘。同次檢查前端單元 2／2、Chromium browser 71／71、Go 預設單元及型別檢查皆通過。

```bash
scripts/test.sh e2e competitionLifecycle.spec.ts
```

Runner 建立本次專屬 tmpfs MySQL、服務及 Chromium，使用一個 worker、零 retries。`accounts` 僅建立組織與帳號，不建立比賽、participant、分數或賽果。所有業務寫入必須由 UI 觸發；正式 GET 僅用來解析新 ID 及核對持久化結果。中途不 reset。

## 固定資料與驗證邊界

| 項目 | 規格 |
| --- | --- |
| 角色 | 主辦人桌機；真正 approved Judge，390px；選手、訪客各自獨立 context |
| 選手 | 反曲、複合各 12 人，24 位皆自行申請並由主辦人核准 |
| 資格賽 | 一局、六波、每波六箭；A 使用 1–6 靶，B 使用 7–12 靶，每靶 A/B 兩人 |
| 個人賽 | 各取前八名，八強、準決賽、金牌戰及銅牌戰；第 9–12 名不進個人隊伍 |
| 團體賽 | 各四隊，以資格名次 `[1,5,9]`、`[2,6,10]`、`[3,7,11]`、`[4,8,12]` 組成 |
| 完成定義 | 兩組個人與團體共四項獎牌結算；不新增整場 finished 狀態 |

資格賽每箭與總分列於 `lifecycle/data.ts`，不呼叫產品計分函式生成預期值。A 依序為 360–349 分，B 為 348–337 分；各組第八、九名分別為 353/352 與 341/340。純資料一致性另由 Vitest 檢查。

個人八席種子排列預期為 `[1,8,5,4,3,6,7,2]`；八強勝方依序為左、右、左、右，準決賽為左、右，金牌戰左勝、銅牌戰右勝，故獎牌預期為資格名次 1、2、3。反曲以三波連勝達六局點；複合個人填滿五波，團體填滿四波。

團體資格總分預期：A 為 1068、1065、1062、1059；B 為 1032、1029、1026、1023。四隊種子排列為 `[1,4,3,2]`，準決賽及金／銅牌戰皆依序左、右勝，獎牌為隊伍排名 1、2、3。每方每波六箭，勝方全 10、敗方全 9。第九名與第一名同隊，應在各自選手記分頁看見同一隊伍及對手。

## 報告與短測試分工

報告位於 `test-artifacts/e2e/<run ID>/`，包含 JSON、HTML、失敗 trace、截圖及服務 log。失敗先按角色、組別、階段、對戰及波次定位，再區分測試操作錯誤、環境失敗與產品缺陷；不可改用 API 補分或 retry 掩蓋問題。

Lifecycle 的失敗 trace 保留 DOM snapshot、網路、動作及 source，僅關閉連續 screenshot filmstrip；失敗頁面截圖仍保留。大量填箭動作曾使 filmstrip trace 在報告收尾超時，故減少重複影像，不放寬業務 assertion 或增加 retry。

長流程不取代短測試：網路失敗、RWD 細節、草稿保護留在 mock browser；BYE、加射、併發及權限拒絕留在單元／MySQL 整合。完整驗收另須兩次全新環境通過、backend 重啟持久化，以及暫時破壞選組 handler 後確認流程確實失敗。
