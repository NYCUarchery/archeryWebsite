import { Button } from "@mui/material";
import { useMutation, useQueryClient } from "react-query";
import axios from "axios";

const putRanking = (eliminationID: number) => {
  return axios.put(`/api/playerset/preranking/${eliminationID}`);
};
interface Props {
  eliminationID: number;
}

export default function RankingButton({ eliminationID }: Props) {
  const queryClient = useQueryClient();

  const { mutate: rank } = useMutation(putRanking, {
    onSuccess: () => {
      queryClient.invalidateQueries(["playerSets", eliminationID]);
    },
  });

  const handleOnClick = () => {
    rank(eliminationID);
  };
  return <Button onClick={handleOnClick}>更新排名</Button>;
}
