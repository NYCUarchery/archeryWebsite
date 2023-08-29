import {
  ButtonGroup,
  Accordion,
  AccordionDetails,
  AccordionSummary,
} from "@mui/material";
import { useSelector } from "react-redux";
import AdminBoardListItem from "./AdminBoardListItem";

export default function AdminBoardList() {
  const adminBoardShown = useSelector(
    (state: any) => state.adminBoardList.adminBoardShown
  );
  const adminBoardList = useSelector(
    (state: any) => state.adminBoardList.adminBoardList
  );

  let items = [];

  for (let i = 0; i < adminBoardList.length; i++) {
    items.push(
      <AdminBoardListItem
        key={i}
        content={adminBoardList[i]}
        index={i}
      ></AdminBoardListItem>
    );
  }

  let summery = "Main";

  switch (adminBoardList[adminBoardShown]) {
    case "main":
      summery = "Main";
      break;
    case "scoreEdition":
      summery = "Score Edition";
      break;
    case "participants":
      summery = "Participants";
      break;
  }

  return (
    <Accordion className="admin_board_list_accordion" disableGutters={true}>
      <AccordionSummary>{summery}</AccordionSummary>
      <AccordionDetails>
        <ButtonGroup
          className="admin_board_list"
          orientation="vertical"
          variant="text"
        >
          {items}
        </ButtonGroup>
      </AccordionDetails>
    </Accordion>
  );
}
