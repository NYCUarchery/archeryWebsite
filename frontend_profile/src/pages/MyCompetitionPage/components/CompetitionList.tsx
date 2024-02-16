import { Competition } from "../../../util/QueryHooks/types/Competition";
import { Competition } from "./Competition";

interface Props {
  competitions: Competition[];
  uid: number;
}

export const CompetitionList = ({ competitions, uid }: Props) => {
  return competitions?.map((competition: any) => (
    <Competition competition={competition} uid={uid} key={competition.id} />
  ));
};
