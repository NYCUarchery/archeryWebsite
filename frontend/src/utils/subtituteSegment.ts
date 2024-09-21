export default function subtituteSegment(
  path: string,
  segmentIndex: number,
  newSegment: string
) {
  return path
    .split("/")
    .map((segment, index) => {
      if (index === segmentIndex) {
        return newSegment;
      }
      return segment;
    })
    .join("/");
}
