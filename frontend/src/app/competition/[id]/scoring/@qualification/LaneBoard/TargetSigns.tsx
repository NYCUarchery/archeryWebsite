interface Props {
  orders: number[];
}

export default function TargetSigns({ orders }: Props) {
  const content = [];
  for (let i = 0; i < orders.length; i++) {
    content.push(
      <div className="target_sign" key={charAddInt("A", orders[i] - 1)}>
        {charAddInt("A", orders[i] - 1)}
      </div>
    );
  }
  return <div className="target_signs">{content}</div>;
}

function charAddInt(c: string, i: number): string {
  return String.fromCharCode(c.charCodeAt(0) + i);
}
