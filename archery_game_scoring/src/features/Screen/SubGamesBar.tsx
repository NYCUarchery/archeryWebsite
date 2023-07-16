import SubGameTag from "./SubGameTag";
import GroupList from "./GroupList/GroupList";
import PhaseList from "./PhaseList/PhaseList";

let subGameTitles = [
    '新生',
    '大專30m',
    '公開30m',
    '公開70m',
]


function SubGamesBar() {
    return <div className="sub_game_bar">
        <GroupList></GroupList>
        <PhaseList></PhaseList>
    </div>;
}

export default SubGamesBar;