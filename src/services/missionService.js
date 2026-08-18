import { supabase } from "../config/supabase";

const missionSelect = `
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
`;

export async function getActiveMissions() {
  const { data, error } = await supabase
    .from("missions")
    .select(missionSelect)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function getMissions() {
  const { data, error } = await supabase
    .from("missions")
    .select(missionSelect)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function getMissionById(missionId) {
  const { data, error } = await supabase
    .from("missions")
    .select(missionSelect)
    .eq("id", missionId)
    .eq("is_active", true)
    .single();

  if (error) throw error;
  return data;
}

export async function getAdminMissionById(missionId) {
  const { data, error } = await supabase
    .from("missions")
    .select(missionSelect)
    .eq("id", missionId)
    .single();

  if (error) throw error;
  return data;
}

export async function getMissionCriteria(missionId) {
  const { data, error } = await supabase
    .from("mission_scoring_criteria")
    .select("id, mission_id, criterion_name, criterion_description, weight, max_score, evaluation_instructions")
    .eq("mission_id", missionId)
    .order("id");

  if (error) throw error;
  return data ?? [];
}

export async function updateMission({ missionId, mission, criteria, file }) {
  let excelFile = mission.excel_file || null;

  if (file) {
    const extension = file.name.split(".").pop()?.toLowerCase() || "xlsx";
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const filePath = `missions/${Date.now()}-${safeName}`;

    const { error: uploadError } = await supabase.storage
      .from("qal-submissions")
      .upload(filePath, file, {
        upsert: false,
        contentType:
          extension === "xlsx"
            ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            : file.type,
      });

    if (uploadError) throw uploadError;
    excelFile = filePath;
  }

  const { error: missionError } = await supabase
    .from("missions")
    .update({
      title: mission.title.trim(),
      topic_id: Number(mission.topic_id),
      description: mission.description.trim() || null,
      difficulty: mission.difficulty,
      xp_reward: Number(mission.xp_reward) || 0,
      excel_file: excelFile,
      deadline: mission.deadline
        ? new Date(mission.deadline).toISOString()
        : null,
      is_active: Boolean(mission.is_active),
    })
    .eq("id", missionId);

  if (missionError) throw missionError;

  const { error: deleteCriteriaError } = await supabase
    .from("mission_scoring_criteria")
    .delete()
    .eq("mission_id", missionId);

  if (deleteCriteriaError) throw deleteCriteriaError;

  const criteriaPayload = criteria.map((criterion) => ({
    mission_id: Number(missionId),
    criterion_name: criterion.criterion_name.trim(),
    criterion_description: criterion.criterion_description.trim() || null,
    weight: Number(criterion.weight),
    max_score: 100,
    evaluation_instructions: criterion.evaluation_instructions.trim() || null,
  }));

  const { error: criteriaError } = await supabase
    .from("mission_scoring_criteria")
    .insert(criteriaPayload);

  if (criteriaError) throw criteriaError;
  return getAdminMissionById(missionId);
}

export async function deleteMission(missionId) {
  const { error } = await supabase
    .from("missions")
    .delete()
    .eq("id", missionId);

  if (!error) return true;

  // Preserve mission history if foreign-key constraints prevent hard deletion.
  const { error: archiveError } = await supabase
    .from("missions")
    .update({ is_active: false })
    .eq("id", missionId);

  if (archiveError) throw error;
  return true;
}

export async function getMissionFileUrl(filePath) {
  if (!filePath) return null;

  const { data, error } = await supabase.storage
    .from("qal-submissions")
    .createSignedUrl(filePath, 60 * 60);

  if (error) throw error;
  return data?.signedUrl || null;
}
