import { useEffect, useMemo, useRef, useState } from "react";
import {
  Activity, ArrowDownUp, CalendarDays, Check, ChevronDown, CircleHelp, Clock3,
  Command, Download, LayoutDashboard, ListTodo, Plus, Search, Settings2,
  Sparkles, Target, Trash2, TrendingUp, X
} from "lucide-react";
import Gantt from "frappe-gantt";
import type { FrappeTask } from "frappe-gantt";
import { loadTasks, normalizeTask, shiftDate, STORAGE_KEY, taskProgress, toDateKey, type Task, type TaskPriority, type TaskStatus } from "./model";

const today = toDateKey(new Date());
const day = (offset: number) => shiftDate(today, offset);
const initialTasks: Task[] = [
  { id: "task-1", title: "Review sprint priorities", notes: "Decide the three outcomes that matter most this week.", status: "in-progress", priority: "high", startDate: day(-1), dueDate: day(0), progress: 65, createdAt: today, updatedAt: today },
  { id: "task-2", title: "Ship task timeline foundation", notes: "Build a reliable view of the work ahead.", status: "in-progress", priority: "high", startDate: day(-2), dueDate: day(2), progress: 42, createdAt: today, updatedAt: today },
  { id: "task-3", title: "Clean up project notes", notes: "Capture decisions and follow-up items.", status: "todo", priority: "medium", startDate: day(0), dueDate: day(1), progress: 0, createdAt: today, updatedAt: today },
  { id: "task-4", title: "Prepare weekly update", notes: "Summarize progress, risks and next steps.", status: "todo", priority: "low", startDate: day(1), dueDate: day(4), progress: 0, createdAt: today, updatedAt: today },
  { id: "task-5", title: "Plan next learning block", notes: "Reserve a focused hour for technical learning.", status: "done", priority: "medium", startDate: day(-4), dueDate: day(-2), progress: 100, createdAt: today, updatedAt: today }
];

