import { supabase } from "../config/supabase";

function safeImageUrl(value) {
  if (!value) return null;
  if (String(value).includes("/storage/v1/object/")) return null;
  return value;
}

async function compressedDataUrl(file) {
  if (!file) return null;
  // Keep the free database-backed image approach small enough for normal REST requests.
  if (file.size <= 180000) return new Promise((resolve, reject) => { const r = new FileReader(); r.onload = () => resolve(String(r.result)); r.onerror = reject; r.readAsDataURL(file); });
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const max = 512;
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));
        canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.72));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

export async function getBadgeCatalog() {
  const { data, error } = await supabase.from("badges").select("*");
  if (error) throw error;
  return (data || []).filter((badge) => badge.is_active !== false).map((badge) => ({ ...badge, image_url: safeImageUrl(badge.image_url) }));
}

export async function getMyBadges() {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  if (!user) return [];
  const { data: links, error } = await supabase.from("user_badges").select("*").eq("user_id", user.id);
  if (error) throw error;
  const ids = [...new Set((links || []).map((row) => row.badge_id).filter(Boolean))];
  if (!ids.length) return [];
  const { data: badges, error: badgeError } = await supabase.from("badges").select("*").in("id", ids);
  if (badgeError) throw badgeError;
  const byId = new Map((badges || []).map((badge) => [String(badge.id), badge]));
  return (links || []).map((row) => ({ ...(byId.get(String(row.badge_id)) || {}), awarded_at: row.awarded_at, user_badge_id: row.id, source: row.source, image_url: safeImageUrl(byId.get(String(row.badge_id))?.image_url) })).filter((badge) => badge.id);
}

export async function createBadgeDraft(badge) {
  const imageUrl = badge.imageFile ? await compressedDataUrl(badge.imageFile) : safeImageUrl(badge.image_url);
  const payload = { name: badge.name?.trim(), description: badge.description || "", image_url: imageUrl, icon: badge.icon || "🏅", rarity: badge.rarity || "Common", is_active: true };
  if (!payload.name) throw new Error("Badge name is required.");
  const { data, error } = await supabase.from("badges").insert(payload).select().single();
  if (error) throw new Error(`Badge creation failed: ${error.message || error.code || "Supabase error"}`);
  return { ...data, image_url: safeImageUrl(data.image_url) };
}

export async function deleteBadge(id) {
  const { error } = await supabase.from("badges").update({ is_active: false }).eq("id", id);
  if (error) throw error;
  return true;
}
