import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "../components/Layout";
import { getCurrentUserProfile } from "../services/userService";
import { getActiveTopics } from "../services/topicService";
import { getActiveMissions } from "../services/missionService";
import { getActiveEvent } from "../services/eventService";

function Dashboard() {
  const [profile, setProfile] = useState(null);
  const [topics, setTopics] = useState([]);
  const [missions, setMissions] = useState([]);
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [p, t, m, e] = await Promise.all([getCurrentUserProfile(), getActiveTopics(), getActiveMissions(), getActiveEvent()]);
        setProfile(p); setTopics(t); setMissions(m); setEvent(e);
      } catch (error) { console.error("Failed to load dashboard:", error); }
      finally { setLoading(false); }
    }
    load();
  }, []);

  if (loading) return <Layout><div className="flex min-h-[60vh] items-center justify-center text-gray-500">Loading your dashboard...</div></Layout>;
  if (!profile) return <Layout><div className="rounded-xl bg-white p-8 shadow"><h1 className="text-2xl font-bold">Unable to load your dashboard</h1><p className="mt-2 text-gray-500">We couldn't load your QAL profile.</p></div></Layout>;

  return <Layout><div className="space-y-8">
    <div><p className="text-sm font-medium text-purple-600">QAL Dashboard</p><h1 className="mt-1 text-3xl font-bold text-gray-900">Welcome back, {profile.full_name}</h1><p className="mt-2 text-gray-500">Your missions, seasons, progress and collector journey in one place.</p></div>
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"><StatCard title="Total XP" value={profile.total_xp} description="Experience earned"/><StatCard title="Level" value={profile.level} description="Current level"/><StatCard title="Streak" value={profile.streak} description="Current streak"/><StatCard title="Missions" value={profile.missions_completed} description="Completed missions"/></div>

    <section><div className="flex items-end justify-between"><div><h2 className="text-xl font-bold">Active Missions</h2><p className="mt-1 text-sm text-gray-500">Challenges currently available to you.</p></div><Link to="/missions" className="text-sm font-semibold text-purple-600">View all →</Link></div><div className="mt-4 grid gap-4 md:grid-cols-3">{missions.length ? missions.slice(0, 3).map((m) => <Link key={m.id} to={`/missions/${m.id}`} className="rounded-xl bg-white p-5 shadow transition hover:-translate-y-0.5"><p className="text-xs font-semibold text-purple-600">{m.topics?.icon || "🎯"} {m.topics?.name || "Mission"}</p><h3 className="mt-2 font-bold text-gray-900">{m.title}</h3><p className="mt-2 line-clamp-2 text-sm text-gray-500">{m.description || "Complete this challenge."}</p><p className="mt-4 text-xs font-bold text-purple-600">+{m.xp_reward || 0} XP</p></Link>) : <div className="rounded-xl bg-white p-6 shadow text-gray-500 md:col-span-3">No active missions yet.</div>}</div></section>

    <section className="rounded-2xl bg-gray-950 p-6 text-white shadow"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-widest text-purple-300">Live Season</p><h2 className="mt-1 text-2xl font-bold">{event?.title || "No active season"}</h2><p className="mt-2 max-w-2xl text-sm text-gray-400">{event?.description || "Season events will appear here."}</p></div>{event && <Link to="/events" className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold">Open Season →</Link>}</div>{event?.stages?.length > 0 && <div className="mt-6 grid gap-3 sm:grid-cols-4">{event.stages.map((stage) => <div key={stage.id} className={`rounded-lg border p-3 ${stage.status === "current" ? "border-purple-400 bg-purple-500/20" : "border-white/10"}`}><p className="text-xs text-gray-400">Stage {stage.id}</p><p className="mt-1 text-sm font-semibold">{stage.title}</p><p className="mt-2 text-xs text-gray-400">{stage.status === "locked" ? "🔒 Locked" : stage.status === "completed" ? "✓ Complete" : "▶ Current"}</p></div>)}</div>}</section>

    <div className="grid gap-6 lg:grid-cols-2"><section><div className="flex items-center justify-between"><h2 className="text-xl font-bold">Upcoming Events</h2><Link to="/events" className="text-sm font-semibold text-purple-600">Events →</Link></div><div className="mt-4 rounded-xl bg-white p-6 shadow"><p className="font-bold">Data Rescue — Season 02</p><p className="mt-2 text-sm text-gray-500">A future multi-stage challenge focused on data quality and decision-making.</p><span className="mt-4 inline-block rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold">Coming soon</span></div></section><section><div className="flex items-center justify-between"><h2 className="text-xl font-bold">Collector Cabinet</h2><Link to="/badges" className="text-sm font-semibold text-purple-600">View badges →</Link></div><div className="mt-4 rounded-xl bg-white p-6 shadow"><div className="flex items-center gap-4"><div className="flex h-14 w-14 items-center justify-center rounded-full bg-purple-50 text-3xl">🚀</div><div><p className="font-bold">First Mission</p><p className="text-sm text-gray-500">Your badge collection grows with every achievement.</p></div></div></div></section></div>

    <section><h2 className="text-xl font-bold">Your Learning Journey</h2><div className="mt-4 rounded-xl bg-white p-6 shadow">{topics.length === 0 ? <p className="text-gray-500">No learning topics are available yet.</p> : <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{topics.map((topic) => <div key={topic.id} className="rounded-lg border border-gray-100 p-4"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 text-purple-600">{topic.icon || "📚"}</div><div><h3 className="font-semibold">{topic.name}</h3><p className="text-sm text-gray-500">{topic.description || "Start learning this topic."}</p></div></div></div>)}</div>}</div></section>
  </div></Layout>;
}
function StatCard({ title, value, description }) { return <div className="rounded-xl bg-white p-6 shadow"><p className="text-sm font-medium text-gray-500">{title}</p><p className="mt-2 text-3xl font-bold text-purple-600">{value ?? 0}</p><p className="mt-1 text-sm text-gray-400">{description}</p></div>; }
export default Dashboard;
