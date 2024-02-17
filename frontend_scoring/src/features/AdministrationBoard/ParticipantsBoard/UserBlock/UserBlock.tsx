import AdminList from "./AdminList/AdminList";
import PlayerList from "./PlayerList/PlayerList";

export default function UserBlock() {
  return (
    <div className="user_block">
      <AdminList />
      <PlayerList />
    </div>
  );
}
