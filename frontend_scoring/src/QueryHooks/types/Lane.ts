import { Player } from "./Player";

export interface Lane {
  id: number;
  competition_id: number;
  qualification_id: number;
  lane_number: number;
  players: Player[];
}
