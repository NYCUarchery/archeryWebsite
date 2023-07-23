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
  return <span className="game_main_title">風城盃</span>;
}

function GameSubtitle() {
  return <span className="game_subtitle">第二十五屆</span>;
}

export default GameTitle;
