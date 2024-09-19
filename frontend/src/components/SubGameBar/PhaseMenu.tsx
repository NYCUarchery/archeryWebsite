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
import subtituteSegment from "@/utils/subtituteSegment";

export default function PhaseMenu() {
  const [open, setOpen] = useState(false);
  const currentPath = usePathname();
  const router = useRouter();
  const phaseShown = currentPath.split("/")[5];
  const items = Object.values(PhaseEnums);

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
                      subtituteSegment(currentPath, 5, item.toLowerCase())
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
