import AdminList from "./AdminList/AdminList";
import PlayerList from "./PlayerList/PlayerList";

export default function ApplicationsBlock() {
  return (
    <div className="applications_block">
      <AdminList></AdminList>
      <PlayerList></PlayerList>
    </div>
  );
}
