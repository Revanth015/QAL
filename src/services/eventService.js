export { getEvents, getEventById, getActiveEvent, saveEvent, createEvent, deleteEvent } from "./eventStore";
import { supabase } from "../config/supabase";

export async function getMyEventProgress(eventId) {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  if (!user) return [];
  const { data, error } = await supabase.from("event_progress").select("id,event_id,stage_id,status,score,completed_at").eq("event_id", eventId).eq("user_id", user.id);
  if (error) throw error;
  return data || [];
}

export async function syncEventProgress(event) {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  if (!user || !event) return [];
  const { data: published, error } = await supabase.from("submissions").select("mission_id,score,submitted_at").eq("user_id", user.id).eq("status", "Published");
  if (error) throw error;
  const rows = [];
  for (let i = 0; i < (event.stages || []).length; i += 1) {
    const stage = event.stages[i];
    const result = (published || []).find((s) => Number(s.mission_id) === Number(stage.missionId));
    let status = "locked";
    if (result) status = "completed";
    else if (i === 0 || rows[i - 1]?.status === "completed") status = "available";
    const row = { event_id: event.id, stage_id: stage.id, user_id: user.id, status, score: result?.score ?? null, completed_at: result?.submitted_at ?? null };
    const { data: saved, error: saveError } = await supabase.from("event_progress").upsert(row, { onConflict: "event_id,stage_id,user_id" }).select().single();
    if (saveError) throw saveError;
    rows.push(saved);
  }
  return rows;
}
