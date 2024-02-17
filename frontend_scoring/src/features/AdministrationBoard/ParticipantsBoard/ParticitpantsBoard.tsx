import ApplicationsBlock from "./ApplicationsBlock/ApplicationsBlock";
import UserBlock from "./UserBlock/UserBlock";
import useGetParcipants from "../../../QueryHooks/useGetParticipants";

export default function ParticipantsBoard() {
  const competitionId = 1;
  const { isLoading, isError } = useGetParcipants(competitionId);
  if (isLoading) return <h1>loading...</h1>;
  if (isError) return <h1>Can't not fetch the data...</h1>;

  return (
    <div className="participants_board">
      <ApplicationsBlock></ApplicationsBlock>
      <UserBlock></UserBlock>
    </div>
  );
}
