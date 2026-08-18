import { supabase } from "../config/supabase";

const BUCKET_NAME = "qal-submissions";

export async function submitMissionFile({ missionId, file }) {
  if (!file) throw new Error("Please select a file.");

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  if (!user) throw new Error("You must be logged in to submit a mission.");

  const fileExtension = file.name.split(".").pop();
  const safeFileName = `${crypto.randomUUID()}.${fileExtension}`;
  const filePath = `${user.id}/${missionId}/${safeFileName}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, file, { upsert: false });
  if (uploadError) throw uploadError;

  const { data, error: submissionError } = await supabase
    .from("submissions")
    .insert({ user_id: user.id, mission_id: missionId, submission_file: filePath, status: "Pending", score: 0 })
    .select()
    .single();

  if (submissionError) {
    await supabase.storage.from(BUCKET_NAME).remove([filePath]);
    throw submissionError;
  }

  return data;
}

export async function getMySubmission(missionId) {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  if (!user) throw new Error("You must be logged in.");

  const { data, error } = await supabase
    .from("submissions")
    .select("id, user_id, mission_id, submission_file, score, feedback, status, submitted_at")
    .eq("user_id", user.id)
    .eq("mission_id", missionId)
    .order("submitted_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getMyPublishedResults() {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  if (!user) throw new Error("You must be logged in.");

  const { data, error } = await supabase
    .from("submissions")
    .select("id, mission_id, score, feedback, status, submitted_at")
    .eq("user_id", user.id)
    .eq("status", "Published")
    .order("submitted_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}
