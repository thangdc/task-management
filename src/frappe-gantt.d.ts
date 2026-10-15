declare module "frappe-gantt" {
  export interface FrappeTask {
    id: string;
    name: string;
    start: string;
    end: string;
    progress: number;
    dependencies?: string;
    custom_class?: string;
  }
  export interface FrappeGanttOptions {
    view_mode?: string;
    date_format?: string;
    language?: string;
    on_click?: (task: FrappeTask) => void;
    on_date_change?: (task: FrappeTask, start: Date, end: Date) => void;
    on_progress_change?: (task: FrappeTask, progress: number) => void;
    on_view_change?: (mode: string) => void;
  }
  export default class Gantt {
    constructor(target: HTMLElement | string, tasks: FrappeTask[], options?: FrappeGanttOptions);
    change_view_mode(mode: string): void;
  }
}