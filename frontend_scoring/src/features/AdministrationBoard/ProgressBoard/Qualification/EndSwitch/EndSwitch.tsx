import { Button, ButtonGroup } from "@mui/material";
import { useMutation } from "react-query";
import { useSelector } from "react-redux";
import axios from "axios";
import { useQueryClient } from "react-query";
import useGetCompetition from "../../../../../QueryHooks/useGetCompetition";

const putCurrentEndIncrease = (competitionID: number) => {
  return axios.put(
    `/api/competition/qualificationcurrentend/plus/${competitionID}`
  );
};
const putCurrentEndDecrease = (competitionID: number) => {
  return axios.put(
    `/api/competition/qualificationcurrentend/minus/${competitionID}`
  );
};

export default function EndSwitch() {
  const queryClient = useQueryClient();
  const competitionID: number = useSelector(
    (state: any) => state.game.competitionID
  );
  const { data: competition, isLoading } = useGetCompetition(competitionID);
  const { mutate: increaseCurrentEnd } = useMutation(putCurrentEndIncrease, {
    onSuccess: () => {
      queryClient.invalidateQueries("competition");
    },
  });
  const { mutate: decreaseCurrentEnd } = useMutation(putCurrentEndDecrease, {
    onSuccess: () => {
      queryClient.invalidateQueries("competition");
    },
  });
  if (isLoading) return <></>;
  const currentEnd = competition?.qualification_current_end as number;
  const roundsNum = competition?.rounds_num as number;

  return (
    <ButtonGroup fullWidth>
      {currentEnd > 0 ? (
        <Button onClick={() => decreaseCurrentEnd(competitionID)}>&lt;</Button>
      ) : (
        <></>
      )}
      {currentEnd <= roundsNum * 6 ? (
        <Button onClick={() => increaseCurrentEnd(competitionID)}>&gt;</Button>
      ) : (
        <></>
      )}
    </ButtonGroup>
  );
}
