import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

// 本地分數格：id 與 score 綁定，排序時物件整體移動（不得只排 score，否則 id↔score 對應會錯亂）。
// 未填格 score = -1（與後端 GET 之未填格慣例一致）。
export interface LocalMatchScore {
  id: number;
  score: number;
}

// 本地一方（一 MatchResult 的目前局視圖 + 概要資訊）。
export interface LocalMatchResult {
  matchResultId: number;
  playerSetId: number;
  setName: string;
  memberNames: string[]; // 團體/混雙全員；個人為單一姓名
  isWinner: boolean;
  totalPoints: number;
  currentMatchEndId: number; // 目前 MatchEnd id
  isConfirmed: boolean; // 目前 MatchEnd 的 is_confirmed
  capacity: number; // = match_scores.length（該局實際容量，硬上限以此為準）
  scores: LocalMatchScore[]; // 依 score DESC 排、-1 殿後
  totalScores: number; // 目前局總分（Scorefmt 折算後加總）
  dirty: boolean; // 本地是否有尚未成功存分的編輯（true 表示與伺服器不同步，不得確認）
}

interface EliminationScoringState {
  selectedMatchResultIdentifier: number; // 選中的 matchResultId（比對 id，非索引）；未定為 -1
  matchResults: LocalMatchResult[]; // 目前 Match 之雙方（通常 2）
  currentEndIndex: number; // = elimination.current_end
  teamSize: number; // 1/2/3
  isSaving: boolean;
  saveError: string | null;
}

const initialState: EliminationScoringState = {
  selectedMatchResultIdentifier: -1,
  matchResults: [],
  currentEndIndex: 0,
  teamSize: 1,
  isSaving: false,
  saveError: null,
};

// 依隊伍規模換算每局「預期」箭數：1 個人→3、2 混雙→4、3 團體→6。
// 僅供校驗用（capacity 與預期不符時 console.warn），實際硬上限一律以 capacity 為準。
export function expectedArrows(teamSize: number): number {
  switch (teamSize) {
    case 1:
      return 3;
    case 2:
      return 4;
    case 3:
      return 6;
    default:
      return 0;
  }
}

// 前端等義 Scorefmt（對應 backend/internal/endpoint/tools.go:54）：
// 負值（未填之 -1）折為 0；大於 10（X=11）折為 10；其餘原值不變。
export function scorefmt(score: number): number {
  if (score < 0) return 0;
  if (score > 10) return 10;
  return score;
}

// 將 LocalMatchScore[] 依分數 DESC 排序（-1 視為最小、殿後）。
// 排序作用於物件整體，確保 id 與 score 恆一一綁定移動。
function sortScoresDesc(scores: LocalMatchScore[]): LocalMatchScore[] {
  return [...scores].sort((a, b) => b.score - a.score);
}

// 依排序後的 scores 重算目前局總分（Scorefmt 折算後加總）。
function sumTotalScores(scores: LocalMatchScore[]): number {
  return scores.reduce((sum, s) => sum + scorefmt(s.score), 0);
}

// 取目前選中的 LocalMatchResult；找不到回傳 undefined（呼叫端須自行擋下，不得假設存在）。
function findSelected(
  state: EliminationScoringState
): LocalMatchResult | undefined {
  return state.matchResults.find(
    (mr) => mr.matchResultId === state.selectedMatchResultIdentifier
  );
}

