export interface Lane {
  id: number;
  competition_id: number;
  qualification_id: number;
  lane_number: number;
  players: Player[];
}

export interface Player {
  id: number;
  group_id: number;
  lane_id: number;
  participant_id: number;
  name: string;
  total_score: number;
  shoot_off_score: number;
  rank: number;
  order: number;
  rounds: Round[];
  player_sets: null;
}

export interface Round {
  id: number;
  player_id: number;
  total_score: number;
  round_ends: RoundEnd[];
}

export interface RoundEnd {
  id: number;
  round_id: number;
  is_confirmed: boolean;
  round_scores: RoundScore[];
}

export interface RoundScore {
  id: number;
  round_end_id: number;
  score: number;
}
