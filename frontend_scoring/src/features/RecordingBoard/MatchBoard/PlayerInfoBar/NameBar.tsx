interface Props {
  name: string;
}

export default function NameBar(props: Props) {
  return <div className="name_bar">{props.name}</div>;
}
