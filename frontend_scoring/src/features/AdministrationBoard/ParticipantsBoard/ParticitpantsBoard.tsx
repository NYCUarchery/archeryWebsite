import ApplicationsBlock from "./ApplicationsBlock/ApplicationsBlock";
import UserBlock from "./UserBlock/UserBlock";

export default function ParticipantsBoard() {
  return (
    <div className="participants_board">
      <ApplicationsBlock></ApplicationsBlock>
      <UserBlock></UserBlock>
    </div>
  );
}
