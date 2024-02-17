import { Button } from "@mui/material";
import { useSelector } from "react-redux";
import axios from "axios";
import { useMutation } from "react-query";
import { useQueryClient } from "react-query";

const putActiveQualification = (competitionID: number) => {
  return axios.put(`/api/competition/qualificationisactive/${competitionID}`);
};
const putActiveElimination = (competitionID: number) => {
  return axios.put(`/api/competition/eliminationisactive/${competitionID}`);
};

const putActiveTeamElimination = (competitionID: number) => {
  return axios.put(`/api/competition/teameliminationisactive/${competitionID}`);
};

const putActiveMixedElimination = (competitionID: number) => {
  return axios.put(
    `/api/competition/mixedeliminationisactive/${competitionID}`
  );
};

interface Props {
  phaseIndex: number;
}

export default function ActivationButton({ phaseIndex }: Props) {
  const invalidateCompetitionQuery = () =>
    useQueryClient().invalidateQueries("competition");
  const competitionID = useSelector((state: any) => state.game.competitionID);
  const { mutate: activeQualification } = useMutation(putActiveQualification, {
    onSuccess: invalidateCompetitionQuery,
  });
  const { mutate: activeElimination } = useMutation(putActiveElimination, {
    onSuccess: invalidateCompetitionQuery,
  });
  const { mutate: activeTeamElimination } = useMutation(
    putActiveTeamElimination,
    { onSuccess: invalidateCompetitionQuery }
  );
  const { mutate: activeMixedElimination } = useMutation(
    putActiveMixedElimination,
    { onSuccess: invalidateCompetitionQuery }
  );

  let phaseName: string = "";
  let active: any = () => {};

  switch (phaseIndex) {
    case 0:
      phaseName = "Qualification";
      active = activeQualification;
      break;
    case 1:
      phaseName = "Elimination";
      active = activeElimination;
      break;
    case 2:
      phaseName = "Team Elimination";
      active = activeTeamElimination;
      break;
    case 3:
      phaseName = "Mixed Elimination";
      active = activeMixedElimination;
      break;
  }

  return (
    <Button
      className="activation_button"
      onClick={() => active(competitionID)}
      sx={{
        textTransform: "none",
      }}
    >
      {phaseName}
    </Button>
  );
}
