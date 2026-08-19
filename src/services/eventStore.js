import { supabase } from "../config/supabase";

async function withStages(eventRows) {
  const events = eventRows || [];
  if (!events.length) return [];
  const ids = events.map((e) => e.id);
  const { data: stages, error } = await supabase.from("event_stages").select("*").in("event_id", ids);
  if (error) throw error;
  const byEvent = new Map(ids.map((id) => [String(id), []]));
  (stages || []).sort((a, b) => Number(a.stage_number || 0) - Number(b.stage_number || 0)).forEach((stage) => byEvent.get(String(stage.event_id))?.push(stage));
  return events.map((row) => ({ ...row, season: row.season_name || row.title, badge: row.badge_id, stages: (byEvent.get(String(row.id)) || []).map((s) => ({ ...s, missionId: s.mission_id, xp: s.xp_reward })) }));
}

export async function getEvents() {
  const { data, error } = await supabase.from("events").select("*");
  if (error) throw error;
  return withStages(data);
}

export async function getEventById(id) {
  const { data, error } = await supabase.from("events").select("*").eq("id", id).single();
  if (error) throw error;
  return (await withStages([data]))[0] || null;
}

export async function getActiveEvent() {
  // Read the table first and filter in JavaScript. This avoids PostgREST 400s
  // caused by project-specific enum/index/schema differences in status/created_at.
  const { data, error } = await supabase.from("events").select("*");
  if (error) throw error;
  const published = (data || []).filter((event) => String(event.status || "").toLowerCase() === "published");
  published.sort((a, b) => String(b.created_at || "").localeCompare(String(a.created_at || "")));
  return published.length ? (await withStages([published[0]]))[0] : null;
}

export async function createEvent() {
  const { data, error } = await supabase.from("events").insert({ title: "New QAL Season", season_name: "New Season", theme: "New Challenge", description: "Describe this season.", status: "draft" }).select().single();
  if (error) throw error;
  return { ...data, season: data.season_name || data.title, badge: data.badge_id, stages: [] };
}

export async function saveEvent(event) {
  const payload = { title: event.title, description: event.description, season_name: event.season || event.season_name, theme: event.theme, status: event.status, badge_id: event.badge_id ?? (Number.isFinite(Number(event.badge)) ? Number(event.badge) : null), start_date: event.start_date || null, end_date: event.end_date || null };
  const { data, error } = await supabase.from("events").update(payload).eq("id", event.id).select().single();
  if (error) throw error;
  const { error: deleteError } = await supabase.from("event_stages").delete().eq("event_id", event.id);
  if (deleteError) throw deleteError;
  const stages = (event.stages || []).filter((stage) => stage.missionId ?? stage.mission_id).map((stage, index) => ({ event_id: event.id, stage_number: Number(stage.stage_number ?? index + 1), title: stage.title || `Stage ${index + 1}`, description: stage.description || stage.mission || "", mission_id: Number(stage.missionId ?? stage.mission_id), xp_reward: Number(stage.xp ?? stage.xp_reward ?? 100) }));
  if (stages.length) { const { error: stageError } = await supabase.from("event_stages").insert(stages); if (stageError) throw stageError; }
  return getEventById(data.id);
}

export async function deleteEvent(id) {
  const { error } = await supabase.from("events").delete().eq("id", id);
  if (error) throw error;
  return true;
}
