interface Props {
  name: string;
  medal: string;
}

export default function ResultBar(props: Props) {
  return (
    <div className={"result_bar " + props.medal}>
      <div className="name_block">{props.name}</div>
      <div className="medal_block">{props.medal}</div>
    </div>
  );
}
