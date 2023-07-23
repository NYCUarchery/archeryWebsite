interface Props {
  name: string;
  isWinner: boolean;
}

export default function NameBlock(props: Props) {
  let className: string;
  props.isWinner
    ? (className = "name_block winner")
    : (className = "name_block");
  return <div className={className}>{props.name}</div>;
}
