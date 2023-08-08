interface Props {
  laneNum: number;
}

export default function LaneNumber(props: Props) {
  return (
    <div className="lane_number">
      <div>{props.laneNum}</div>
    </div>
  );
}
