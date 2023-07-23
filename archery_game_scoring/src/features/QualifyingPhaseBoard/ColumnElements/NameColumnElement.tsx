interface Props {
  content: string;
}

function NameColumnElement(props: Props) {
  return <div className="name_column_element">{props.content}</div>;
}

export default NameColumnElement;
