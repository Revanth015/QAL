import { supabase } from "../config/supabase";

export async function getCurrentUserProfile() {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) {
    throw authError;
  }

  if (!user) {
    return null;
  }

  const { data, error } = await supabase
    .from("users")
    .select(
      "id, full_name, email, avatar_url, total_xp, level, streak, missions_completed"
    )
    .eq("id", user.id)
    .single();

  if (error) {
    throw error;
  }

  return data;
}