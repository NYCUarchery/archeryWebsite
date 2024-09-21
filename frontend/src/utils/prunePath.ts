export default function prunePath(
  path: string,
  segmentsToKeep: number
): string {
  const segments = path.split("/");
  return segments.slice(0, segmentsToKeep).join("/");
}
