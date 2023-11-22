import { useMutation } from "react-query";
import axios from "axios";
import { useSelector } from "react-redux";
import { Button } from "@mui/material";

const putRanking = (competitionID: number) => {
  return axios.put(`/api/competition/groups/players/rank/${competitionID}`);
};

export default function RankingButton() {
  const { mutate } = useMutation(putRanking, {
    onSuccess: () => {
      alert("Ranking successed");
    },
    onError: () => {
      alert("Ranking failed");
    },
  });
  const competitionID = useSelector((state: any) => state.game.competitionID);

  const handleClick = () => {
    mutate(competitionID);
  };

  return <Button onClick={handleClick}>更新排名</Button>;
}
