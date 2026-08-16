import { supabase } from "../config/supabase";

export async function getActiveTopics() {
  const { data, error } = await supabase
    .from("topics")
    .select("id, name, description, icon, color")
    .eq("is_active", true)
    .order("name");

  if (error) {
    throw error;
  }

  return data ?? [];
}