import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { getActiveMissions } from "../services/missionService";
import { Link } from "react-router-dom";

function Missions() {
  const [missions, setMissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadMissions() {
      try {
        const data = await getActiveMissions();
        setMissions(data);
      } catch (err) {
        console.error("Failed to load missions:", err);
        setError("Unable to load missions right now.");
      } finally {
        setLoading(false);
      }
    }

    loadMissions();
  }, []);

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <p className="text-sm font-medium text-purple-600">
            Learn → Compete → Grow
          </p>

          <h1 className="mt-1 text-3xl font-bold text-gray-900">
            Missions
          </h1>

          <p className="mt-2 text-gray-500">
            Solve practical analytics challenges and earn XP.
          </p>
        </div>

        {loading && (
          <div className="rounded-xl bg-white p-8 text-center shadow">
            <p className="text-gray-500">Loading missions...</p>
          </div>
        )}

        {error && (
          <div className="rounded-xl bg-white p-8 text-center shadow">
            <p className="text-red-500">{error}</p>
          </div>
        )}

        {!loading && !error && missions.length === 0 && (
          <div className="rounded-xl bg-white p-10 text-center shadow">
            <div className="text-4xl">🎯</div>

            <h2 className="mt-4 text-xl font-bold text-gray-900">
              No missions available yet
            </h2>

            <p className="mt-2 text-gray-500">
              New analytics missions will appear here once they are published.
            </p>
          </div>
        )}

        {!loading && !error && missions.length > 0 && (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {missions.map((mission) => (
              <MissionCard key={mission.id} mission={mission} />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}

function MissionCard({ mission }) {
  const topic = mission.topics;

  return (
    <div className="flex flex-col rounded-xl bg-white p-6 shadow transition hover:-translate-y-1 hover:shadow-lg">
      <div className="flex items-start justify-between gap-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-purple-100 text-xl">
          {topic?.icon || "🎯"}
        </div>

        <span className="rounded-full bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-600">
          +{mission.xp_reward ?? 0} XP
        </span>
      </div>

      <div className="mt-5 flex-1">
        <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
          {topic?.name || "Analytics"}
        </p>

        <h2 className="mt-1 text-xl font-bold text-gray-900">
          {mission.title}
        </h2>

        <p className="mt-3 line-clamp-3 text-sm leading-6 text-gray-500">
          {mission.description || "Complete this analytics mission."}
        </p>
      </div>

      <div className="mt-6 flex items-center justify-between border-t border-gray-100 pt-4">
        <span className="text-sm text-gray-500">
          Difficulty:{" "}
          <span className="font-medium text-gray-700">
            {mission.difficulty || "Not specified"}
          </span>
        </span>

        <Link
  to={`/missions/${mission.id}`}
  className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-purple-700"
>
  View Mission
</Link>
      </div>
    </div>
  );
}

export default Missions;