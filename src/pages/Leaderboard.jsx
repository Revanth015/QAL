import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { getLeaderboard } from "../services/leaderboardService";

function Leaderboard() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getLeaderboard()
      .then(setUsers)
      .catch((err) => setError(err.message || "Unable to load leaderboard."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Layout>
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <p className="text-sm font-medium text-purple-600">QAL Community</p>
          <h1 className="mt-1 text-3xl font-bold text-gray-900">Leaderboard</h1>
          <p className="mt-2 text-gray-500">Compete through missions, XP and consistent performance.</p>
        </div>

        <div className="overflow-hidden rounded-xl bg-white shadow">
          {loading ? (
            <p className="p-6 text-gray-500">Loading leaderboard...</p>
          ) : error ? (
            <p className="p-6 text-red-600">{error}</p>
          ) : users.length === 0 ? (
            <p className="p-6 text-gray-500">No leaderboard data yet.</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {users.map((user) => (
                <div key={user.id} className="flex items-center gap-4 p-5">
                  <div className="w-10 text-center text-lg font-bold text-purple-600">#{user.rank}</div>
                  {user.avatar_url ? (
                    <img src={user.avatar_url} alt="" className="h-10 w-10 rounded-full object-cover" />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 font-bold text-purple-700">
                      {(user.full_name || "Q").charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-gray-900">{user.full_name || "QAL Learner"}</p>
                    <p className="text-sm text-gray-500">Level {user.level || 1} · {user.missions_completed || 0} missions</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-purple-600">{user.total_xp || 0} XP</p>
                    <p className="text-xs text-gray-400">{user.streak || 0} day streak</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

export default Leaderboard;
