import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "../components/Layout";
import {
  getMissions,
  deleteMission,
} from "../services/missionService";

function AdminMissions() {
  const [missions, setMissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  async function loadMissions() {
    try {
      setLoading(true);
      setError(null);

      const data = await getMissions();
      setMissions(data || []);
    } catch (err) {
      console.error("Failed to load admin missions:", err);
      setError("Unable to load missions.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMissions();
  }, []);

  async function handleDelete(missionId) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this mission?"
    );

    if (!confirmed) return;

    try {
      await deleteMission(missionId);
      await loadMissions();
    } catch (err) {
      console.error("Failed to delete mission:", err);
      alert("Unable to delete mission.");
    }
  }

  return (
    <Layout>
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-purple-600">
              QAL Administration
            </p>

            <h1 className="mt-1 text-3xl font-bold text-gray-900">
              Mission Management
            </h1>

            <p className="mt-2 text-gray-500">
              Create and manage missions available to participants.
            </p>
          </div>

          <Link
            to="/admin/missions/new"
            className="rounded-lg bg-purple-600 px-5 py-3 font-semibold text-white transition hover:bg-purple-700"
          >
            + Create Mission
          </Link>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600">
            {error}
          </div>
        )}

        {loading ? (
          <div className="rounded-xl bg-white p-8 text-center shadow">
            Loading missions...
          </div>
        ) : missions.length === 0 ? (
          <div className="rounded-xl bg-white p-10 text-center shadow">
            <h2 className="text-lg font-semibold text-gray-900">
              No missions yet
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Create your first QAL mission.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl bg-white shadow">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    Mission
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    Difficulty
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    XP
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    Status
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {missions.map((mission) => (
                  <tr key={mission.id}>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-gray-900">
                        {mission.title}
                      </p>

                      <p className="mt-1 text-sm text-gray-500">
                        {mission.description || "No description"}
                      </p>
                    </td>

                    <td className="px-6 py-4 text-sm text-gray-600">
                      {mission.difficulty || "—"}
                    </td>

                    <td className="px-6 py-4 text-sm font-medium text-gray-700">
                      {mission.xp_reward ?? 0}
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          mission.is_active
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {mission.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-right">
                      <Link
                        to={`/admin/missions/${mission.id}/edit`}
                        className="mr-4 text-sm font-medium text-purple-600 hover:text-purple-800"
                      >
                        Edit
                      </Link>

                      <button
                        type="button"
                        onClick={() => handleDelete(mission.id)}
                        className="text-sm font-medium text-red-600 hover:text-red-800"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
}

export default AdminMissions;