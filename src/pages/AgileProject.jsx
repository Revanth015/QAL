import { useEffect, useMemo, useState } from "react";
import Layout from "../components/Layout";
import { createAgileProject, createAgileTask, deleteAgileTask, getAgileProjects, updateAgileProject, updateAgileTask } from "../services/agileService";

const columns = ["backlog", "in_progress", "review", "done"];
const labels = { backlog: "Backlog", in_progress: "In Progress", review: "Review", done: "Done" };

export default function AgileProject() {
  const [projects, setProjects] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [newTask, setNewTask] = useState("");

  async function refresh(selectId) {
    try {
      setError("");
      const data = await getAgileProjects();
      setProjects(data);
      setSelected(data.find((p) => p.id === (selectId ?? selected?.id)) || data[0] || null);
    } catch (e) { setError(e.message || "Unable to load Agile workspace."); }
    finally { setLoading(false); }
  }
  useEffect(() => { refresh(); }, []);

  async function addProject() {
    try { const p = await createAgileProject({ name: "New QAL Workstream", description: "Management workstream", status: "active" }); await refresh(p.id); }
    catch (e) { setError(e.message); }
  }
  async function addTask() {
    if (!selected || !newTask.trim()) return;
    try { await createAgileTask({ project_id: selected.id, title: newTask.trim() }); setNewTask(""); await refresh(selected.id); }
    catch (e) { setError(e.message); }
  }
  async function moveTask(task, status) {
    try { await updateAgileTask(task.id, { status }); await refresh(selected.id); }
    catch (e) { setError(e.message); }
  }
  async function removeTask(id) {
    if (!window.confirm("Delete this Agile task?")) return;
    try { await deleteAgileTask(id); await refresh(selected.id); } catch (e) { setError(e.message); }
  }

  const tasks = selected?.agile_tasks || [];
  const counts = useMemo(() => Object.fromEntries(columns.map((c) => [c, tasks.filter((t) => t.status === c).length])), [tasks]);
  const done = counts.done || 0;
  const total = tasks.length;
  const progress = total ? Math.round((done / total) * 100) : 0;

  return <Layout><div className="mx-auto max-w-7xl space-y-6">
    <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-semibold text-purple-600">Management View</p><h1 className="mt-1 text-3xl font-bold">QAL Agile Project Workspace</h1><p className="mt-2 max-w-3xl text-gray-500">A live simplified Agile board for management to see delivery progress, ownership and work moving from backlog to completion.</p></div><button onClick={addProject} className="rounded-lg bg-purple-600 px-4 py-2.5 font-semibold text-white">+ New Workstream</button></div>
    {error && <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</div>}
    {loading ? <div className="rounded-xl bg-white p-8 shadow text-gray-500">Loading Agile workspace...</div> : <>
      <section className="grid gap-4 sm:grid-cols-4"><Metric title="Workstreams" value={projects.length} detail="Live Supabase projects"/><Metric title="Tasks" value={total} detail="Current work items"/><Metric title="Completed" value={done} detail="Moved to Done"/><Metric title="Delivery" value={`${progress}%`} detail="Completion rate"/></section>
      <section className="rounded-xl bg-white p-5 shadow"><div className="flex flex-wrap gap-2">{projects.map((p) => <button key={p.id} onClick={() => setSelected(p)} className={`rounded-lg px-4 py-2 text-sm font-semibold ${selected?.id === p.id ? "bg-purple-600 text-white" : "bg-gray-100 text-gray-700"}`}>{p.name}</button>)}</div>{selected && <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t pt-4"><div><h2 className="text-xl font-bold">{selected.name}</h2><p className="text-sm text-gray-500">{selected.description}</p></div><span className="rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-700">{selected.status}</span></div>}</section>
      {selected && <><section className="rounded-xl bg-white p-5 shadow"><div className="flex gap-3"><input value={newTask} onChange={(e) => setNewTask(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addTask()} placeholder="Add a work item..." className="flex-1 rounded-lg border px-4 py-3"/><button onClick={addTask} className="rounded-lg bg-gray-900 px-5 py-3 font-semibold text-white">Add Task</button></div></section>
      <div className="grid gap-4 lg:grid-cols-4">{columns.map((status) => <section key={status} className="min-h-72 rounded-xl bg-gray-50 p-4"><div className="flex items-center justify-between"><h2 className="font-bold">{labels[status]}</h2><span className="rounded-full bg-white px-2 py-1 text-xs font-bold shadow-sm">{counts[status]}</span></div><div className="mt-4 space-y-3">{tasks.filter((t) => t.status === status).map((task) => <article key={task.id} className="rounded-lg bg-white p-4 shadow-sm"><div className="flex items-start justify-between gap-2"><h3 className="text-sm font-semibold text-gray-800">{task.title}</h3><button onClick={() => removeTask(task.id)} className="text-xs text-red-500">Delete</button></div><p className="mt-2 text-xs text-gray-500">Priority: {task.priority}</p><div className="mt-3 flex flex-wrap gap-1">{columns.filter((c) => c !== status).map((target) => <button key={target} onClick={() => moveTask(task, target)} className="rounded border px-2 py-1 text-[11px] text-gray-600">→ {labels[target]}</button>)}</div></article>)}</div></section>)}</div></>}
    </>}
  </div></Layout>;
}
function Metric({ title, value, detail }) { return <div className="rounded-xl bg-white p-5 shadow"><p className="text-sm text-gray-500">{title}</p><p className="mt-2 text-3xl font-bold text-purple-600">{value}</p><p className="mt-1 text-xs text-gray-400">{detail}</p></div>; }
