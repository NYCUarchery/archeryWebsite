interface Props {
  targetNum: number;
}

export default function TargetSigns(props: Props) {
  let content = [];
  for (let i = 0; i < props.targetNum; i++) {
    content.push(
      <div className="target_sign" key={charAddInt("A", i)}>
        {charAddInt("A", i)}
      </div>
    );
  }
  return <div className="target_signs">{content}</div>;
}

function charAddInt(c: string, i: number): string {
  return String.fromCharCode(c.charCodeAt(0) + i);
}
