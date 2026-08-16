import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Layout from "../components/Layout";
import { supabase } from "../config/supabase";

function AdminSubmissionDetails() {
  const { submissionId } = useParams();

  const [submission, setSubmission] = useState(null);
  const [criteria, setCriteria] = useState([]);
  const [fileUrl, setFileUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadSubmission() {
      try {
        const { data, error: submissionError } = await supabase
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
              id,
              title,
              description,
              difficulty,
              xp_reward
            )
          `)
          .eq("id", submissionId)
          .single();

        if (submissionError) {
          throw submissionError;
        }

        setSubmission(data);

        const {
          data: criteriaData,
          error: criteriaError,
        } = await supabase
          .from("mission_scoring_criteria")
          .select(`
            id,
            criterion_name,
            criterion_description,
            weight,
            max_score,
            evaluation_instructions
          `)
          .eq("mission_id", data.mission_id)
          .order("id");

        if (criteriaError) {
          throw criteriaError;
        }

        setCriteria(criteriaData || []);

        if (data?.submission_file) {
          const { data: signedData, error: signedError } =
            await supabase.storage
              .from("qal-submissions")
              .createSignedUrl(data.submission_file, 60 * 60);

          if (signedError) {
            throw signedError;
          }

          setFileUrl(signedData?.signedUrl || null);
        }
      } catch (err) {
        console.error("Failed to load submission:", err);
        setError(
          err.message || "Unable to load submission."
        );
      } finally {
        setLoading(false);
      }
    }

    loadSubmission();
  }, [submissionId]);

  if (loading) {
    return (
      <Layout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <p className="text-gray-500">
            Loading submission...
          </p>
        </div>
      </Layout>
    );
  }

  if (error || !submission) {
    return (
      <Layout>
        <div className="rounded-xl bg-white p-8 text-center shadow">
          <h1 className="text-2xl font-bold text-gray-900">
            Submission unavailable
          </h1>

          <p className="mt-2 text-gray-500">
            {error || "Submission not found."}
          </p>

          <Link
            to="/admin/submissions"
            className="mt-6 inline-block rounded-lg bg-purple-600 px-5 py-2 text-sm font-semibold text-white"
          >
            Back to Submissions
          </Link>
        </div>
      </Layout>
    );
  }

  const totalWeight = criteria.reduce(
    (total, criterion) =>
      total + Number(criterion.weight || 0),
    0
  );

  return (
    <Layout>
      <div className="mx-auto max-w-5xl space-y-6">
        <Link
          to="/admin/submissions"
          className="text-sm font-medium text-purple-600 hover:text-purple-700"
        >
          ← Back to Submissions
        </Link>

        <div>
          <p className="text-sm font-medium text-purple-600">
            Submission Review
          </p>

          <h1 className="mt-1 text-3xl font-bold text-gray-900">
            {submission.missions?.title || "Mission"}
          </h1>

          <p className="mt-2 text-gray-500">
            Review the participant's submission and scoring criteria.
          </p>
        </div>

        {/* Student */}
        <section className="rounded-xl bg-white p-6 shadow">
          <h2 className="text-xl font-bold text-gray-900">
            Student
          </h2>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <InfoCard
              label="Name"
              value={
                submission.users?.full_name ||
                "Unknown student"
              }
            />

            <InfoCard
              label="Email"
              value={submission.users?.email || "—"}
            />

            <InfoCard
              label="Submitted"
              value={
                submission.submitted_at
                  ? new Date(
                      submission.submitted_at
                    ).toLocaleString()
                  : "—"
              }
            />

            <InfoCard
              label="Status"
              value={submission.status || "Pending"}
            />
          </div>
        </section>

        {/* Mission */}
        <section className="rounded-xl bg-white p-6 shadow">
          <h2 className="text-xl font-bold text-gray-900">
            Mission
          </h2>

          <p className="mt-3 whitespace-pre-line leading-7 text-gray-600">
            {submission.missions?.description ||
              "No mission description available."}
          </p>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <InfoCard
              label="Difficulty"
              value={
                submission.missions?.difficulty || "—"
              }
            />

            <InfoCard
              label="XP Reward"
              value={`${submission.missions?.xp_reward ?? 0} XP`}
            />
          </div>
        </section>

        {/* Scoring Matrix */}
        <section className="rounded-xl bg-white p-6 shadow">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                AI Scoring Matrix
              </h2>

              <p className="mt-2 text-sm text-gray-500">
                Criteria that will be used to evaluate this submission.
              </p>
            </div>

            <span className="rounded-full bg-purple-50 px-4 py-2 text-sm font-semibold text-purple-700">
              {totalWeight}%
            </span>
          </div>

          {criteria.length === 0 ? (
            <div className="mt-5 rounded-lg bg-yellow-50 p-4 text-sm text-yellow-700">
              No scoring criteria have been configured for this mission.
            </div>
          ) : (
            <div className="mt-5 space-y-4">
              {criteria.map((criterion) => (
                <div
                  key={criterion.id}
                  className="rounded-lg border border-gray-200 p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {criterion.criterion_name}
                      </h3>

                      {criterion.criterion_description && (
                        <p className="mt-2 text-sm leading-6 text-gray-600">
                          {criterion.criterion_description}
                        </p>
                      )}
                    </div>

                    <span className="shrink-0 rounded-full bg-gray-100 px-3 py-1 text-sm font-bold text-gray-700">
                      {criterion.weight}%
                    </span>
                  </div>

                  {criterion.evaluation_instructions && (
                    <div className="mt-4 rounded-lg bg-gray-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                        AI Evaluation Instructions
                      </p>

                      <p className="mt-2 text-sm leading-6 text-gray-600">
                        {criterion.evaluation_instructions}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Submitted File */}
        <section className="rounded-xl bg-white p-6 shadow">
          <h2 className="text-xl font-bold text-gray-900">
            Submitted File
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            Download the participant's submitted Excel file.
          </p>

          {fileUrl ? (
            <a
              href={fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex rounded-lg bg-purple-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-purple-700"
            >
              Download Submission
            </a>
          ) : (
            <p className="mt-5 text-sm text-gray-500">
              Submission file unavailable.
            </p>
          )}
        </section>

        {/* AI Evaluation */}
        <section className="rounded-xl border border-purple-100 bg-purple-50 p-6">
          <h2 className="text-xl font-bold text-gray-900">
            AI Evaluation
          </h2>

          <p className="mt-2 text-sm text-gray-600">
            The AI evaluator will analyze this submission against
            the mission's scoring matrix.
          </p>

          <div className="mt-5 rounded-lg bg-white p-5">
            <p className="text-sm text-gray-500">
              Current status
            </p>

            <p className="mt-1 text-lg font-bold text-gray-900">
              {submission.status || "Pending"}
            </p>
          </div>
        </section>
      </div>
    </Layout>
  );
}

function InfoCard({ label, value }) {
  return (
    <div className="rounded-lg border border-gray-100 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
        {label}
      </p>

      <p className="mt-1 font-semibold text-gray-800">
        {value}
      </p>
    </div>
  );
}

export default AdminSubmissionDetails;