import { ToggleButtonGroup, ToggleButton } from "@mui/material";
import { useSelector, useDispatch } from "react-redux";
import { selectAdminBoard } from "./adminBoardTabsSlice";

export default function AdminBoardTabs() {
  const dispatch = useDispatch();
  const adminBoardShown = useSelector(
    (state: any) => state.adminBoardTabs.adminBoardShown
  );
  const adminBoardTabs = useSelector(
    (state: any) => state.adminBoardTabs.adminBoardTabs
  );

  const handleSelection = (
    _event: React.MouseEvent<HTMLElement>,
    newAdminBoardShown: number | null
  ) => {
    if (newAdminBoardShown == null) {
      newAdminBoardShown = 0;
    }
    dispatch(selectAdminBoard(newAdminBoardShown));
  };

  let items = [];

  for (let i = 0; i < adminBoardTabs.length; i++) {
    items.push(
      <ToggleButton className="admin_board_tab" key={i} value={i}>
        {adminBoardTabs[i]}
      </ToggleButton>
    );
  }

  return (
    <ToggleButtonGroup
      value={adminBoardShown}
      className="admin_board_tabs"
      exclusive
      onChange={handleSelection}
    >
      {items}
    </ToggleButtonGroup>
  );
}
