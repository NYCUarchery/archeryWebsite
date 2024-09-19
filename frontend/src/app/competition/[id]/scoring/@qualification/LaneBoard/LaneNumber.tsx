interface Props {
  laneNum: number;
}

export default function LaneNumber({ laneNum }: Props) {
  let className = "";
  if (laneNum % 2 == 1) {
    className += "odd ";
  } else {
    className += "even ";
  }
  return (
    <div className="lane_number">
      <span className={className}>{laneNum}</span>
    </div>
  );
}
