"use client";
import { useState } from "react";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import prunePath from "@/utils/prunePath";

type BoardNameSet = {
  id: string;
  name: string;
};

const boardAbbreviations = new Map<string, string>([
  ["scoreboard", "分"],
  ["recording", "記"],
  ["admin", "監"],
]);

const boardNameSets: BoardNameSet[] = [
  { id: "scoreboard", name: "分數榜" },
  { id: "recording", name: "紀錄分數" },
  { id: "admin", name: "監控" },
];

interface Props {
  panelName: string;
}

export default function PanelMenu({ panelName }: Props) {
  const [AnchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const router = useRouter();
  const currentPath = usePathname();
  const currentPenalRootPath = prunePath(currentPath, 3);
  const avaliableBoards: string[] = ["scoreboard", "recording", "admin"];

  let indicatorCharacter: string = boardAbbreviations.get(panelName) as string;

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
            router.push(currentPenalRootPath + "/" + e.id);
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
