"use client";

import { Group } from "@/types/oldRef/Competition";
import { usePathname, useRouter } from "next/navigation";

import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  List,
  ListItem,
  Divider,
} from "@mui/material";

import subtituteSegment from "@/utils/subtituteSegment";

import { useState } from "react";

interface Props {
  groups: Group[];
}

export default function GroupMenu({ groups }: Props) {
  const [open, setOpen] = useState(false);
  const currentPath = usePathname();
  const router = useRouter();
  const groupShown = parseInt(currentPath.split("/")[4]);
  const selectedGroup = groups.find(
    (group) => group.group_index === groupShown
  ) as Group;

  if (!selectedGroup) return <></>;

  return (
    <Accordion
      square={true}
      expanded={open}
      elevation={0}
      sx={{
        width: "50%",
        height: "100%",
        backgroundColor: "primary.dark",
        color: "primary.contrastText",
      }}
    >
      <AccordionSummary
        sx={AccordionSummaryStyle}
        onClick={() => setOpen(!open)}
      >
        {selectedGroup.group_name}
      </AccordionSummary>
      <AccordionDetails
        sx={{
          backgroundColor: "primary.dark",
          color: "primary.contrastText",
          padding: "0",
        }}
      >
        <List
          sx={{
            p: 0,
            "& .MuiListItem-root": {
              justifyContent: "center",
              height: "2rem",
              fonxSize: "2rem",
            },
          }}
        >
          {groups.map((group, index) => {
            if (index === 0) return null;
            return (
              <>
                {index === 1 ? (
                  <Divider sx={{ borderColor: "primary.contrastText" }} />
                ) : null}
                <ListItem
                  key={group.id}
                  sx={{ justifyContent: "center", cursor: "pointer" }}
                  onClick={() => {
                    router.push(
                      subtituteSegment(
                        currentPath,
                        4,
                        group.group_index.toString()
                      )
                    );
                    setOpen(false);
                  }}
                >
                  {group.group_name}
                </ListItem>
                {index !== groups.length - 1 ? (
                  <Divider sx={{ borderColor: "primary.contrastText" }} />
                ) : null}
              </>
            );
          })}
        </List>
      </AccordionDetails>
    </Accordion>
  );
}

const AccordionSummaryStyle = {
  "&.MuiAccordionSummary-root": {
    height: "100%",
    minHeight: "0",
  },

  "& .MuiAccordionSummary-content": {
    height: "100%",
    fontSize: "100%",
    justifyContent: "center",
    alignItems: "center",
    margin: "0",
  },
};
