export interface GanttPointerPoint {
  x: number;
  y: number;
}

export function isGanttDragGesture(
  start: GanttPointerPoint | null,
  end: GanttPointerPoint,
  threshold = 10
): boolean {
  if (!start) return false;
  return Math.abs(end.x - start.x) > threshold;
}
