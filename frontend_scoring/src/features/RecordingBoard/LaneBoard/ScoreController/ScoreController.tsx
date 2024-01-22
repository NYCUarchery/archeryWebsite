import { ButtonGroup } from "@mui/material";
import ScoreButton from "./ScoreButton";
import ControllButtonGroup from "./ControllButtonGroup";
import useGetCompetition from "../../../../QueryHooks/useGetCompetition";
import { useSelector } from "react-redux";
import { extractEnd, extractround } from "../util";

interface Props {
  selectedPlayer: any;
  player: any;
  possibleScores: number[];
}

export default function ScoreController({
  selectedPlayer,
  player,
  possibleScores,
}: Props) {
  const competitionID = useSelector((state: any) => state.game.competitionID);
  const { data: competition, isLoading } = useGetCompetition(competitionID);
  if (isLoading) return <></>;
  console.log(player);
  const currentEnd = competition.qualification_current_end;
  const round = extractround(selectedPlayer, currentEnd);
  const end = extractEnd(selectedPlayer, currentEnd);
  const participantEnd = extractEnd(player, currentEnd);
  let scoreButtons = [];

  for (let i = 0; i < possibleScores.length; i++) {
    scoreButtons.push(
      <ScoreButton
        key={i}
        score={possibleScores[i]}
        selectedPlayer={selectedPlayer}
        round={round}
        end={end}
      ></ScoreButton>
    );
  }

  return (
    <>
      <ButtonGroup
        className="score_button_group"
        variant="text"
        disabled={end?.is_confirmed}
        disableElevation
      >
        {scoreButtons}
      </ButtonGroup>
      <ControllButtonGroup
        participantEnd={participantEnd}
        selectedPlayer={selectedPlayer}
        round={round}
        end={end}
        isConfirmed={participantEnd?.is_confirmed}
      ></ControllButtonGroup>
    </>
  );
}
