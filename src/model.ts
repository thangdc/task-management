export type TaskStatus = "todo" | "in-progress" | "done";
export type TaskPriority = "low" | "medium" | "high";
export type CalendarEntryType = "holiday" | "leave" | "other";

export interface CalendarEntry {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  type: CalendarEntryType;
}

export interface Task {
  id: string;
  title: string;
  notes: string;
  status: TaskStatus;
  priority: TaskPriority;
  startDate: string;
  dueDate: string;
  progress: number;
  estimateHours?: number;
  actualHours?: number;
  createdAt: string;
  updatedAt: string;
}

export const STORAGE_KEY = "task-management.tasks.v1";
export const CALENDAR_STORAGE_KEY = "task-management.calendar.v1";

export function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function shiftDate(dateKey: string, days: number): string {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + days);
  return toDateKey(date);
}

function normalizeOptionalHours(value: unknown): number | undefined {
  if (value === undefined || value === null || value === "" || (typeof value === "string" && !value.trim())) return undefined;
  const hours = typeof value === "number" ? value : Number(value);
  return Number.isFinite(hours) && hours >= 0 ? hours : undefined;
}

export function normalizeTask(task: Partial<Task> & Pick<Task, "id" | "title">, now = new Date().toISOString()): Task {
  const today = toDateKey(new Date(now));
  const startDate = isDateKey(task.startDate) ? task.startDate : today;
  const dueDate = isDateKey(task.dueDate) && task.dueDate >= startDate ? task.dueDate : startDate;
  const progress = Number.isFinite(task.progress) ? Math.max(0, Math.min(100, Number(task.progress))) : 0;
  const status = task.status === "done" || task.status === "in-progress" ? task.status : "todo";
  return {
    id: task.id,
    title: task.title.trim(),
    notes: task.notes ?? "",
    status,
    priority: task.priority === "high" || task.priority === "low" ? task.priority : "medium",
    startDate,
    dueDate,
    progress: status === "done" ? 100 : progress,
    estimateHours: normalizeOptionalHours(task.estimateHours),
    actualHours: normalizeOptionalHours(task.actualHours),
    createdAt: task.createdAt ?? now,
    updatedAt: task.updatedAt ?? now
  };
}

export function isDateKey(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

export function loadTasks(raw: string | null): Task[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.flatMap((value): Task[] => {
      if (!value || typeof value !== "object") return [];
      const row = value as Record<string, unknown>;
      if (typeof row.id !== "string" || typeof row.title !== "string" || !row.title.trim()) return [];
      return [normalizeTask(row as Partial<Task> & Pick<Task, "id" | "title">)];
    });
  } catch {
    return [];
  }
}

export function taskProgress(status: TaskStatus, progress: number): number {
  return status === "done" ? 100 : Math.max(0, Math.min(100, Math.round(progress)));
}

/** Progress is based on recorded effort whenever both estimate and actual are available. */
export function taskProgressFromEffort(
  status: TaskStatus,
  progress: number,
  estimateHours?: number,
  actualHours?: number
): number {
  if (status === "done") return 100;
  if (
    estimateHours !== undefined && estimateHours > 0 &&
    actualHours !== undefined &&
    Number.isFinite(estimateHours) && Number.isFinite(actualHours) &&
    estimateHours >= 0 && actualHours >= 0
  ) {
    return Math.max(0, Math.min(100, Math.round(actualHours / estimateHours * 100)));
  }
  return taskProgress(status, progress);
}

/** Counts inclusive working days using an 8-hour day (08:00–12:00, 13:00–17:00). */
export function calculateWorkingHours(
  startDate: string,
  endDate: string,
  calendarEntries: CalendarEntry[] = []
): number {
  if (!isDateKey(startDate) || !isDateKey(endDate) || endDate < startDate) return 0;
  let hours = 0;
  for (let date = startDate; date <= endDate; date = shiftDate(date, 1)) {
    const weekday = new Date(`${date}T12:00:00`).getDay();
    const weekend = weekday === 0 || weekday === 6;
    const dayOff = calendarEntries.some(entry =>
      (entry.type === "holiday" || entry.type === "leave" || entry.type === "other") &&
      date >= entry.startDate && date <= entry.endDate
    );
    if (!weekend && !dayOff) hours += 8;
  }
  return hours;
}

export function normalizeCalendarEntry(value: unknown): CalendarEntry | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  if (typeof row.id !== "string" || typeof row.name !== "string" || !row.name.trim()) return null;
  if (!isDateKey(row.startDate) || !isDateKey(row.endDate) || row.endDate < row.startDate) return null;
  if (row.type !== "holiday" && row.type !== "leave" && row.type !== "other") return null;
  return {
    id: row.id,
    name: row.name.trim(),
    startDate: row.startDate,
    endDate: row.endDate,
    type: row.type
  };
}

export function loadCalendarEntries(raw: string | null): CalendarEntry[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.flatMap((value): CalendarEntry[] => {
      const entry = normalizeCalendarEntry(value);
      return entry ? [entry] : [];
    });
  } catch {
    return [];
  }
}


export interface CalendarMarker {
  date: string;
  name: string;
}

export function expandCalendarEntries(entries: CalendarEntry[]): Record<CalendarEntryType, CalendarMarker[]> {
  const markers: Record<CalendarEntryType, CalendarMarker[]> = {
    holiday: [],
    leave: [],
    other: []
  };
  for (const entry of entries) {
    for (let date = entry.startDate; date <= entry.endDate; date = shiftDate(date, 1)) {
      markers[entry.type].push({ date, name: entry.name });
    }
  }
  return markers;
}


export function effortVariance(estimateHours?: number, actualHours?: number): number | undefined {
  if (estimateHours === undefined || actualHours === undefined) return undefined;
  if (!Number.isFinite(estimateHours) || !Number.isFinite(actualHours) || estimateHours < 0 || actualHours < 0) return undefined;
  return actualHours - estimateHours;
}

export interface TaskManagementBackup {
  version: 2;
  exportedAt: string;
  tasks: Task[];
  calendarEntries: CalendarEntry[];
}

export function createBackupPayload(
  tasks: Task[],
  calendarEntries: CalendarEntry[],
  exportedAt = new Date().toISOString()
): TaskManagementBackup {
  return { version: 2, exportedAt, tasks, calendarEntries };
}
