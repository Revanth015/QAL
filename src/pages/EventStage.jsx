import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Layout from "../components/Layout";
import { getEventById } from "../services/eventStore";
import { getMissionById } from "../services/missionService";

export default function EventStage() {
  const { eventId, stageId } = useParams();
  const [event, setEvent] = useState(null);
  const [mission, setMission] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { (async () => { const e = await getEventById(eventId); setEvent(e); const stage = e?.stages?.find((s) => String(s.id) === String(stageId)); if (stage?.missionId) { try { setMission(await getMissionById(stage.missionId)); } catch {} } setLoading(false); })(); }, [eventId, stageId]);
  if (loading) return <Layout><div className="p-8 text-gray-500">Loading event stage...</div></Layout>;
  const stage = event?.stages?.find((s) => String(s.id) === String(stageId));
  if (!event || !stage) return <Layout><div className="rounded-xl bg-white p-8 shadow">Stage not found.</div></Layout>;
  const locked = stage.status === "locked";
  return <Layout><div className="mx-auto max-w-4xl space-y-6"><Link to="/events" className="text-sm font-semibold text-purple-600">← Back to Events</Link><div className="rounded-2xl bg-gray-950 p-8 text-white"><p className="text-sm text-purple-300">{event.season} · Stage {stage.id}</p><h1 className="mt-2 text-3xl font-bold">{stage.title}</h1><p className="mt-3 text-gray-300">{stage.mission}</p><div className="mt-6 inline-flex rounded-full bg-white/10 px-4 py-2 text-sm font-bold">+{stage.xp} XP</div></div>{locked ? <div className="rounded-xl bg-white p-8 text-center shadow"><div className="text-4xl">🔒</div><h2 className="mt-3 text-xl font-bold">Stage Locked</h2><p className="mt-2 text-gray-500">Complete and submit the previous stage before entering this mission.</p></div> : <div className="rounded-xl bg-white p-8 shadow"><h2 className="text-xl font-bold">Stage Mission</h2>{mission ? <><p className="mt-2 text-gray-500">Complete this mission as part of the {event.season} storyline. Your normal QAL submission and evaluation will determine the result.</p><div className="mt-6 flex flex-wrap gap-3"><Link to={`/missions/${mission.id}`} className="rounded-lg bg-purple-600 px-5 py-2.5 font-semibold text-white">Open Mission & Submit</Link><Link to="/missions" className="rounded-lg border px-5 py-2.5 font-semibold text-gray-700">Browse Missions</Link></div></> : <><p className="mt-2 text-gray-500">No mission has been assigned to this stage yet. An administrator needs to configure it.</p><Link to="/events" className="mt-5 inline-block rounded-lg border px-4 py-2 font-semibold">Back to Event</Link></>}</div>}</div></Layout>;
}
