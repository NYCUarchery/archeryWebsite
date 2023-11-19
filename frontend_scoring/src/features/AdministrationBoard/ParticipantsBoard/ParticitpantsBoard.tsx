import ApplicationsBlock from "./ApplicationsBlock/ApplicationsBlock";
import UserBlock from "./UserBlock/UserBlock";
import { useQuery } from "react-query";
import axios from "axios";
import { useDispatch } from "react-redux";
import { initialize } from "./ParticipantsSlice";

const getParticipants = async (competitionId: number) => {
  const { data } = await axios.get(
    `/api/competition/participants/${competitionId}`
  );
  return data;
};

export default function ParticipantsBoard() {
  const competitionId = 1;
  const dispatch = useDispatch();

  const { data: participants } = useQuery(
    ["participants", competitionId],
    () => getParticipants(competitionId),
    {
      select: (data: any) => {
        console.log(data);
        const participants = data?.participants;
        return participants;
      },
    }
  );

  console.log(participants);
  if (participants) dispatch(initialize(participants));

  return (
    <div className="participants_board">
      <ApplicationsBlock></ApplicationsBlock>
      <UserBlock></UserBlock>
    </div>
  );
}
