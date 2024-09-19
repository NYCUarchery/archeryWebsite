"use client";
import { useState } from "react";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import prunePath from "@/utils/prunePath";
import { Participant } from "@/types/oldRef/Participant";

type BoardNameSet = {
  id: string;
  name: string;
};

const boardAbbreviations = new Map<string, string>([
  ["scoreboard", "分"],
  ["scoring", "記"],
  ["admin", "監"],
]);

const boardNameSets: BoardNameSet[] = [
  { id: "scoreboard", name: "分數榜" },
  { id: "scoring", name: "紀錄分數" },
  { id: "admin", name: "監控" },
];

interface Props {
  panelName: string;
  participant: Participant | undefined;
}

export default function PanelMenu({ panelName, participant }: Props) {
  const [AnchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const router = useRouter();
  const currentPath = usePathname();
  const currentPenalRootPath = prunePath(currentPath, 3);
  const avaliableBoards: string[] = ["scoreboard", "scoring", "admin"];

  let indicatorCharacter: string = boardAbbreviations.get(panelName) as string;

  const handleClose = () => {
    setAnchorEl(null);
  };
  const handleClick = (event: any) => {
    setAnchorEl(event.currentTarget);
  };

  const items = boardNameSets.map((set) => {
    if (avaliableBoards.includes(set.id)) {
      if (
        (participant === undefined || participant?.status === "pending") &&
        set.id !== "scoreboard"
      ) {
        return <></>;
      } else if (participant?.role === "player" && set.id === "admin") {
        return <></>;
      } else if (participant?.role === "admin" && set.id === "scoring") {
        return <></>;
      }
      return (
        <MenuItem
          key={set.id}
          onClick={() => {
            router.push(currentPenalRootPath + "/" + set.id);
            indicatorCharacter = boardAbbreviations.get(set.id) as string;
            handleClose();
          }}
        >
          {set.name}
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
