import SubGameTag from "./SubGameTag";

let subGameTitles = [
    '新生',
    '大專30m',
    '公開30m',
    '公開70m',
]


function SubGamesBar() {
    return <div className="sub_game_bar">
        {subGameTitles.map((title) =><SubGameTag title = {title}></SubGameTag>)}
    </div>;
}

export default SubGamesBar;