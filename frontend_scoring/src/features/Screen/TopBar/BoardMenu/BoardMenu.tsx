import { useDispatch } from "react-redux";
import { initBoardMenu, selectBoard } from "./boardMenuSlice";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import useGetUserParticipant from "../../../../QueryHooks/useGetUserParticipant";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";

type BoardNameSet = {
  id: string;
  name: string;
};

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

export default function boardMenu() {
  const [AnchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const boardShown = useSelector((state: any) => state.boardMenu.boardShown);
  const avaliableBoards = useSelector(
    (state: any) => state.boardMenu.avaliableBoards
  );
  const competitionID = useSelector((state: any) => state.game.competitionID);
  const { data: participant } = useGetUserParticipant(Number(competitionID));
  const dispatch = useDispatch();
  useEffect(() => {
    return () => {
      dispatch(
        initBoardMenu({
          role: participant?.role ?? "viewer",
          status: participant?.status ?? "pending",
        })
      );
    };
  }, [participant]);

  let indicatorCharacter: string = boardAbbreviations.get(boardShown) as string;

  const handleClose = () => {
    setAnchorEl(null);
  };
  const handleClick = (event: any) => {
    setAnchorEl(event.currentTarget);
  };

  const items = boardNameSets.map((e) => {
    if (avaliableBoards.includes(e.id)) {
      return (
        <MenuItem
          key={e.id}
          onClick={() => {
            dispatch(selectBoard(e.id));
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
      <button className="board_switch" onClick={handleClick}>
        {indicatorCharacter}
      </button>
      <Menu
        anchorEl={AnchorEl}
        onClose={handleClose}
        open={Boolean(AnchorEl)}
        keepMounted
      >
        {items}
      </Menu>
    </>
  );
}
