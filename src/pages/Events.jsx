import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "../components/Layout";
import { getEvents } from "../services/eventService";

export default function Events() {
  const [events, setEvents] = useState([]);
  useEffect(() => { getEvents().then(setEvents); }, []);

  return <Layout><div className="mx-auto max-w-6xl space-y-8">
    <div><p className="text-sm font-semibold text-purple-600">QAL Events</p><h1 className="mt-1 text-3xl font-bold text-gray-900">Seasons & Stage Missions</h1><p className="mt-2 text-gray-500">Long-form competitions where each completed mission unlocks the next stage and the complete season awards a collector badge.</p></div>
    {events.map((event) => <section key={event.id} className="rounded-2xl bg-white p-6 shadow">
      <div className="flex flex-wrap items-start justify-between gap-4"><div><span className="rounded-full bg-purple-50 px-3 py-1 text-xs font-bold text-purple-700">{event.season}</span><h2 className="mt-3 text-2xl font-bold">{event.title}</h2><p className="mt-2 text-gray-500">{event.description}</p></div><div className="rounded-xl bg-gray-50 p-4 text-center"><div className="text-3xl">🏆</div><p className="mt-1 text-xs font-bold">{event.badge}</p></div></div>
      <div className="mt-8 grid gap-3 md:grid-cols-4">{event.stages.length ? event.stages.map((stage) => <div key={stage.id} className={`rounded-xl border p-4 ${stage.status === "current" ? "border-purple-400 bg-purple-50" : stage.status === "completed" ? "border-green-200 bg-green-50" : "border-gray-200 bg-gray-50"}`}><p className="text-xs font-bold uppercase tracking-wide text-gray-400">Stage {stage.id}</p><h3 className="mt-2 font-bold">{stage.title}</h3><p className="mt-2 text-sm text-gray-600">{stage.mission}</p><div className="mt-4 flex justify-between text-xs font-semibold"><span>{stage.status === "locked" ? "🔒 Locked" : stage.status === "current" ? "▶ Current" : "✓ Complete"}</span><span>+{stage.xp} XP</span></div></div>) : <div className="md:col-span-4 rounded-xl border border-dashed p-6 text-gray-500">Stages will be revealed when this season launches.</div>}</div>
      {event.status === "active" && <div className="mt-6"><Link to="/missions" className="inline-block rounded-lg bg-purple-600 px-5 py-2.5 text-sm font-semibold text-white">Enter Current Stage</Link></div>}
    </section>)}
  </div></Layout>;
}