type View = "overview" | "timeline" | "tasks";
const statusLabel: Record<TaskStatus, string> = { todo: "To do", "in-progress": "In progress", done: "Completed" };
const priorityLabel: Record<TaskPriority, string> = { low: "Low", medium: "Medium", high: "High" };
const shortDate = (date: string) => new Date(`${date}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" });

function readInitialTasks(): Task[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) return loadTasks(stored);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initialTasks));
  } catch {
    // The app remains usable in-memory when browser storage is blocked.
  }
  return initialTasks;
}

function App() {
  const [tasks, setTasks] = useState<Task[]>(readInitialTasks);
  const [view, setView] = useState<View>("overview");
  const [query, setQuery] = useState("");
  const [showComposer, setShowComposer] = useState(false);
  const [draftTitle, setDraftTitle] = useState("");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [notice, setNotice] = useState("");
  const [timelineMode, setTimelineMode] = useState("Week");
  const ganttHost = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks)); }
    catch { setNotice("Browser storage is unavailable — changes may not survive a refresh."); }
  }, [tasks]);

  const filtered = useMemo(() => tasks.filter(task => task.title.toLowerCase().includes(query.toLowerCase())), [tasks, query]);
  const activeTasks = tasks.filter(task => task.status !== "done");
  const dueToday = activeTasks.filter(task => task.dueDate <= today);
  const completed = tasks.filter(task => task.status === "done").length;
  const completion = tasks.length ? Math.round(completed / tasks.length * 100) : 0;
  const upcoming = [...filtered].filter(task => task.status !== "done").sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const updateTask = (id: string, changes: Partial<Task>) => setTasks(current => current.map(task => task.id === id ? normalizeTask({ ...task, ...changes, updatedAt: new Date().toISOString() }) : task));

  useEffect(() => {
    if (view !== "timeline" || !ganttHost.current) return;
    const host = ganttHost.current;
    host.replaceChildren();
    if (!filtered.length) return;
    const rows: FrappeTask[] = filtered.map(task => ({
      id: task.id, name: task.title, start: task.startDate, end: task.dueDate,
      progress: taskProgress(task.status, task.progress),
      custom_class: task.status === "done" ? "task-done" : task.priority === "high" ? "task-high" : "task-default"
    }));
    try {
      new Gantt(host, rows, {
        view_mode: timelineMode,
        date_format: "YYYY-MM-DD",
        language: "en",
        on_click: (row) => {
          const task = tasks.find(item => item.id === row.id);
          if (task) setSelectedTask(task);
        },
        on_date_change: (row, start, end) => {
          updateTask(row.id, { startDate: toDateKey(start), dueDate: toDateKey(end) });
        },
        on_progress_change: (row, progress) => updateTask(row.id, { progress: taskProgress("in-progress", progress), status: progress >= 100 ? "done" : "in-progress" })
      });
    } catch {
      setNotice("The timeline could not be rendered. Your task data is still safe.");
    }
  }, [view, filtered, timelineMode]);

  const addTask = () => {
    const title = draftTitle.trim();
    if (!title) return;
    const task = normalizeTask({ id: crypto.randomUUID(), title, startDate: today, dueDate: day(1), status: "todo", priority: "medium", progress: 0 });
    setTasks(current => [task, ...current]);
    setDraftTitle("");
    setShowComposer(false);
    setView("tasks");
    setNotice("Task added");
  };

  const exportTasks = () => {
    const blob = new Blob([JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), tasks }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url; link.download = "task-management-backup.json"; link.click();
    URL.revokeObjectURL(url);
    setNotice("Backup exported");
  };

  const navItems: { id: View; label: string; icon: typeof LayoutDashboard }[] = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "timeline", label: "Gantt timeline", icon: Activity },
    { id: "tasks", label: "All tasks", icon: ListTodo }
  ];

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#" onClick={event => { event.preventDefault(); setView("overview"); }}>
          <span className="brand-mark"><Command size={20} strokeWidth={2.5} /></span>
          <span>taskflow<span className="brand-dot">.</span><small>PERSONAL WORKSPACE</small></span>
        </a>
        <div className="workspace-switch"><span className="workspace-avatar">T</span><span><strong>My workspace</strong><small>Personal plan</small></span><ChevronDown size={15} /></div>
        <p className="nav-caption">WORKSPACE</p>
        <nav className="primary-nav" aria-label="Main navigation">
          {navItems.map(item => <button key={item.id} className={view === item.id ? "nav-item active" : "nav-item"} onClick={() => setView(item.id)}><item.icon size={18} /><span>{item.label}</span>{item.id === "tasks" && <span className="nav-count">{tasks.length}</span>}</button>)}
        </nav>
        <p className="nav-caption section-caption">FOCUS</p>
        <button className="nav-item" onClick={() => { setView("tasks"); setQuery(""); }}><Target size={18} /><span>Priority tasks</span><span className="nav-count">{tasks.filter(task => task.priority === "high" && task.status !== "done").length}</span></button>
        <button className="nav-item" onClick={() => { setView("tasks"); setQuery(""); }}><CalendarDays size={18} /><span>Upcoming</span></button>
        <div className="sidebar-bottom">
          <div className="storage-card"><span className="storage-icon"><Sparkles size={16} /></span><strong>Made for focus</strong><p>Your tasks stay in this browser. No account needed.</p><button onClick={exportTasks}><Download size={14} /> Export backup</button></div>
          <button className="nav-item muted-nav" onClick={() => setNotice("Settings and cloud sync are planned for a later milestone.")}><Settings2 size={18} /><span>Settings</span></button>
          <button className="nav-item muted-nav" onClick={() => setNotice("Tip: use the Gantt timeline to adjust task dates and progress visually.")}><CircleHelp size={18} /><span>Help & tips</span></button>
          <div className="profile-row"><span className="profile-avatar">T</span><span><strong>Thang's workspace</strong><small>Local mode</small></span><span className="online-dot" /></div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="breadcrumb">Workspace <span>/</span> <strong>{navItems.find(item => item.id === view)?.label}</strong></div>
          <div className="top-actions"><span className="local-pill"><span /> Local mode</span><button className="icon-button" aria-label="Export backup" title="Export backup" onClick={exportTasks}><Download size={17} /></button><button className="avatar-button" aria-label="Workspace menu">T</button></div>
        </header>

        <div className="page-content">
          <section className="welcome-row">
            <div><div className="eyebrow"><span className="eyebrow-line" /> YOUR PERSONAL COMMAND CENTER</div><h1>{view === "overview" ? "Make space for what matters." : view === "timeline" ? "See the work ahead." : "Every task, in one place."}</h1><p>{view === "overview" ? "A clearer plan starts with one small step." : view === "timeline" ? "Move tasks through time. Keep your plan realistic." : "Capture it, prioritize it, then make progress."}</p></div>
            <button className="primary-button" onClick={() => setShowComposer(value => !value)}><Plus size={18} /> New task</button>
          </section>

          {showComposer && <form className="quick-add" onSubmit={event => { event.preventDefault(); addTask(); }}><span className="quick-add-icon"><Plus size={18} /></span><input autoFocus value={draftTitle} onChange={event => setDraftTitle(event.target.value)} placeholder="What do you want to get done?" aria-label="New task title" /><button className="primary-button" type="submit">Add task</button><button className="icon-button" type="button" aria-label="Cancel adding task" onClick={() => setShowComposer(false)}><X size={17} /></button></form>}

          {notice && <div className="notice" role="status">{notice}<button aria-label="Dismiss notification" onClick={() => setNotice("")}><X size={14} /></button></div>}

          {view === "overview" && <>
            <div className="stat-grid">
              <article className="stat-card"><div className="stat-top"><span>Open tasks</span><span className="stat-icon purple"><ListTodo size={17} /></span></div><div className="stat-number">{activeTasks.length}<span className="stat-trend"><TrendingUp size={13} /> in progress</span></div><div className="stat-foot"><span className="tiny-bars"><i /><i /><i /><i /><i /><i /><i /></span><span>Keep your momentum</span></div></article>
              <article className="stat-card"><div className="stat-top"><span>Due today</span><span className="stat-icon orange"><Clock3 size={17} /></span></div><div className="stat-number">{dueToday.length}<span className="stat-sub">tasks need attention</span></div><div className="stat-foot"><span className="foot-dot orange-dot" />A good place to start</div></article>
              <article className="stat-card"><div className="stat-top"><span>Completed</span><span className="stat-icon green"><Check size={17} /></span></div><div className="stat-number">{completed}<span className="stat-sub">of {tasks.length} tasks</span></div><div className="progress-track"><span style={{ width: `${completion}%` }} /></div></article>
            </div>

            <div className="section-heading"><div><h2>Today's focus</h2><p>Start with the next meaningful thing.</p></div><button className="text-button" onClick={() => setView("tasks")}>View all tasks <ArrowDownUp size={14} /></button></div>
            <section className="focus-layout">
              <div className="task-panel">
                {upcoming.slice(0, 4).map(task => <TaskRow key={task.id} task={task} onToggle={() => updateTask(task.id, { status: task.status === "done" ? "todo" : "done", progress: task.status === "done" ? 0 : 100 })} onOpen={() => setSelectedTask(task)} />)}
                {upcoming.length === 0 && <EmptyState onAdd={() => setShowComposer(true)} />}
              </div>
              <aside className="focus-side">
                <div className="focus-side-heading"><span className="focus-side-icon"><Target size={17} /></span><div><strong>Weekly progress</strong><small>A little progress adds up</small></div></div>
                <div className="weekly-number">{completion}<span>%</span></div><div className="weekly-track"><span style={{ width: `${completion}%` }} /></div><p className="weekly-caption">{completed} of {tasks.length} tasks completed</p>
                <div className="focus-tip"><Sparkles size={16} /><p><strong>Keep it intentional</strong><br />Pick one high-impact task before opening another tab.</p></div>
              </aside>
            </section>

            <div className="section-heading timeline-heading"><div><h2>Project timeline</h2><p>A quick look at how your work fits together.</p></div><button className="text-button" onClick={() => setView("timeline")}>Open Gantt view <Activity size={15} /></button></div>
            <section className="mini-timeline"><div className="mini-timeline-art"><div className="mini-week-labels"><span>THIS WEEK</span><span>UP NEXT</span><span>LATER</span></div>{tasks.slice(0, 4).map((task, index) => <div className="mini-line" key={task.id}><span>{task.title}</span><div className="mini-track"><i style={{ left: `${index * 12}%`, width: `${18 + index * 5}%` }} className={index === 0 ? "mini-bar purple-bar" : index === 1 ? "mini-bar blue-bar" : index === 2 ? "mini-bar green-bar" : "mini-bar orange-bar"} /></div></div>)}</div></section>
          </>}

          {view === "tasks" && <><div className="toolbar"><div className="search-box"><Search size={17} /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search tasks..." aria-label="Search tasks" /><kbd>⌘ K</kbd></div><span className="toolbar-count">{filtered.length} tasks</span></div><section className="all-tasks-panel"><div className="all-tasks-header"><span>Task</span><span>Priority</span><span>Due date</span><span>Status</span><span /></div>{filtered.map(task => <TaskTableRow key={task.id} task={task} onOpen={() => setSelectedTask(task)} onToggle={() => updateTask(task.id, { status: task.status === "done" ? "todo" : "done", progress: task.status === "done" ? 0 : 100 })} onDelete={() => setTasks(current => current.filter(item => item.id !== task.id))} />)}{filtered.length === 0 && <EmptyState onAdd={() => setShowComposer(true)} />}</section></>}

          {view === "timeline" && <><div className="timeline-toolbar"><div><span className="timeline-live-dot" /> <strong>Live plan</strong><span className="timeline-count">{filtered.length} tasks on timeline</span></div><div className="view-switch" aria-label="Timeline scale">{["Day", "Week", "Month"].map(mode => <button key={mode} className={timelineMode === mode ? "selected" : ""} onClick={() => setTimelineMode(mode)}>{mode}</button>)}</div></div><section className="gantt-panel"><div className="gantt-panel-heading"><div><h2>Work timeline</h2><p>Drag a task bar to adjust dates, or drag its end to change duration.</p></div><span className="timeline-legend"><i className="legend-purple" /> High priority <i className="legend-blue" /> Planned</span></div>{filtered.length ? <div className="gantt-scroll"><div ref={ganttHost} className="gantt-host" /></div> : <EmptyState onAdd={() => setShowComposer(true)} />}</section><p className="timeline-note"><Sparkles size={15} /> Changes made on the timeline are saved locally as you work.</p></>}

          <footer className="page-footer"><span>© 2026 Taskflow <span className="footer-separator">·</span> Built for focused work</span><span><span className="footer-status" /> Your changes are saved in this browser</span></footer>
        </div>
      </main>

      {selectedTask && <TaskEditor task={selectedTask} onClose={() => setSelectedTask(null)} onSave={changes => { updateTask(selectedTask.id, changes); setSelectedTask(null); }} />}
    </div>
  );
}

function TaskRow({ task, onToggle, onOpen }: { task: Task; onToggle: () => void; onOpen: () => void }) {
  return <article className="task-row"><button className={task.status === "done" ? "task-check checked" : "task-check"} aria-label={task.status === "done" ? `Reopen ${task.title}` : `Complete ${task.title}`} onClick={onToggle}>{task.status === "done" && <Check size={13} />}</button><button className="task-title-button" onClick={onOpen}><strong className={task.status === "done" ? "completed-title" : ""}>{task.title}</strong><small>{task.notes || "No notes yet"}</small></button><span className={`priority-tag priority-${task.priority}`}><i />{priorityLabel[task.priority]}</span><span className="due-date"><CalendarDays size={14} />{shortDate(task.dueDate)}</span></article>;
}

function TaskTableRow({ task, onOpen, onToggle, onDelete }: { task: Task; onOpen: () => void; onToggle: () => void; onDelete: () => void }) {
  return <div className="task-table-row"><div className="table-task-cell"><button className={task.status === "done" ? "task-check checked" : "task-check"} aria-label={task.status === "done" ? `Reopen ${task.title}` : `Complete ${task.title}`} onClick={onToggle}>{task.status === "done" && <Check size={13} />}</button><button className="table-task-title" onClick={onOpen}><strong>{task.title}</strong><small>{task.notes || "No notes yet"}</small></button></div><span className={`priority-tag priority-${task.priority}`}><i />{priorityLabel[task.priority]}</span><span className="table-due">{shortDate(task.dueDate)}</span><span className={`status-tag status-${task.status}`}>{statusLabel[task.status]}</span><button className="row-delete" aria-label={`Delete ${task.title}`} onClick={onDelete}><Trash2 size={15} /></button></div>;
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return <div className="empty-state"><span><ListTodo size={22} /></span><h3>Nothing on your list yet</h3><p>Add a task to give your next step a home.</p><button className="primary-button" onClick={onAdd}><Plus size={16} /> Add your first task</button></div>;
}

function TaskEditor({ task, onClose, onSave }: { task: Task; onClose: () => void; onSave: (changes: Partial<Task>) => void }) {
  const [title, setTitle] = useState(task.title);
  const [notes, setNotes] = useState(task.notes);
  const [status, setStatus] = useState<TaskStatus>(task.status);
  const [priority, setPriority] = useState<TaskPriority>(task.priority);
  const [startDate, setStartDate] = useState(task.startDate);
  const [dueDate, setDueDate] = useState(task.dueDate);
  return <div className="modal-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}><form className="task-editor" onSubmit={event => { event.preventDefault(); if (!title.trim()) return; onSave({ title: title.trim(), notes, status, priority, startDate, dueDate: dueDate < startDate ? startDate : dueDate, progress: status === "done" ? 100 : task.progress }); }}><header><div><span className="editor-eyebrow">TASK DETAILS</span><h2>Edit task</h2></div><button className="icon-button" type="button" aria-label="Close editor" onClick={onClose}><X size={18} /></button></header><label>Task name<input required autoFocus value={title} onChange={event => setTitle(event.target.value)} /></label><label>Notes<textarea rows={3} value={notes} onChange={event => setNotes(event.target.value)} placeholder="Add context or a next step..." /></label><div className="editor-two-col"><label>Start date<input type="date" value={startDate} onChange={event => setStartDate(event.target.value)} required /></label><label>Due date<input type="date" min={startDate} value={dueDate} onChange={event => setDueDate(event.target.value)} required /></label></div><div className="editor-two-col"><label>Priority<select value={priority} onChange={event => setPriority(event.target.value as TaskPriority)}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></label><label>Status<select value={status} onChange={event => setStatus(event.target.value as TaskStatus)}><option value="todo">To do</option><option value="in-progress">In progress</option><option value="done">Completed</option></select></label></div><footer><button type="button" className="secondary-button" onClick={onClose}>Cancel</button><button type="submit" className="primary-button"><Check size={16} /> Save changes</button></footer></form></div>;
}

export default App;