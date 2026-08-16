import { supabase } from "../config/supabase";

export async function getActiveMissions() {
  const { data, error } = await supabase
    .from("missions")
    .select(`
      id,
      title,
      description,
      difficulty,
      xp_reward,
      excel_file,
      deadline,
      topic_id,
      topics (
        id,
        name,
        icon,
        color
      )
    `)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function getMissions() {
  const { data, error } = await supabase
    .from("missions")
    .select(`
      id,
      title,
      description,
      difficulty,
      xp_reward,
      excel_file,
      deadline,
      topic_id,
      is_active,
      created_at,
      topics (
        id,
        name,
        icon,
        color
      )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function getMissionById(missionId) {
  const { data, error } = await supabase
    .from("missions")
    .select(`
      id,
      title,
      description,
      difficulty,
      xp_reward,
      excel_file,
      deadline,
      topic_id,
      topics (
        id,
        name,
        icon,
        color
      )
    `)
    .eq("id", missionId)
    .eq("is_active", true)
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function deleteMission(missionId) {
  const { error } = await supabase
    .from("missions")
    .delete()
    .eq("id", missionId);

  if (error) {
    throw error;
  }

  return true;
}

export async function getMissionFileUrl(filePath) {
  if (!filePath) {
    return null;
  }

  const { data, error } = await supabase.storage
    .from("qal-submissions")
    .createSignedUrl(filePath, 60 * 60);

  if (error) {
    throw error;
  }

  return data?.signedUrl || null;
}