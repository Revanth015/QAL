import { supabase } from "../config/supabase";

export async function getLeaderboard({ limit = 50 } = {}) {
  const { data, error } = await supabase
    .from("users")
    .select("id, full_name, avatar_url, total_xp, level, streak, missions_completed")
    .order("total_xp", { ascending: false })
    .limit(limit);

  if (error) throw error;

  return (data || []).map((user, index) => ({
    ...user,
    rank: index + 1,
  }));
}

export async function getUserLeaderboardPosition(userId) {
  const leaderboard = await getLeaderboard({ limit: 1000 });
  return leaderboard.find((user) => user.id === userId) || null;
}
