# 前端測試分層

依驗證邊界拆分，不因真 E2E 涵蓋同一畫面便刪除互動測試。

| 案例檔案 | 驗證行為與依賴 | 決策 |
| --- | --- | --- |
| `eliminationPlacement.logic.spec.ts` | 純函式：排名、獎牌、空位；無瀏覽器／API | 搬至 `tests/unit`，由 Vitest 執行 |
| `lifecycleOracle.spec.ts` | 固定每箭、資格總分、晉級邊界及團體加總 oracle 的一致性；無 API | 保留於 `tests/unit`，不呼叫產品計分函式 |
| `eliminationBracket.spec.ts` | 籤表呈現、BYE、手動操作與 request；API mock | 保留，搬至 `tests/browser` |
| `eliminationPlayerSetRanking.spec.ts` | 建隊與隊伍排名互動、排名請求；API mock | 保留，搬至 browser |
| `eliminationProgressPlacement.spec.ts` | 階段推進、獎牌設定、錯誤回饋及非均分箭序的保存／重載；API mock | 保留，搬至 browser；補正式 GET 降序契約的短回歸 |
| `eliminationSchedule.spec.ts` | 賽程設定與籤表同步互動；API mock | 保留，搬至 browser |
| `eliminationScoring.spec.ts` | 個人／團體／混雙記分互動、箭數與請求；API mock | 保留，搬至 browser |
| `judgeMobile.spec.ts` | 裁判窄螢幕操作、草稿、更正、防誤切換；API mock | 保留，搬至 browser |
| `qualificationRankingDialog.spec.ts` | 排名 dialog 與加射輸入；API mock | 保留，搬至 browser |
| `qualificationScoreSummary.spec.ts` | 資格賽分數顯示與響應式介面；API mock | 保留，搬至 browser |
| `home.spec.ts` | 註冊、登入與申請；真服務與資料庫 | 保留於 `tests/e2e`；每例由外部 runner reset legacy fixture，正式 GET 解析 fixture 賽事 |
| `recordingBoard.spec.ts` | 記分、確認與跨帳號同步；真服務與資料庫 | 保留於 E2E；以固定分數序列取代隨機 Fuzzing，保留跨帳號讀回與排名更新 |
| `competitionLifecycle.spec.ts` | 24 人、兩組別、個人／團體完整流程；真服務與資料庫 | 單一案例逐 checkpoint 擴充；實跑範圍與驗收狀態見 `testing-lifecycle.md` |
| `competition.spec.ts` | 空白檔案，無案例 | 移除；無覆蓋損失 |

`eliminationFixtures.ts` 僅提供 mock 資料，隨 browser 案例搬移。既有有效案例均保留，尚未用長流程取代其短測試。

從 `frontend` 執行：

```bash
npm run test:unit
npm run test:browser
npm run test:e2e
npm run typecheck
```

Browser 與 E2E 各有 Playwright config、報告及產物目錄。預設 npm scripts 只跑 Chromium；Firefox、WebKit 有同名後綴入口。Browser 可以平行執行；自動 fixture 拒絕並回報所有未明確 mock 的 `/api/` 請求。真 E2E 的 npm script 會呼叫外部 runner 建立 manifest、專屬 MySQL 與服務；固定一 worker、零 retries，不以 mock 代替業務操作。

Vitest 不啟動 Next 或瀏覽器；browser config 啟動 Next。真 E2E 的服務、資料庫及 reset 由隔離 runner 管理，不應連向開發資料庫；直接呼叫 Playwright 而沒有 runner manifest 會明確失敗。
