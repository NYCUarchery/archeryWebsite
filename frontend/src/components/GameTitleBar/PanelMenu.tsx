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
  path: string;
};

const boardAbbreviations = new Map<string, string>([
  ["scoreboard", "分"],
  ["scoring", "記"],
  ["admin", "監"],
  ["judge", "判"],
]);

const boardNameSets: BoardNameSet[] = [
  { id: "home", name: "首頁", path: "/" },
  { id: "scoreboard", name: "分數榜", path: "/scoreboard" },
  { id: "scoring", name: "紀錄分數", path: "/scoring" },
  { id: "admin", name: "監控", path: "/admin" },
  { id: "judge", name: "裁判", path: "/admin/score-editing" },
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

  let indicatorCharacter: string = boardAbbreviations.get(panelName) as string;

  const handleClose = () => {
    setAnchorEl(null);
  };
  const handleClick = (event: any) => {
    setAnchorEl(event.currentTarget);
  };

  const items = boardNameSets.map((set) => {
    if (boardAbbreviations.has(set.id)) {
      console.log(participant);
      console.log(set.id);

      if (
        (participant === undefined || participant?.status === "pending") &&
        set.id !== "scoreboard"
      ) {
        return <></>;
      } else if (
        participant?.role === "player" &&
        (set.id === "admin" || set.id === "judge")
      ) {
        return <></>;
      } else if (participant?.role === "admin" && set.id === "scoring") {
        return <></>;
      }
      return (
        <MenuItem
          key={set.id}
          onClick={() => {
            router.push(currentPenalRootPath + "/" + set.path);
            indicatorCharacter = boardAbbreviations.get(set.id) as string;
            handleClose();
          }}
        >
          {set.name}
        </MenuItem>
      );
    }
    return (
      <MenuItem
        key={set.id}
        onClick={() => {
          router.push(set.path);
          handleClose();
        }}
      >
        {set.name}
      </MenuItem>
    );
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
