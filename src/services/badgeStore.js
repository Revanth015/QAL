import { supabase } from "../config/supabase";

const BUCKET = "qal-badges";

export async function getBadgeCatalog() {
  const { data, error } = await supabase.from("badges").select("id,name,description,image_url,icon,rarity,is_active,created_at").eq("is_active", true).order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getMyBadges() {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  if (!user) return [];
  const { data, error } = await supabase.from("user_badges").select("id,user_id,badge_id,awarded_at,source,badges(id,name,description,image_url,icon,rarity,is_active)").eq("user_id", user.id).order("awarded_at", { ascending: false });
  if (error) throw error;
  return (data || []).map((row) => ({ ...row.badges, awarded_at: row.awarded_at, user_badge_id: row.id }));
}

export async function createBadgeDraft(badge) {
  let imageUrl = badge.image_url || null;
  if (badge.imageFile) {
    const ext = badge.imageFile.name.split(".").pop() || "png";
    const path = `badges/${crypto.randomUUID()}.${ext}`;
    const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, badge.imageFile, { upsert: false });
    if (uploadError) throw uploadError;
    const { data: publicData } = supabase.storage.from(BUCKET).getPublicUrl(path);
    imageUrl = publicData.publicUrl;
  }
  const { data, error } = await supabase.from("badges").insert({ name: badge.name, description: badge.description || "", image_url: imageUrl, icon: badge.icon || "🏅", rarity: String(badge.rarity || "Common").toLowerCase(), is_active: true }).select().single();
  if (error) throw error;
  return data;
}

export async function deleteBadge(id) {
  const { error } = await supabase.from("badges").update({ is_active: false }).eq("id", id);
  if (error) throw error;
  return true;
}
