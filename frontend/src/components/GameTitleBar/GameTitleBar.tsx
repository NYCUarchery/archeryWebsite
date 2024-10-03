"use client";

import { Participant } from "@/types/oldRef/Participant";
import PanelMenu from "./PanelMenu";
import { useSelectedLayoutSegment } from "next/navigation";

interface Props {
  name: string;
  title: string | undefined;
  subtitle: string | undefined;
  isLoading: boolean;
  isError: boolean;
  participant: Participant | undefined;
}

export default function GameTitleBar({
  name,
  title,
  subtitle,
  isLoading,
  isError,
  participant,
}: Props) {
  if (isLoading) {
    title = "讓我看看";
    subtitle = "我還在找";
  }
  if (isError) {
    title = "窩不知道";
    subtitle = "窩不知道 :(";
  }
  const segment = useSelectedLayoutSegment();
  const panelName = segment as string;

  console.log(participant);
  return (
    <div
      className="top_bar"
      style={{
        height: panelName === "scoreboard" ? "150px" : "50px",
      }}
    >
      <NamePrompt name={name} />
      <PanelMenu panelName={panelName} participant={participant} />
      <div className="game_title">
        <span
          className="game_main_title"
          style={{
            fontSize: panelName === "scoreboard" ? "50px" : "30px",
          }}
        >
          {title}
        </span>

        <br />
        {panelName === "scoreboard" ? (
          <span className="game_subtitle">{subtitle}</span>
        ) : null}
      </div>
    </div>
  );
}

interface NamePromptProps {
  name: string;
}

function NamePrompt({ name }: NamePromptProps) {
  const promptId: number = getRandomInt(3);
  let content: string = name;

  switch (promptId) {
    case 0:
      content = "嗨！" + name;
      break;
    case 1:
      content = "嗨！" + name + "，你好！";
      break;
    case 2:
      content = "你是" + name + "吧？";
      break;
    case 3:
      content = "你好，" + name + "！";
      break;
  }

  return <span className="user_name_prompt">{content}</span>;
}

function getRandomInt(max: number): number {
  return Math.floor(Math.random() * max);
}
