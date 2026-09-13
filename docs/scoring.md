# 計分領域指南

此文描述本系統現況；非世界射箭規則之完整轉錄。欄位、權限與結果皆以伺服器為準。

## 範圍與名詞

- `Competition` 為一場賽事；其下有多個 `Group`（項目／組別）。
- 一個 `Group` 以同一 ID 對應其 `Qualification`；資格賽之選手為 `Player`。
- `Competition.current_phase`：`0` 資格賽、`1` 個人淘汰、`2` 團體淘汰、`3` 混雙淘汰；用於切換選手目前項目，不等於各項對抗賽的實際進度。
- 資格賽共用 `Competition.qualification_current_end`；對抗賽各 `Elimination` 獨立保存 `current_stage`、`current_end`。
- `Qualification` 的 `advancing_num` 為晉級名額；`Round` 屬於一位 `Player`，`RoundEnd` 屬於一局，`RoundScore` 為一箭。
- 淘汰賽 `Elimination` 屬於一個 `Group`，以 `team_size` 區分：`1` 個人、`2` 混雙、`3` 團體。
- `PlayerSet` 是淘汰賽一方隊伍（個人賽亦為一人隊伍）；`rank` 用於首輪種子。
- `Stage` 是淘汰一輪，`Match` 是兩方對戰，兩個 `MatchResult` 各代表一方；其下 `MatchEnd`、`MatchScore` 分別為一波與一箭。
- 欄位與關聯見 [資格賽模型](../backend/internal/database/player.go)、[淘汰模型](../backend/internal/database/elimination.go)、[對戰模型](../backend/internal/database/matchResult.go)。

## 箭值與加總

- 可寫箭值僅 `-1`、`0..11`：`-1` 未記分，`0` 為 M，`1..10` 為環值，`11` 為 X。
- 加總時 `-1` 與 M 均作 `0`，X 作 `10`；故不得以 X=11 計入總分。[`Scorefmt`](../backend/internal/endpoint/tools.go)
- 資格賽以所有 `RoundScore` 重算 `Round.total_score` 與 `Player.total_score`；`RoundEnd` 不存總分。
- 淘汰賽每個 `MatchEnd.total_scores` 由該 end 的 `MatchScore` 重算；請求內同名總分非權威值。
- `points`、`cumulative_points`、`MatchResult.total_points` 是讀取時計算的比較資料，不是可寫欄位。[`ComputeMatchPoints`](../backend/internal/database/elimination.go)
- 資格賽整波寫入必須剛好覆蓋該 end 現有箭數；淘汰賽已確認波之更正，必須每支 `MatchScore` 恰一次。

## 資格賽寫分與確認

- 寫入一個 `RoundEnd` 時，後端在同一交易重算所屬 `Round` 與 `Player` 總分；前端不可自行維護累計值。
- 已核准且屬該賽事的 Admin、Judge 可寫分；Player 僅可寫自己靶道、目前 `qualification_current_end` 的波。
- Player 不得改已確認波；Judge 與 Admin 可修正已確認波。取消已確認狀態僅 Admin 可為。
- 確認本身亦受上述角色／目前波限制；API 為 `PATCH /player/isconfirmed/{roundendid}`。
- 實作：[資格賽全波寫入](../backend/internal/endpoint/Player.go)；權限從目標資料列反查賽事，而非 session 中可能過期的角色。[計分授權](../backend/internal/endpoint/ScoreAuthorization.go)

## 淘汰賽波數、寫分與確認

- `team_size=1`：5 波、每方每波 3 箭；`2`：4 波、4 箭；`3`：4 波、6 箭。其他值無效。
- Match 兩方皆須已有 `PlayerSet` 才可寫分；空種子槽不可先記分。
- Admin 可救援寫入任一該賽事對戰；Judge、Player 均限目前 `Stage` 且相應淘汰賽已啟用；Player 另限自己參與對戰的未確認波，非任意他場。
- Judge、Admin 可更正已確認 `MatchEnd`，且確認狀態維持；Player 不可。取消確認仍僅該賽事 Admin 可為。
- 寫分與確認均鎖定淘汰賽及賽程，防止與種子／晉級改動交錯。實作：[MatchEnd 寫入](../backend/internal/endpoint/MatchResult.go)、[授權](../backend/internal/endpoint/ScoreAuthorization.go)。

## 積點與自動結果

- 複合弓以完整法定波之箭總分比較；未完成、箭數不符或不支援弓種不推導勝方。
- 反曲弓每完成一波比較，勝方 2 點、平手各 1 點；個人先達 6 點，混雙／團體先達 5 點。
- 正規波後同分為 `shoot_off`：個人 5:5，混雙／團體 4:4。`shoot_off_score` 可記加射值，但不自行選定勝方。
- `outcome_status` 僅讀取時計算，非資料表欄位：`incomplete`、`winner`、`shoot_off`、`locked_conflict`、`unsupported_bow_type`。
- 只有成功儲存箭分時，完整且未被下游晉級／獎牌鎖定之正規結果才會自動更新 `is_winner`；一般讀取不改手動結果。
- 改分後若不完整或弓種不支援，保留既有勝方；完整同分且未鎖定時，清除勝方，交由 Admin 裁決加射。
- 完整比分若已與下游狀態衝突，只呈 `locked_conflict`，不回寫歷史結果。規則見 [結果計算](../backend/internal/database/match_outcome.go)、[交易套用](../backend/internal/endpoint/EliminationOutcome.go)。

## 明確勝方、晉級與首輪種子

- 加射或裁決所需之勝方，須由 Admin 明確設定 `winner_match_result_id`；鍵必填，明示 `null` 才是清除勝方。
- 該勝方必須是本 Match 已佔用的一方；來源對戰之下游槽已佔用後，不可再改，終局亦受已頒獎牌保護。
- `POST /elimination/stage/advance/{stageid}` 才會傳播既有勝方／BYE、安排季軍路徑或結算獎牌；自動判定不會自行晉級。
- 建立 bracket 時首輪槽故意為空。`POST /elimination/bracket/{id}/sync-first-round` 是唯一依已儲存 `PlayerSet.rank` 投影首輪之明確 Admin 動作。
- 建立 bracket 的種子數限 4..128；同步前要求每隊一個非零、唯一、在種子範圍內的 rank，允許 rank 缺號而留下空槽。
- 同步會在交易中驗證完整圖形；受影響首輪、下游槽已開始／佔用或已頒獎時，整筆拒絕，絕不部分覆寫。
- 實作：[首輪同步與晉級](../backend/internal/endpoint/EliminationBracket.go)、[明確勝方](../backend/internal/endpoint/MatchResult.go)。

## 佐證與界限

- 後端整合測試覆蓋裁判／管理員更正與跨角色限制：[judge permissions](../backend/internal/endpoint/judge_permissions_integration_test.go)、[bracket 與鎖定](../backend/internal/endpoint/elimination_bracket_integration_test.go)、[自動結果](../backend/internal/endpoint/elimination_outcome_test.go)。
- 前端流程測試覆蓋資格賽摘要、淘汰寫分與行動裁判介面：[qualification summary](../frontend/tests/browser/qualificationScoreSummary.spec.ts)、[elimination scoring](../frontend/tests/browser/eliminationScoring.spec.ts)、[judge mobile](../frontend/tests/browser/judgeMobile.spec.ts)。
- 本文不定義賽事外部規則、畫面草稿、JSON／React 通用慣例，亦不取代 OpenAPI 契約。
