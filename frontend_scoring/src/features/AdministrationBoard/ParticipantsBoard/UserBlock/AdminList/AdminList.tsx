import { List, ListSubheader } from "@mui/material";
import { useSelector } from "react-redux/es/hooks/useSelector";
import AdminItem from "./AdminItem";

export default function AdminList() {
  const admins = useSelector((state: any) => state.participants.admins);
  let adminItems: any[] = [];

  for (let i = 0; i < admins.length; i++) {
    const admin = admins[i];
    adminItems.push(
      <AdminItem key={i} id={admin.id} name={admin.name} index={i}></AdminItem>
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
