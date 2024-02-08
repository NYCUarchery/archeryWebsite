import { Competition } from "./Competition";

interface Props {
  competitions: any;
  uid: number;
}

export const CompetitionList = ({ competitions, uid }: Props) => {
  return competitions?.map((competition: any) => (
    <Competition competition={competition} uid={uid} key={competition.id} />
  ));
};
