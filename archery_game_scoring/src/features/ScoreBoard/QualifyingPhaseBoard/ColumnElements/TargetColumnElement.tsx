interface Props {
  content: string;
}

function TargetColumnElement(props: Props) {
  return <div className="target_column_element">{props.content}</div>;
}

export default TargetColumnElement;
