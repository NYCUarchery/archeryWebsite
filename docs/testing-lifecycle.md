# 完整比賽 E2E

## UI／API 雙模式改造檢查點

本次加速改造分三個提交驗收：先加入角色與資源範圍檢查的策略／API helper，再接入固定 UI 抽樣，最後切換預設及 CI。第一個檢查點不改動現有 lifecycle 的業務寫入；仍全部走 UI。API helper 不得成為 UI 失敗後的備援路徑，亦不得直接寫入資料庫、總分、勝者或獎牌。

預定 hybrid 抽樣固定為 Archer 01、13 及 Judge 經 UI 申請／核准；資格賽 Archer 02、14 每波由 Judge UI 填分，另保留 Archer 01、13 自行填首波。四項對抗賽首場全部波次走 UI；後續各階段 Match 1 第一波雙方走 UI。更正、草稿、組別切換、管理端推進及頒牌始終走 UI。

CP1 全 UI 基線：`r1789281695278_29a279ec`，Chromium 1 passed、0 skipped、0 retries；test 耗時 805,841 ms（13.4 分鐘），報告耗時 812,663 ms。此時策略 helper 尚未接入流程，故此證據只證明既有全 UI 路徑，並非 hybrid 驗收。相同工作環境 Chromium mock browser 72／72 通過；lint 僅既有 warnings。

`frontend/tests/e2e/competitionLifecycle.spec.ts` 使用單一 test 與具名 `test.step`，由帳號 fixture 經 UI 建立同一場比賽。Checkpoint 8 已通過：兩組資格賽、個人八強及團體四強至頒牌、第 8／9 名邊界、未晉級者參團、同隊成員讀回、組別／賽制隔離、裁判更正／草稿及重啟持久化；完整流程已連續於兩個全新環境通過。

2026-09-13 隔離實跑 `r1789270044129_fa0de4a6`：Chromium 1 passed、0 skipped、0 retries；個人流程耗時 10.6 分鐘。PR 的 E2E job 自動收錄此案例。

Checkpoint 7 隔離實跑 `r1789275197626_ee0726fd`：Chromium 1 passed、0 skipped、0 retries；兩組個人與團體四項頒牌流程耗時 13.0 分鐘。同次檢查前端單元 2／2、Chromium browser 71／71、Go 預設單元及型別檢查皆通過。

Checkpoint 8 連續兩次全新環境驗收：

| Run | Lifecycle 耗時 | 結果 |
| --- | --- | --- |
| `r1789277105184_99f8ef5a` | 796,851 ms（13.3 分鐘） | 完整流程 1 passed、0 skipped、0 retries |
| `r1789278135103_ce7d6674` | 801,317 ms（13.4 分鐘） | 完整流程及既有真 E2E 共 11 passed、0 skipped、0 retries |

第二次由根目錄 `bash scripts/test.sh all` 執行並以 exit 0 完成：Go 預設單元、MySQL／Seeder 229／229、前端單元 2／2、Chromium browser 72／72、真 E2E 11／11。MySQL 整合報告為 `r1789278008859_0515dfdd`；E2E 全套耗時 892,141 ms（14.9 分鐘），兩種資料庫皆由 runner 清理。另驗 runner safety 19／19、型別、lint、前端 build 及 coverage 基線；lint/build 僅既有 warnings。Firefox、WebKit 與遠端 PR workflow 未在本機驗收中執行。

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

該固定資料字串的 `X` 僅是 10 分箭的壓縮記號，helper 實際點選 `10`；不是產品的內十環 `X`（值 11）。此流程不以內十環次數破同分。

個人八席種子排列預期為 `[1,8,5,4,3,6,7,2]`；八強勝方依序為左、右、左、右，準決賽為左、右，金牌戰左勝、銅牌戰右勝，故獎牌預期為資格名次 1、2、3。反曲以三波連勝達六局點；複合個人填滿五波，團體填滿四波。

團體資格總分預期：A 為 1068、1065、1062、1059；B 為 1032、1029、1026、1023。四隊種子排列為 `[1,4,3,2]`，準決賽及金／銅牌戰皆依序左、右勝，獎牌為隊伍排名 1、2、3。每方每波六箭，勝方全 10、敗方全 9。第九名與第一名同隊，應在各自選手記分頁看見同一隊伍及對手。

Checkpoint 8 更正固定於排名／晉級之前：反曲第一名資格首波 59 → 60；反曲個人首場第三波 29 → 30；反曲團體首場第三波 59 → 60。改分後仍確認、局點維持 2／累計 6，排名及勝方不變。對抗暫定箭序分別為 `[10,10,9]` 與 `[10,10,10,10,10,9]`，符合正式 GET 的降序契約。選手頁僅顯目前波，故刻意更正目前第三波，再由選手 UI 讀回；不以其他未更正波次代替。

裁判資格草稿驗「編輯 → 返回 → 重開 → 儲存」；個人對抗草稿另驗切組被拒且原組別／項目／對戰保留。末尾 backend 只重啟、不 reset，關閉舊 context 後重新登入，逐一比對資格名次／分數及四項完整籤表／獎牌快照，並由訪客重開公開榜。

## 報告與短測試分工

報告位於 `test-artifacts/e2e/<run ID>/`，包含 JSON、HTML、失敗 trace、截圖及服務 log。失敗先按角色、組別、階段、對戰及波次定位，再區分測試操作錯誤、環境失敗與產品缺陷；不可改用 API 補分或 retry 掩蓋問題。

Lifecycle 的失敗 trace 保留 DOM snapshot、網路、動作及 source，僅關閉連續 screenshot filmstrip；失敗頁面截圖仍保留。大量填箭動作曾使 filmstrip trace 在報告收尾超時，故減少重複影像，不放寬業務 assertion 或增加 retry。

長流程不取代短測試：網路失敗、RWD 細節、草稿保護留在 mock browser；BYE、加射、併發及權限拒絕留在單元／MySQL 整合。兩次全新環境通過、backend 重啟持久化與選組故障注入皆為完整驗收條件；本次證據列於本文。

## 選組故障注入

2026-09-13 於可丟棄 source 副本暫將 schedule `GroupMenu.handleMenuItemClick` 的 dispatch 改為只接受已選 index，模擬選單可點但不更新組別。隔離 run `r1789276222056_b07077ea` 在 54.9 秒因 `selectGroup` 找不到選中的 `E2E 複合弓` 而失敗，位置為 `saveQualificationSettings` 的 A → B 切換；不是 API、建置或環境失敗。JSON、HTML、trace、截圖及服務 log 已保留於同名 `test-artifacts/e2e/` 目錄。

故障只存在於 `/tmp` 副本，已移除；完整 `frontend/src` 與 `frontend/tests` 隨後比對一致。原專案 handler 未修改。恢復後的完整正向驗收另記錄，不把此預期失敗算入通過案例。
