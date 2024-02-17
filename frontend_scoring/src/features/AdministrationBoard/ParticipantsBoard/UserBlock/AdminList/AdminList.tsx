import { List, ListSubheader } from "@mui/material";
import { useSelector } from "react-redux/es/hooks/useSelector";
import AdminItem from "./AdminItem";
import useGetParcipants from "../../../../../QueryHooks/useGetParticipants";

export default function AdminList() {
  const competitionID = useSelector((state: any) => state.game.competitionID);
  const { data: participants, isFetching } = useGetParcipants(competitionID);
  if (!participants || isFetching) {
    return <></>;
  }
  let adminItems = [];

  for (let i = 0; i < participants.length; i++) {
    if (
      participants[i].role !== "admin" ||
      participants[i].status !== "approved"
    )
      continue;

    adminItems.push(
      <AdminItem key={i} participant={participants[i]}></AdminItem>
    );
  }

  return (
    <List
      className="admin_list"
      subheader={<ListSubheader>管理員</ListSubheader>}
    >
      {adminItems}
    </List>
  );
}
