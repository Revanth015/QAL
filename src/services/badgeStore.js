const KEY = "qal_badge_catalog_v2";

const defaults = [
  { id: "first-mission", name: "First Mission", icon: "🚀", image_url: null, description: "Complete your first QAL mission.", rarity: "Common" },
  { id: "statistician", name: "Statistical Sleuth", icon: "📊", image_url: null, description: "Demonstrate a correct statistical process and interpretation.", rarity: "Rare" },
  { id: "season-01", name: "Season 01 Champion", icon: "🏆", image_url: null, description: "Complete every stage of a QAL season.", rarity: "Legendary" },
  { id: "data-rescue", name: "Data Rescue Specialist", icon: "🛟", image_url: null, description: "Complete a data-quality rescue challenge.", rarity: "Epic" },
];

function read() {
  try {
    const value = localStorage.getItem(KEY);
    if (value) return JSON.parse(value);
    localStorage.setItem(KEY, JSON.stringify(defaults));
  } catch (error) {
    console.warn("Badge store unavailable:", error);
  }
  return [...defaults];
}
function write(items) { localStorage.setItem(KEY, JSON.stringify(items)); }

export async function getBadgeCatalog() { return read(); }
export async function getMyBadges() { return read().slice(0, 2); }
export async function createBadgeDraft(badge) {
  const items = read();
  const created = { ...badge, id: badge.id || `badge-${Date.now()}`, createdAt: new Date().toISOString() };
  write([...items, created]);
  return created;
}
export async function deleteBadge(id) {
  const next = read().filter((badge) => badge.id !== id);
  write(next);
  return true;
}
