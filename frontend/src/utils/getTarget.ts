import numberToAlphabet from "./numberToAlphabet";

export default function getTarget(laneNumber: number, order: number) {
  const alphabet = numberToAlphabet(order);

  return `${laneNumber}${alphabet}`;
}
