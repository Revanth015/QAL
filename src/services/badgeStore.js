import { supabase } from "../config/supabase";

function safeImageUrl(value) {
  if (!value) return null;
  // Older prototype records may contain URLs for a storage bucket that no longer exists.
  // Do not render those URLs; the badge will fall back to its icon.
  if (String(value).includes("/storage/v1/object/")) return null;
  return value;
}

export async function getBadgeCatalog() {
  const { data, error } = await supabase.from("badges").select("id,name,description,image_url,icon,rarity,is_active,created_at").eq("is_active", true).order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []).map((badge) => ({ ...badge, image_url: safeImageUrl(badge.image_url) }));
}

export async function getMyBadges() {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  if (!user) return [];
  const { data: links, error } = await supabase.from("user_badges").select("id,user_id,badge_id,awarded_at,source").eq("user_id", user.id).order("awarded_at", { ascending: false });
  if (error) throw error;
  const ids = [...new Set((links || []).map((row) => row.badge_id).filter(Boolean))];
  if (!ids.length) return [];
  const { data: badges, error: badgeError } = await supabase.from("badges").select("id,name,description,image_url,icon,rarity,is_active").in("id", ids);
  if (badgeError) throw badgeError;
  const byId = new Map((badges || []).map((badge) => [String(badge.id), badge]));
  return (links || []).map((row) => ({ ...(byId.get(String(row.badge_id)) || {}), awarded_at: row.awarded_at, user_badge_id: row.id, source: row.source, image_url: safeImageUrl(byId.get(String(row.badge_id))?.image_url) })).filter((badge) => badge.id);
}

export async function createBadgeDraft(badge) {
  // Store a data URL when an image is supplied. This keeps the free setup working
  // even when no Supabase Storage bucket is configured for badges.
  let imageUrl = badge.image_url || null;
  if (badge.imageFile) {
    imageUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(badge.imageFile);
    });
  }
  const { data, error } = await supabase.from("badges").insert({ name: badge.name, description: badge.description || "", image_url: imageUrl, icon: badge.icon || "🏅", rarity: String(badge.rarity || "Common").toLowerCase(), is_active: true }).select().single();
  if (error) throw error;
  return { ...data, image_url: safeImageUrl(data.image_url) };
}

export async function deleteBadge(id) {
  const { error } = await supabase.from("badges").update({ is_active: false }).eq("id", id);
  if (error) throw error;
  return true;
}
