import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { getMissions } from "../services/missionService";
import { createEvent, deleteEvent, getEvents, saveEvent } from "../services/eventStore";

export default function AdminEvents() {
  const [events, setEvents] = useState([]);
  const [missions, setMissions] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [saving, setSaving] = useState(false);
  const selected = events.find((event) => event.id === selectedId) || null;

  async function load() { setEvents(await getEvents()); setMissions(await getMissions()); }
  useEffect(() => { load(); }, []);
  function edit(event) { setSelectedId(event.id); }
  function update(key, value) { setEvents((items) => items.map((event) => event.id === selectedId ? { ...event, [key]: value } : event)); }
  function updateStage(index, key, value) {
    setEvents((items) => items.map((event) => event.id === selectedId ? { ...event, stages: event.stages.map((stage, i) => i === index ? { ...stage, [key]: value } : stage) } : event));
  }
  function addStage() {
    setEvents((items) => items.map((event) => event.id === selectedId ? { ...event, stages: [...event.stages, { id: event.stages.length + 1, title: `Stage ${event.stages.length + 1}`, missionId: null, mission: "Select a mission", xp: 100 }] } : event));
  }
  async function save() { setSaving(true); await saveEvent(selected); await load(); setSaving(false); }
  async function addEvent() { const event = await createEvent(); await load(); setSelectedId(event.id); }
  async function removeEvent() { if (!selected || !window.confirm(`Delete ${selected.title}?`)) return; await deleteEvent(selected.id); setSelectedId(null); await load(); }

  return <Layout><div className="mx-auto max-w-7xl space-y-6">
    <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-semibold text-purple-600">Admin · Events</p><h1 className="text-3xl font-bold text-gray-900">Season Event Management</h1><p className="mt-2 text-gray-500">Create a large-stage event, choose the exact mission for every stage, and control the story shown to students.</p></div><button onClick={addEvent} className="rounded-lg bg-purple-600 px-4 py-2.5 font-semibold text-white">+ New Event</button></div>
    <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
      <aside className="space-y-3">{events.map((event) => <button key={event.id} onClick={() => edit(event)} className={`w-full rounded-xl bg-white p-4 text-left shadow ${selectedId === event.id ? "ring-2 ring-purple-500" : ""}`}><p className="text-xs font-bold text-purple-600">{event.season}</p><p className="mt-1 font-bold">{event.title}</p><p className="mt-1 text-xs text-gray-400">{event.status} · {event.stages.length} stages</p></button>)}</aside>
      {selected ? <main className="rounded-xl bg-white p-6 shadow space-y-6"><div className="grid gap-4 md:grid-cols-2"><Field label="Season" value={selected.season} onChange={(v) => update("season", v)} /><Field label="Title" value={selected.title} onChange={(v) => update("title", v)} /><Field label="Theme" value={selected.theme} onChange={(v) => update("theme", v)} /><label className="text-sm font-medium">Status<select value={selected.status} onChange={(e) => update("status", e.target.value)} className="mt-1 w-full rounded-lg border p-2.5"><option>draft</option><option>upcoming</option><option>active</option><option>completed</option></select></label></div><Field label="Event description" value={selected.description} onChange={(v) => update("description", v)} /><Field label="Season completion badge" value={selected.badge} onChange={(v) => update("badge", v)} /><section><div className="flex items-center justify-between"><div><h2 className="text-xl font-bold">Stage Missions</h2><p className="text-sm text-gray-500">Each stage points to one real QAL mission.</p></div><button onClick={addStage} className="rounded-lg border px-3 py-2 text-sm font-semibold">+ Stage</button></div><div className="mt-4 space-y-4">{selected.stages.map((stage, index) => <div key={stage.id} className="rounded-xl border border-gray-100 bg-gray-50 p-4"><div className="grid gap-3 md:grid-cols-4"><Field label={`Stage ${stage.id} title`} value={stage.title} onChange={(v) => updateStage(index, "title", v)} /><label className="text-sm font-medium md:col-span-2">Mission<select value={stage.missionId ?? ""} onChange={(e) => { const id = e.target.value || null; const mission = missions.find((m) => String(m.id) === id); updateStage(index, "missionId", id); updateStage(index, "mission", mission?.title || "Select a mission"); }} className="mt-1 w-full rounded-lg border p-2.5"><option value="">No mission selected</option>{missions.map((mission) => <option key={mission.id} value={mission.id}>{mission.title}</option>)}</select></label><Field label="XP" value={stage.xp} onChange={(v) => updateStage(index, "xp", Number(v) || 0)} /></div></div>)}</div></section><div className="flex justify-between border-t pt-5"><button onClick={removeEvent} className="rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-600">Delete Event</button><button onClick={save} disabled={saving} className="rounded-lg bg-purple-600 px-5 py-2.5 font-semibold text-white">{saving ? "Saving..." : "Save Event"}</button></div></main> : <div className="rounded-xl bg-white p-12 text-center shadow"><p className="text-gray-500">Select an event to edit or create a new season.</p></div>}
    </div></div></Layout>;
}
function Field({ label, value, onChange }) { return <label className="block text-sm font-medium">{label}<input value={value ?? ""} onChange={(e) => onChange(e.target.value)} className="mt-1 w-full rounded-lg border p-2.5" /></label>; }
