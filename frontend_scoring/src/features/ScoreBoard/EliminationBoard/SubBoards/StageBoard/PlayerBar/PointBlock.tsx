interface Props {
  points: number;
}

export default function PointsBlock(props: Props) {
  return <div className="points_block">{props.points}</div>;
}
