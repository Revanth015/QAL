const demoBadges = [
  { id: "first-mission", name: "First Mission", icon: "🚀", description: "Complete your first QAL mission.", rarity: "Common" },
  { id: "statistician", name: "Statistical Sleuth", icon: "📊", description: "Demonstrate a correct statistical process and interpretation.", rarity: "Rare" },
  { id: "season-01", name: "Season 01 Champion", icon: "🏆", description: "Complete every stage of a QAL season.", rarity: "Legendary" },
  { id: "data-rescue", name: "Data Rescue Specialist", icon: "🛟", description: "Complete a data-quality rescue challenge.", rarity: "Epic" },
];

export async function getBadgeCatalog() {
  return demoBadges;
}

export async function getMyBadges() {
  return demoBadges.slice(0, 2);
}

export async function createBadgeDraft(badge) {
  return { ...badge, id: badge.id || `badge-${Date.now()}`, createdAt: new Date().toISOString() };
}
