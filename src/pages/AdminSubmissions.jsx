import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "../components/Layout";
import { supabase } from "../config/supabase";

function AdminSubmissions() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadSubmissions() {
    try {
      setLoading(true);
      setError("");

      const { data, error: queryError } = await supabase
        .from("submissions")
        .select(`
          id,
          user_id,
          mission_id,
          submission_file,
          score,
          feedback,
          status,
          submitted_at,
          users (
            full_name,
            email
          ),
          missions (
            title,
            difficulty,
            xp_reward
          )
        `)
        .order("submitted_at", { ascending: false });

      if (queryError) {
        throw queryError;
      }

      setSubmissions(data || []);
    } catch (err) {
      console.error("Failed to load submissions:", err);
      setError(err.message || "Unable to load submissions.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSubmissions();
  }, []);

  return (
    <Layout>
      <div className="mx-auto max-w-7xl space-y-8">
        <div>
          <p className="text-sm font-medium text-purple-600">
            QAL Administration
          </p>

          <h1 className="mt-1 text-3xl font-bold text-gray-900">
            Submission Evaluation
          </h1>

          <p className="mt-2 text-gray-500">
            Track student submissions and their evaluation status.
          </p>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="rounded-xl bg-white p-8 text-center shadow">
            Loading submissions...
          </div>
        ) : submissions.length === 0 ? (
          <div className="rounded-xl bg-white p-10 text-center shadow">
            <h2 className="text-lg font-semibold text-gray-900">
              No submissions yet
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Student submissions will appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl bg-white shadow">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    Student
                  </th>

                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    Mission
                  </th>

                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    Submitted
                  </th>

                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    Status
                  </th>

                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    Score
                  </th>

                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {submissions.map((submission) => (
                  <tr key={submission.id}>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-gray-900">
                        {submission.users?.full_name || "Unknown student"}
                      </p>

                      <p className="mt-1 text-sm text-gray-500">
                        {submission.users?.email || "—"}
                      </p>
                    </td>

                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">
                        {submission.missions?.title || "Unknown mission"}
                      </p>

                      <p className="mt-1 text-sm text-gray-500">
                        {submission.missions?.difficulty || "—"}
                      </p>
                    </td>

                    <td className="px-6 py-4 text-sm text-gray-600">
                      {submission.submitted_at
                        ? new Date(
                            submission.submitted_at
                          ).toLocaleString()
                        : "—"}
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          submission.status === "Evaluated"
                            ? "bg-green-100 text-green-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {submission.status || "Pending"}
                      </span>
                    </td>

                    <td className="px-6 py-4 font-semibold text-gray-900">
                      {submission.status === "Evaluated"
                        ? submission.score
                        : "—"}
                    </td>

                    <td className="px-6 py-4 text-right">
                      <Link
                        to={`/admin/submissions/${submission.id}`}
                        className="text-sm font-semibold text-purple-600 hover:text-purple-800"
                      >
                        Review
                      </Link>
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

export default AdminSubmissions;