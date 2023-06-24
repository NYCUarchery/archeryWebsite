interface Props{
    title: string;
}


function SubGameTitle(props: Props) {
    return <span className="sub_game_title">{props.title}</span>;
}

export default SubGameTitle;