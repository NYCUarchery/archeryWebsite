interface Props {
  content: string;
}

function RankColumnElement(props: Props) {
  return <div className="rank_column_element">{props.content}</div>;
}

export default RankColumnElement;
