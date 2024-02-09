import { useEffect, useState } from "react";

import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  List,
  ListItem,
  Divider,
} from "@mui/material";

import { useSelector, useDispatch } from "react-redux";
import { selectPhase } from "./phaseMenuSlice";

import useGetCompetition from "../../../../QueryHooks/useGetCompetition";

const phaseNames = [
  "資格賽",
  "對抗賽",
  "團體對抗賽",
  "混雙對抗賽",
  "沒有資格賽？？",
];

export default function PhaseMenu() {
  const [open, setOpen] = useState(false);
  const dispatch = useDispatch();
  const competitionId = useSelector((state: any) => state.game.competitionID);
  const phaseShown = useSelector((state: any) => state.phaseMenu.phaseShown);
  const { data: competition, isLoading } = useGetCompetition(competitionId);

  useEffect(() => {
    if (competition?.qualification_is_active)
      dispatch(selectPhase({ phaseShown: 0, phaseKindShown: "Qualification" }));
  }, [competition]);

  if (isLoading) return <></>;
  let items = makeItems({ competition, dispatch, setOpen });
  console.log(items);
  items = [items[0], ...items];
  console.log(items);

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
        {phaseNames[phaseShown]}
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
            if (index === 0) return null;
            return (
              <>
                {index === 1 ? (
                  <Divider sx={{ borderColor: "primary.contrastText" }} />
                ) : null}
                {item}
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

function makeItems({ competition, dispatch, setOpen }: any) {
  let items = [];
  if (competition?.qualification_is_active) {
    items.push(
      <ListItem
        key="Qualification"
        sx={{ justifyContent: "center" }}
        onClick={() => {
          dispatch(
            selectPhase({ phaseShown: 0, phaseKindShown: "Qualification" })
          );
          setOpen(false);
        }}
      >
        {phaseNames[0]}
      </ListItem>
    );
  } else {
    <ListItem
      onClick={() => {
        setOpen(false);
      }}
    >
      {phaseNames[4]}
    </ListItem>;
  }
  if (competition?.elimination_is_active) {
    items.push(
      <ListItem
        key="Elimination"
        sx={{ justifyContent: "center" }}
        onClick={() => {
          dispatch(
            selectPhase({ phaseShown: 1, phaseKindShown: "Elimination" })
          );
          setOpen(false);
        }}
      >
        {phaseNames[1]}
      </ListItem>
    );
  }

  if (competition?.team_elimination_is_active) {
    items.push(
      <ListItem
        key="TeamElimination"
        sx={{ justifyContent: "center" }}
        onClick={() => {
          dispatch(
            selectPhase({ phaseShown: 2, phaseKindShown: "Elimination" })
          );
          setOpen(false);
        }}
      >
        {phaseNames[2]}
      </ListItem>
    );
  }
  if (competition?.mixed_elimination_is_active) {
    items.push(
      <ListItem
        key="MixedElimination"
        sx={{ justifyContent: "center" }}
        onClick={() => {
          dispatch(
            selectPhase({ phaseShown: 3, phaseKindShown: "Elimination" })
          );
          setOpen(false);
        }}
      >
        {phaseNames[3]}
      </ListItem>
    );
  }
  return items;
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
