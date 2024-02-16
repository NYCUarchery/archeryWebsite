import { CompetitionItem } from "./CompetitionItem";
import { Competition } from "../../../util/QueryHooks/types/Competition";
interface Props {
  competitions: Competition[];
  uid: number;
}

export const CompetitionList = ({ competitions, uid }: Props) => {
  return (
    <>
      {competitions?.map((competition: any) => (
        <CompetitionItem
          competition={competition}
          uid={uid}
          key={competition.id}
        />
      ))}
    </>
  );
};
