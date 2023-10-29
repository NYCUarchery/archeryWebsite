interface Props {
  content: string;
}

function InstitutionsColumnElement(props: Props) {
  return <div className="institution_column_element">{props.content}</div>;
}

export default InstitutionsColumnElement;