export const eliminationScoringSlice = createSlice({
  name: "EliminationScoring",
  initialState,
  reducers: {
    // 整批設入目前 Match 雙方資料（page 由 useCurrentEliminationMatch 之 ready 結果轉換而來）。
    initializeMatchResults: (
      state,
      action: PayloadAction<{
        matchResults: LocalMatchResult[];
        currentEndIndex: number;
        teamSize: number;
        selectedMatchResultIdentifier: number;
      }>
    ) => {
      state.matchResults = action.payload.matchResults;
      state.currentEndIndex = action.payload.currentEndIndex;
      state.teamSize = action.payload.teamSize;
      state.selectedMatchResultIdentifier =
        action.payload.selectedMatchResultIdentifier;

      // 校驗 capacity 是否符合隊伍規模預期箭數；不符合僅警告，硬上限仍以 capacity 為準。
      const expected = expectedArrows(action.payload.teamSize);
      action.payload.matchResults.forEach((mr) => {
        if (mr.capacity !== expected) {
          console.warn(
            `對抗賽局容量(${mr.capacity})與隊伍規模(${action.payload.teamSize})預期箭數(${expected})不符，仍以容量為硬上限`
          );
        }
      });
    },

    // 切換選中的一方；找不到對應 matchResultId 則不變。
    selectMatchResult: (state, action: PayloadAction<number>) => {
      const exists = state.matchResults.some(
        (mr) => mr.matchResultId === action.payload
      );
      if (!exists) return;
      state.selectedMatchResultIdentifier = action.payload;
    },

    // 新增一箭分數：已確認或已填滿容量時拒絕；否則填入第一個空格，重排、重算總分。
    addScore: (state, action: PayloadAction<number>) => {
      const selected = findSelected(state);
      if (!selected) return; // 找不到選中對局，不變

      const filledCount = selected.scores.filter(
        (s) => s.score !== -1
      ).length;
      if (selected.isConfirmed || filledCount >= selected.capacity) return; // 已確認或已滿，拒絕

      const emptySlot = selected.scores.find((s) => s.score === -1);
      if (!emptySlot) return; // 防禦：理論上應已被 filledCount 檔下，無空格可填

      emptySlot.score = action.payload;
      selected.scores = sortScoresDesc(selected.scores);
      selected.totalScores = sumTotalScores(selected.scores);
      selected.dirty = true; // 本地已變動但尚未成功存分，確認前須先擋下
    },

    // 刪除一箭分數：已確認或無已填格時不變；否則將排序後最後一個已填格（即最小者）改回 -1，重排、重算總分。
    deleteScore: (state) => {
      const selected = findSelected(state);
      if (!selected) return; // 找不到選中對局，不變

      const filledCount = selected.scores.filter(
        (s) => s.score !== -1
      ).length;
      if (selected.isConfirmed || filledCount === 0) return; // 已確認或無可刪，拒絕

      const sorted = sortScoresDesc(selected.scores);
      let lastFilledIndex = -1;
      for (let i = sorted.length - 1; i >= 0; i--) {
        if (sorted[i].score !== -1) {
          lastFilledIndex = i;
          break;
        }
      }
      if (lastFilledIndex === -1) return; // 防禦：理論上不會發生（filledCount>0 已檔）

      sorted[lastFilledIndex].score = -1;
      selected.scores = sortScoresDesc(sorted);
      selected.totalScores = sumTotalScores(selected.scores);
      selected.dirty = true; // 本地已變動但尚未成功存分，確認前須先擋下
    },

    // 標記某一方目前 MatchEnd 已確認；預設為選中方。找不到對應 matchResultId 則不變。
    // 僅動 isConfirmed，不動分數、totalPoints、isWinner。
    markConfirmed: (state, action: PayloadAction<number | undefined>) => {
      const targetId =
        action.payload !== undefined
          ? action.payload
          : state.selectedMatchResultIdentifier;
      const target = state.matchResults.find(
        (mr) => mr.matchResultId === targetId
      );
      if (!target) return; // 找不到則不變
      target.isConfirmed = true;
    },

    // 存分成功後，以伺服器回應或本地已排序值回填該側；不動 is_confirmed。找不到對應 matchResultId 則不變。
    replaceSavedMatchEnd: (
      state,
      action: PayloadAction<{
        matchResultId: number;
        scores: LocalMatchScore[];
        totalScores: number;
      }>
    ) => {
      const target = state.matchResults.find(
        (mr) => mr.matchResultId === action.payload.matchResultId
      );
      if (!target) return; // 找不到則不變
      target.scores = action.payload.scores;
      target.totalScores = action.payload.totalScores;
      target.dirty = false; // 存分成功，本地已與伺服器同步
    },

    setSaving: (state, action: PayloadAction<boolean>) => {
      state.isSaving = action.payload;
    },

    setSaveError: (state, action: PayloadAction<string | null>) => {
      state.saveError = action.payload;
    },
  },
});

export const {
  initializeMatchResults,
  selectMatchResult,
  addScore,
  deleteScore,
  markConfirmed,
  replaceSavedMatchEnd,
  setSaving,
  setSaveError,
} = eliminationScoringSlice.actions;

export default eliminationScoringSlice.reducer;
