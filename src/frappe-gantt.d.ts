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

  export interface FrappeViewMode {
    name: string;
    padding?: string;
    step: string;
    date_format?: string;
    column_width?: number;
    lower_text?: string | ((currentDate: Date, previousDate: Date | null, language: string) => string);
    upper_text?: string | ((currentDate: Date, previousDate: Date | null, language: string) => string);
    upper_text_frequency?: number;
    thick_line?: (currentDate: Date) => boolean;
    snap_at?: string;
  }

  export type FrappeHolidayDate = string | Date | { date: string | Date; label?: string };
  export type FrappeHolidayDefinition = "weekend" | FrappeHolidayDate[];

  export interface FrappeGanttOptions {
    view_mode?: string;
    view_modes?: FrappeViewMode[];
    date_format?: string;
    language?: string;
    holidays?: Record<string, FrappeHolidayDefinition>;
    is_weekend?: (date: Date) => boolean;
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
