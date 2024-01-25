import { Player } from "../QueryHooks/types/Player";

export type PlayerStats = {
  totalXs: number;
  totalTens: number;
  totalScore: number;
  rounds: RoundStats[];
};
export type RoundStats = {
  totalXs: number;
  totalTens: number;
  totalScore: number;
  ends: EndStats[];
};
export type EndStats = {
  totalXs: number;
  totalTens: number;
  totalScore: number;
  scores: number[];
};

export function calculatePlayerStats(player: Player): PlayerStats | undefined {
  let playerStats: PlayerStats = {
    totalXs: 0,
    totalTens: 0,
    totalScore: 0,
    rounds: [],
  };
  if (!player.rounds) return undefined;

  for (let i = 0; i < player.rounds.length; i++) {
    const round = player.rounds[i];
    const roundStats: RoundStats = {
      totalXs: 0,
      totalTens: 0,
      totalScore: 0,
      ends: [],
    };
    if (!round.round_ends) return undefined;
    for (let j = 0; j < round.round_ends.length; j++) {
      const end = round.round_ends[j];
      const endStats: EndStats = {
        totalXs: 0,
        totalTens: 0,
        totalScore: 0,
        scores: [],
      };
      for (let k = 0; k < end.round_scores.length; k++) {
        const score = end.round_scores[k];
        if (score.score === 10) {
          endStats.totalTens++;
        }
        if (score.score === 11) {
          endStats.totalXs++;
        }
        endStats.scores.push(score.score);
        endStats.totalScore += score.score === 11 ? 10 : score.score;
      }
      roundStats.totalXs += endStats.totalXs;
      roundStats.totalTens += endStats.totalTens;
      roundStats.totalScore += endStats.totalScore;
      roundStats.ends.push(endStats);
    }
    playerStats.totalXs += roundStats.totalXs;
    playerStats.totalTens += roundStats.totalTens;
    playerStats.totalScore += roundStats.totalScore;
    playerStats.rounds.push(roundStats);
  }
}
