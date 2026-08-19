import { supabase } from "../config/supabase";

function mapEvent(row, stages = []) {
  return { ...row, season: row.season_name || row.title, badge: row.badge_id, stages: stages.map((s) => ({ ...s, missionId: s.mission_id, xp: s.xp_reward })) };
}

export async function getEvents() {
  const { data, error } = await supabase.from("events").select("*,event_stages(*)").order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []).map((e) => mapEvent(e, e.event_stages || []));
}

export async function getEventById(id) {
  const { data, error } = await supabase.from("events").select("*,event_stages(*)").eq("id", id).single();
  if (error) throw error;
  return mapEvent(data, data.event_stages || []);
}

export async function getActiveEvent() {
  const { data, error } = await supabase.from("events").select("*,event_stages(*)").eq("status", "published").order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (error) throw error;
  return data ? mapEvent(data, data.event_stages || []) : null;
}

export async function createEvent() {
  const { data, error } = await supabase.from("events").insert({ title: "New QAL Season", season_name: "New Season", theme: "New Challenge", description: "Describe this season.", status: "draft" }).select().single();
  if (error) throw error;
  return mapEvent(data, []);
}

export async function saveEvent(event) {
  const payload = { title: event.title, description: event.description, season_name: event.season || event.season_name, theme: event.theme, status: event.status, badge_id: event.badge_id ?? event.badge, start_date: event.start_date || null, end_date: event.end_date || null };
  const { data, error } = await supabase.from("events").update(payload).eq("id", event.id).select().single();
  if (error) throw error;

  const { error: deleteError } = await supabase.from("event_stages").delete().eq("event_id", event.id);
  if (deleteError) throw deleteError;

  const stages = (event.stages || []).filter((stage) => stage.mission_id ?? stage.missionId).map((stage, index) => ({
    event_id: event.id,
    stage_number: Number(stage.stage_number ?? stage.id ?? index + 1),
    title: stage.title || `Stage ${index + 1}`,
    description: stage.description || stage.mission || "",
    mission_id: Number(stage.mission_id ?? stage.missionId),
    xp_reward: Number(stage.xp_reward ?? stage.xp ?? 100)
  }));
  if (stages.length) {
    const { error: stageError } = await supabase.from("event_stages").insert(stages);
    if (stageError) throw stageError;
  }
  return getEventById(data.id);
}

export async function deleteEvent(id) {
  const { error } = await supabase.from("events").delete().eq("id", id);
  if (error) throw error;
  return true;
}
