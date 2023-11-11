interface Props {
  laneNum: number;
}

export default function LaneNumber(props: Props) {
  return (
    <div className="lane_number">
      <span>{props.laneNum}</span>
    </div>
  );
}
