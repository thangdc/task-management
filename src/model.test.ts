import { describe, expect, it } from "vitest";
import { isDateKey, loadTasks, normalizeTask, shiftDate, taskProgress } from "./model";

describe("date-only helpers", () => {
  it("validates real calendar dates", () => {
    expect(isDateKey("2026-10-15")).toBe(true);
    expect(isDateKey("2026-02-30")).toBe(false);
    expect(isDateKey("15-10-2026")).toBe(false);
  });

  it("shifts dates across month and year boundaries", () => {
    expect(shiftDate("2026-10-31", 1)).toBe("2026-11-01");
    expect(shiftDate("2026-12-31", 1)).toBe("2027-01-01");
  });
});

describe("task normalization", () => {
  it("trims titles, clamps progress, and preserves date-only fields", () => {
    const task = normalizeTask({
      id: "t1", title: "  Plan sprint  ", startDate: "2026-10-15", dueDate: "2026-10-18", progress: 120
    }, "2026-10-15T08:00:00.000Z");
    expect(task.title).toBe("Plan sprint");
    expect(task.progress).toBe(100);
    expect(task.startDate).toBe("2026-10-15");
    expect(task.dueDate).toBe("2026-10-18");
  });

  it("preserves optional estimate and actual effort values", () => {
    const task = normalizeTask({
      id: "effort", title: "Estimate task", estimateHours: 2.5, actualHours: 3
    }, "2026-11-05T08:00:00.000Z");
    expect(task.estimateHours).toBe(2.5);
    expect(task.actualHours).toBe(3);
  });

  it("keeps blank effort unset and removes invalid negative or non-finite values", () => {
    const task = normalizeTask({
      id: "effort-invalid", title: "Invalid effort", estimateHours: -1, actualHours: Number.NaN
    }, "2026-11-05T08:00:00.000Z");
    expect(task.estimateHours).toBeUndefined();
    expect(task.actualHours).toBeUndefined();
    const legacy = normalizeTask({ id: "legacy", title: "Old task" }, "2026-11-05T08:00:00.000Z");
    expect(legacy.estimateHours).toBeUndefined();
    expect(legacy.actualHours).toBeUndefined();
  });

  it("forces completed tasks to 100 percent", () => {
    expect(taskProgress("done", 12)).toBe(100);
    expect(taskProgress("in-progress", -10)).toBe(0);
  });

  it("returns an empty list for malformed storage and filters invalid rows", () => {
    expect(loadTasks("{not json")).toEqual([]);
    expect(loadTasks(JSON.stringify([{ id: "ok", title: "Valid" }, { id: 3, title: "Bad" }, { id: "blank", title: " " }]))).toHaveLength(1);
  });
});