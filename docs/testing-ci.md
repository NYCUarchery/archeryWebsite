# CI 測試

Pull request 執行 runner safety、Go unit、隔離 MySQL integration／Seeder、前端型別、lint、build、Vitest coverage 基線、Chromium mock browser 與真 E2E。各失敗 job 均為非零結果；artifact 於成功與失敗時皆保留。coverage 僅產生基線報告，尚未設定百分比門檻。

各層輸出如下：runner safety 使用 Node TAP；Go unit 輸出 `test-artifacts/go-unit/go-test.jsonl` 與 `coverage.out`；Go integration／Seeder 輸出同類 JSON、coverage、服務 log；前端 unit coverage 輸出 `frontend/coverage/`；mock browser 與真 E2E 均輸出 Playwright JSON、HTML report、failure trace／截圖，真 E2E 另保存隔離服務 log。檔案報告由 workflow artifact 保留，不依賴測試成功才上傳；runner TAP 與 mock Next server 輸出留於 CI step log。

目前已載入測試的純函式檔案，Vitest statements 基線為 68.51%；不是全前端專案的覆蓋率，此數字只供同範圍比較，未設門檻。案例數、skip 與耗時以各次 JSON／HTML／TAP 報告為準。以上為本機驗證的入口與產物約定，尚不代表 workflow 已在遠端執行。

Firefox、WebKit 是手動入口：在 workflow dispatch 選擇 browser；本機 mock browser 可執行相應 `npm run test:browser:firefox`／`npm run test:browser:webkit`。真 E2E 的 npm scripts 本身會呼叫 runner，請執行 `npm run test:e2e:firefox`／`npm run test:e2e:webkit`（或根目錄 `scripts/test.sh e2e --project=...`）；不可直接呼叫 Playwright。
