import { useSelector } from "react-redux";
import useGetCompetition from "../../../QueryHooks/useGetCompetition";

function GameTitle() {
  const competitionId = useSelector((state: any) => state.game.competitionID);
  const boardShown = useSelector((state: any) => state.boardMenu.boardShown);

  const { isLoading, data, isError } = useGetCompetition(competitionId);

  let title = data?.title;
  let subTitle = data?.sub_title;

  if (isLoading) {
    title = "讓我看看";
    subTitle = "我還在找";
  }
  if (isError) {
    title = "窩不知道";
    subTitle = "窩不知道 :(";
  }

  return (
    <div className="game_title">
      <span
        className="game_main_title"
        style={{
          fontSize: boardShown !== "score" ? "30px" : "50px",
        }}
      >
        {title}
      </span>

      <br />
      {boardShown !== "score" ? null : (
        <span className="game_subtitle">{subTitle}</span>
      )}
    </div>
  );
}

export default GameTitle;
