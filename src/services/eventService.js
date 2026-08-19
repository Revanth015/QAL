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

  return (event.stages || []).map((stage, i) => {
    const result = (published || []).find((s) => Number(s.mission_id) === Number(stage.missionId));
    let status = "locked";
    if (result) status = "completed";
    else if (i === 0 || (published || []).some((s) => Number(s.mission_id) === Number(event.stages[i - 1]?.missionId))) status = "available";
    return { stage_id: stage.id, status, score: result?.score ?? null, completed_at: result?.submitted_at ?? null };
  });
}
