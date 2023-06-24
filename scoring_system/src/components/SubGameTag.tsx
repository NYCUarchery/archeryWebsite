import SubGameTitle from "./SubGameTitle";

interface Props{
    title: string;
}

function SubGameTag(props: Props) {
    return <div className="sub_game_tag"><SubGameTitle title = {props.title}></SubGameTitle></div>;
}

export default SubGameTag;