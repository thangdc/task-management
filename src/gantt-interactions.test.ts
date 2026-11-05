import { describe, expect, it } from "vitest";
import { isGanttDragGesture } from "./gantt-interactions";

describe("Gantt drag gesture detection", () => {
  it("does not classify a normal click or small pointer movement as a drag", () => {
    expect(isGanttDragGesture({ x: 10, y: 10 }, { x: 10, y: 10 })).toBe(false);
    expect(isGanttDragGesture({ x: 10, y: 10 }, { x: 16, y: 13 })).toBe(false);
  });

  it("classifies movement beyond the drag threshold as a drag", () => {
    expect(isGanttDragGesture({ x: 10, y: 10 }, { x: 25, y: 10 })).toBe(true);
    expect(isGanttDragGesture({ x: 10, y: 10 }, { x: 10, y: 25 })).toBe(false);
  });

  it("does not classify a missing start point as a drag", () => {
    expect(isGanttDragGesture(null, { x: 100, y: 100 })).toBe(false);
  });
});
