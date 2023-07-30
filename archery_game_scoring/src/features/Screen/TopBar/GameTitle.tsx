import GameInfo from "../../../jsons/GameInfo.json";

function GameTitle() {
  return (
    <div className="game_title">
      <GameMainTitle></GameMainTitle>
      <br />
      <GameSubtitle></GameSubtitle>
    </div>
  );
}

function GameMainTitle() {
  return <span className="game_main_title">{GameInfo.title}</span>;
}

function GameSubtitle() {
  return <span className="game_subtitle">{GameInfo.sub_title}</span>;
}

export default GameTitle;
