import { useDispatch } from "react-redux";
import { initBoardSwitch, switchBoard } from "./boardMenuSlice";
import { useSelector } from "react-redux";
import Button from "@mui/material/Button";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import { signal } from "@preact/signals";

type BoardNameSet = {
  id: string;
  name: string;
};

let anchorEl = signal<HTMLElement | null>(null);

const boardAbbreviations = new Map<string, string>([
  ["score", "分"],
  ["recording", "記"],
  ["administration", "監"],
]);

const boardNameSets: BoardNameSet[] = [
  { id: "score", name: "分數榜" },
  { id: "recording", name: "紀錄分數" },
  { id: "administration", name: "監控" },
];

export default function BoardSwitch() {
  const boardShown = useSelector((state: any) => state.boardSwitch.boardShown);
  const avalibleBoards = useSelector(
    (state: any) => state.boardSwitch.avalibleBoards
  );
  const userStatus = useSelector((state: any) => state.user.userStatus);
  const userRole = useSelector((state: any) => state.user.userRole);
  const dispatch = useDispatch();
  dispatch(initBoardSwitch({ role: userRole, status: userStatus }));
  let indicatorCharacter: string = boardAbbreviations.get(boardShown) as string;

  const handleClose = () => {
    anchorEl.value = null;
  };
  const handleClick = (event: any) => {
    anchorEl.value = event.currentTarget;
  };

  const items = boardNameSets.map((e) => {
    if (avalibleBoards.includes(e.id)) {
      return (
        <MenuItem
          key={e.id}
          onClick={() => {
            dispatch(switchBoard(e.id));
            indicatorCharacter = boardAbbreviations.get(e.id) as string;
            handleClose();
          }}
        >
          {e.name}
        </MenuItem>
      );
    }
  });

  return (
    <>
      <Button className="board_switch" onClick={handleClick}>
        {indicatorCharacter}
      </Button>
      <Menu
        anchorEl={anchorEl.value}
        onClose={handleClose}
        open={Boolean(anchorEl.value)}
        keepMounted
      >
        {items}
      </Menu>
    </>
  );
}
