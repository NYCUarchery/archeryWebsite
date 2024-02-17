interface Props {
  name: string;
}

export default function NameBlock(props: Props) {
  return <div className="name_block">{props.name}</div>;
}
