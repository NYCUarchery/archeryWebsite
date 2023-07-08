interface Props{
    content: string;
}

function ScoreColumnElement(props: Props){
    return <div className="score_column_element">{props.content}</div>;
}

export default ScoreColumnElement;