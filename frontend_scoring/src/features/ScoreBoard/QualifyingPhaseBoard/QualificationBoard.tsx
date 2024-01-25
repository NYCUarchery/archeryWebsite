import { useSelector } from "react-redux";
import useGetQualificationWithLanesPlayers from "../../../QueryHooks/useGetQualificationWithLanesPlayers";
import { RankingInfoBar } from "./RankingInfoBar/RankingInfoBar";
import { Grid } from "@mui/material";
import { Group } from "../../../QueryHooks/types/Competition";

interface Props {
  groups: Group[];
}

export default function QualificationBoard({ groups }: Props) {
  const groupShown: number = useSelector(
    (state: any) => state.groupListButton.groupShown
  );

  const group = groups.find((g: any) => g.id === groupShown);
  const { data: qualification } = useGetQualificationWithLanesPlayers(
    group?.id ?? -1
  );
  if (!group || !qualification) return <></>;

  let RankingInfoBars = [];

  const advancingNum = qualification.advancing_num;
  group.players.sort((a: any, b: any) => a.rank - b.rank);
  for (let i = 0; i < group.players.length; i++) {
    let isQudalified: boolean;
    i < advancingNum ? (isQudalified = true) : (isQudalified = false);

    RankingInfoBars.push(
      <RankingInfoBar
        key={i}
        playerShell={group.players[i]}
        isQudalified={isQudalified}
      ></RankingInfoBar>
    );
  }

  return (
    <div className="qualification_board">
      <ColumnTitle />
      {RankingInfoBars}
    </div>
  );
}

function ColumnTitle() {
  return (
    <Grid
      container
      columns={90}
      className="scoreboard_row column_title"
      sx={{ alignItems: "center", height: "23px" }}
    >
      <Grid item xs={10}>
        排名
      </Grid>
      <Grid item xs={10}>
        靶號
      </Grid>
      <Grid item xs={20}>
        姓名
      </Grid>
      <Grid item xs={50}>
        分數
      </Grid>
    </Grid>
  );
}
