import { List, ListSubheader } from "@mui/material";
import { useSelector } from "react-redux";
import AdminItem from "./AdminItem";

export default function AdminList() {
  const adminApplications = useSelector(
    (state: any) => state.participants.adminApplications
  );
  let applicationItems: any[] = [];

  for (let i = 0; i < adminApplications.length; i++) {
    const application = adminApplications[i];
    applicationItems.push(
      <AdminItem
        key={i}
        id={application.id}
        name={application.name}
        index={i}
      ></AdminItem>
    );
  }

  return (
    <List
      className="admin_list"
      subheader={<ListSubheader>管理員申請</ListSubheader>}
    >
      {applicationItems}
    </List>
  );
}
