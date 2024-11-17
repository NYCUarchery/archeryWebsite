import { useState } from "react";
import { PhaseEnums, getChinesePhaseName } from "@/enums/PhaseEnums";

import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  List,
  ListItem,
  Divider,
} from "@mui/material";

import { usePathname, useRouter } from "next/navigation";

import { DatabaseCompetition } from "@/types/Api";

interface Props {
  competition: DatabaseCompetition;
}

export default function PhaseMenu({ competition }: Props) {
  const [open, setOpen] = useState(false);
  const currentPath = usePathname();
  const router = useRouter();
  const phaseShown = currentPath.split("/").slice(5, 7).join("/");
  let items = Object.values(PhaseEnums);

  if (!competition.mixed_elimination_is_active) {
    items = items.filter((item) => item !== PhaseEnums.MixedElimination);
  }
  if (!competition.team_elimination_is_active) {
    items = items.filter((item) => item !== PhaseEnums.TeamElimination);
  }
  if (!competition.elimination_is_active) {
    items = items.filter((item) => item !== PhaseEnums.Elimination);
  }

  return (
    <Accordion
      square={true}
      expanded={open}
      elevation={0}
      disableGutters={true}
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
        {getChinesePhaseName(phaseShown as PhaseEnums)}
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
          {items.map((item, index) => {
            return (
              <>
                {index === 0 ? (
                  <Divider sx={{ borderColor: "primary.contrastText" }} />
                ) : null}
                <ListItem
                  key={item}
                  sx={{ justifyContent: "center", cursor: "pointer" }}
                  onClick={() => {
                    router.push(
                      currentPath.split("/").slice(0, 5).join("/") +
                        "/" +
                        item.toLowerCase()
                    );
                    setOpen(false);
                  }}
                >
                  {getChinesePhaseName(item)}
                </ListItem>
                {index !== items.length - 1 ? (
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
