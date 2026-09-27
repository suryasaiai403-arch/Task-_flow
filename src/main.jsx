import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

const STORAGE_KEY = "task-flow-tasks";

const seedTasks = [
  { id: crypto.randomUUID(), title: "Plan project structure", description: "Create reusable components and a clean folder structure.", priority: "High", dueDate: "", completed: true },
  { id: crypto.randomUUID(), title: "Build task form", description: "Add validation and helpful error messages.", priority: "Medium", dueDate: "", completed: false },
  { id: crypto.randomUUID(), title: "Test the dashboard", description: "Verify filtering, editing, deleting and persistence.", priority: "Low", dueDate: "", completed: false }
];

function useTaskStore() {
  const [tasks, setTasks] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : seedTasks;
    } catch {
      return seedTasks;
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }, [tasks]);

  const addTask = (task) => setTasks((current) => [{ ...task, id: crypto.randomUUID() }, ...current]);
  const updateTask = (id, changes) => setTasks((current) => current.map((task) => task.id === id ? { ...task, ...changes } : task));
  const toggleTask = (id) => setTasks((current) => current.map((task) => task.id === id ? { ...task, completed: !task.completed } : task));
  const deleteTask = (id) => setTasks((current) => current.filter((task) => task.id !== id));
  return { tasks, addTask, updateTask, toggleTask, deleteTask };
}

function Header({ completed, total }) {
  return (
    <header className="topbar">
      <div className="brand"><span className="brand-mark">✓</span><span>Task Flow</span></div>
      <div className="progress-text">{completed} of {total} completed</div>
    </header>
  );
}

function Stats({ tasks }) {
  const completed = tasks.filter((task) => task.completed).length;
  const open = tasks.length - completed;
  const high = tasks.filter((task) => task.priority === "High" && !task.completed).length;
  return (
    <section className="stats-grid">
      <div className="stat-card"><span>Total tasks</span><strong>{tasks.length}</strong></div>
      <div className="stat-card"><span>In progress</span><strong>{open}</strong></div>
      <div className="stat-card"><span>Completed</span><strong>{completed}</strong></div>
      <div className="stat-card"><span>High priority</span><strong>{high}</strong></div>
    </section>
  );
}

function TaskForm({ onAdd }) {
  const [form, setForm] = useState({ title: "", description: "", priority: "Medium", dueDate: "" });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const next = {};
    if (!form.title.trim()) next.title = "Task title is required.";
    else if (form.title.trim().length < 3) next.title = "Use at least 3 characters.";
    if (form.description.length > 200) next.description = "Keep the description under 200 characters.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = (event) => {
    event.preventDefault();
    if (!validate()) return;
    onAdd({ ...form, title: form.title.trim(), description: form.description.trim(), completed: false });
    setForm({ title: "", description: "", priority: "Medium", dueDate: "" });
    setErrors({});
  };

  return (
    <form className="panel form-panel" onSubmit={submit} noValidate>
      <div className="panel-heading">
        <div><h2>Add a task</h2><p>Create a task with a priority and optional deadline.</p></div>
      </div>
      <label>Task title<input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Finish project report" aria-invalid={Boolean(errors.title)} />{errors.title && <small className="error">{errors.title}</small>}</label>
      <label>Description<textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Add useful details..." rows="3" />{errors.description && <small className="error">{errors.description}</small>}</label>
      <div className="form-row">
        <label>Priority<select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}><option>Low</option><option>Medium</option><option>High</option></select></label>
        <label>Due date<input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} /></label>
      </div>
      <button className="primary-btn" type="submit">+ Add task</button>
    </form>
  );
}

function TaskCard({ task, onToggle, onDelete, onEdit }) {
  return (
    <article className={`task-card ${task.completed ? "completed" : ""}`}>
      <button className="check-btn" onClick={() => onToggle(task.id)} aria-label={task.completed ? "Mark task active" : "Mark task complete"}>{task.completed ? "✓" : ""}</button>
      <div className="task-main">
        <div className="task-title-row"><h3>{task.title}</h3><span className={`priority ${task.priority.toLowerCase()}`}>{task.priority}</span></div>
        {task.description && <p>{task.description}</p>}
        {task.dueDate && <small>Due {new Date(task.dueDate + "T00:00:00").toLocaleDateString()}</small>}
      </div>
      <div className="task-actions"><button onClick={() => onEdit(task)} aria-label="Edit task">Edit</button><button className="delete-btn" onClick={() => onDelete(task.id)} aria-label="Delete task">Delete</button></div>
    </article>
  );
}

function TaskList({ tasks, onToggle, onDelete, onEdit }) {
  if (!tasks.length) return <div className="empty-state"><div className="empty-icon">✓</div><h3>No tasks here</h3><p>Try another filter or add a new task.</p></div>;
  return <div className="task-list">{tasks.map((task) => <TaskCard key={task.id} task={task} onToggle={onToggle} onDelete={onDelete} onEdit={onEdit} />)}</div>;
}

function App() {
  const { tasks, addTask, updateTask, toggleTask, deleteTask } = useTaskStore();
  const [filter, setFilter] = useState("All");
  const [editing, setEditing] = useState(null);

  const filtered = useMemo(() => tasks.filter((task) => filter === "All" || (filter === "Active" ? !task.completed : task.completed)), [tasks, filter]);
  const completed = tasks.filter((task) => task.completed).length;

  const editTask = (task) => {
    const title = window.prompt("Edit task title:", task.title);
    if (title === null) return;
    if (!title.trim()) return window.alert("Task title cannot be empty.");
    updateTask(task.id, { title: title.trim() });
    setEditing(task.id);
    setTimeout(() => setEditing(null), 250);
  };

  return (
    <div className="app-shell">
      <Header completed={completed} total={tasks.length} />
      <main className="container">
        <div className="hero"><div><p className="eyebrow">PERSONAL PRODUCTIVITY</p><h1>Get things done, <span>one task at a time.</span></h1><p className="subtitle">Organize your work, track progress, and keep your day moving.</p></div></div>
        <Stats tasks={tasks} />
        <div className="content-grid">
          <TaskForm onAdd={addTask} />
          <section className="panel tasks-panel">
            <div className="panel-heading">
              <div><h2>Your tasks</h2><p>{tasks.length} task{tasks.length === 1 ? "" : "s"} in your workspace.</p></div>
              <div className="filters">{["All", "Active", "Completed"].map((item) => <button key={item} className={filter === item ? "filter active" : "filter"} onClick={() => setFilter(item)}>{item}</button>)}</div>
            </div>
            <TaskList tasks={filtered} onToggle={toggleTask} onDelete={deleteTask} onEdit={editTask} />
          </section>
        </div>
        <footer>Task Flow • Built with React, reusable components, validation and state management.</footer>
      </main>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<React.StrictMode><App /></React.StrictMode>);