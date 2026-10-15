export type TaskStatus = "todo" | "in-progress" | "done";
export type TaskPriority = "low" | "medium" | "high";

export interface Task {
  id: string;
  title: string;
  notes: string;
  status: TaskStatus;
  priority: TaskPriority;
  startDate: string;
  dueDate: string;
  progress: number;
  createdAt: string;
  updatedAt: string;
}

export const STORAGE_KEY = "task-management.tasks.v1";

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
      if (!value || typeof value !== "object" || typeof value.id !== "string" || typeof value.title !== "string" || !value.title.trim()) return [];
      return [normalizeTask(value as Partial<Task> & Pick<Task, "id" | "title">)];
    });
  } catch {
    return [];
  }
}

export function taskProgress(status: TaskStatus, progress: number): number {
  return status === "done" ? 100 : Math.max(0, Math.min(100, Math.round(progress)));
}