import { Lane } from "./Lane";

// Generated by https://quicktype.io

export interface Qualification {
  id: number;
  advancing_num: number;
  start_lane: number;
  end_lane: number;
  lanes: Lane[];
}
