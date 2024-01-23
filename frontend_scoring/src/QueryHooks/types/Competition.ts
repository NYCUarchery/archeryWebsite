import { Player } from "./Player";

export interface Competition {
  id: number;
  title: string;
  sub_title: string;
  start_time: string;
  end_time: string;
  host_id: number;
  rounds_num: number;
  unassigned_group_id: number;
  groups_num: number;
  unassigned_lane_id: number;
  lanes_num: number;
  current_phase: number;
  qualification_current_end: number;
  qualification_is_active: boolean;
  elimination_is_active: boolean;
  team_elimination_is_active: boolean;
  mixed_elimination_is_active: boolean;
  script: string;
  groups?: Group[];
  participants?: null;
}

export interface Group {
  id: number;
  competition_id: number;
  group_name: string;
  group_range: string;
  bow_type: string;
  group_index: number;
  players: Player[];
}
