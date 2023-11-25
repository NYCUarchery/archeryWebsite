export const extractEnd = (player: any, currentEnd: number) => {
  if (player === undefined) return;

  const currentRound = Math.ceil(currentEnd / 6);
  const round = player.rounds[currentRound - 1];

  const end = round?.round_ends[currentEnd - (currentRound - 1) * 6 - 1];

  return end;
};
export const extractround = (player: any, currentEnd: number) => {
  if (player === undefined) return;
  const currentRound = Math.ceil(currentEnd / 6);
  const round = player.rounds[currentRound - 1];

  return round;
};
export const extractScores = (end: any) => {
  if (end === undefined) return [];
  let scores = [];
  for (let i = 0; i < end.round_scores.length; i++) {
    scores.push(end.round_scores[i].score);
  }
  return scores;
};

export const findLastScoreInEnd = (end: any) => {
  if (end === undefined) return;
  for (let i = 0; i < end.round_scores.length; i++) {
    if (end.round_scores[i].score === -1) return end.round_scores[i];
  }
  return undefined;
};
export const findUnfilledScoreInEnd = (end: any) => {
  if (end === undefined) return;
  for (let i = 0; i < end.round_scores.length; i++) {
    if (end.round_scores[i].score === -1) return end.round_scores[i - 1];
  }
  return end.round_scores[end.round_scores.length - 1];
};
