import { useSelector } from "react-redux";

export default function UserNamePrompt() {
  const userName = useSelector((state: any) => state.user.userRealName);
  const promptId: number = getRandomInt(3);
  let content: string = userName;

  switch (promptId) {
    case 0:
      content = "嗨！" + userName;
      break;
    case 1:
      content = "嗨！" + userName + "，你好！";
      break;
    case 2:
      content = "你是" + userName + "吧？";
      break;
    case 3:
      content = "你好，" + userName + "！";
      break;
  }

  return <span className="user_name_prompt">{content}</span>;
}

function getRandomInt(max: number): number {
  return Math.floor(Math.random() * max);
}
