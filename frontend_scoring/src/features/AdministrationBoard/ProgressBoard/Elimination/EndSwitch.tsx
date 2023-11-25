import { Button, ButtonGroup } from "@mui/material";
import { useMutation } from "react-query";
import axios from "axios";
import { useQueryClient } from "react-query";

const putCurrentEndIncrease = (eliminationID: number) => {
  return axios.put(`/api/elimination/currentend/plus/${eliminationID}`);
};
const putCurrentEndDecrease = (eliminationID: number) => {
  return axios.put(`/api/elimination/currentend/minus/${eliminationID}`);
};
interface Props {
  elimination: any;
}

export default function EndSwitch({ elimination }: Props) {
  const teamSize = elimination.team_size;
  const endNum = teamSize === 1 ? 5 : 4;
  const queryClient = useQueryClient();
  const currentEnd = elimination.current_end;
  const stageNum = elimination.stages.length;

  const { mutate: increaseCurrentEnd } = useMutation(putCurrentEndIncrease, {
    onSuccess: () => {
      queryClient.invalidateQueries("eliminationWithAllScores");
    },
  });
  const { mutate: decreaseCurrentEnd } = useMutation(putCurrentEndDecrease, {
    onSuccess: () => {
      queryClient.invalidateQueries("eliminationWithAllScores");
    },
  });

  return (
    <ButtonGroup fullWidth>
      {currentEnd > 0 ? (
        <Button onClick={() => decreaseCurrentEnd(elimination.id)}>&lt;</Button>
      ) : (
        <></>
      )}
      {currentEnd <= stageNum * endNum ? (
        <Button onClick={() => increaseCurrentEnd(elimination.id)}>&gt;</Button>
      ) : (
        <></>
      )}
    </ButtonGroup>
  );
}
