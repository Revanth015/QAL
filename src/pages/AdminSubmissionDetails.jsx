import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Layout from "../components/Layout";
import { supabase } from "../config/supabase";
import { evaluateSubmission } from "../intelligence/core/aiOrchestrator";

function AdminSubmissionDetails() {
  const { submissionId } = useParams();

  const [submission, setSubmission] = useState(null);
  const [criteria, setCriteria] = useState([]);
  const [fileUrl, setFileUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [evaluating, setEvaluating] = useState(false);
  const [evaluation, setEvaluation] = useState(null);
  const [error, setError] = useState("");
  const [evaluationError, setEvaluationError] = useState("");

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
            users (full_name, email),
            missions (id, title, description, difficulty, xp_reward)
          `)
          .eq("id", submissionId)
          .single();

        if (submissionError) throw submissionError;
        setSubmission(data);

        if (data?.feedback) {
          try {
            const parsed = typeof data.feedback === "string"
              ? JSON.parse(data.feedback)
              : data.feedback;
            if (parsed?.evaluation) setEvaluation(parsed.evaluation);
          } catch {
            // Existing plain-text feedback is still displayed below.
          }
        }

        const { data: criteriaData, error: criteriaError } = await supabase
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

        if (criteriaError) throw criteriaError;
        setCriteria(criteriaData || []);

        if (data?.submission_file) {
          const { data: signedData, error: signedError } = await supabase.storage
            .from("qal-submissions")
            .createSignedUrl(data.submission_file, 60 * 60);

          if (signedError) throw signedError;
          setFileUrl(signedData?.signedUrl || null);
        }
      } catch (err) {
        console.error("Failed to load submission:", err);
        setError(err.message || "Unable to load submission.");
      } finally {
        setLoading(false);
      }
    }

    loadSubmission();
  }, [submissionId]);

  async function handleEvaluate() {
    if (!submission?.submission_file || !criteria.length) {
      setEvaluationError("A submission file and at least one scoring criterion are required.");
      return;
    }

    setEvaluating(true);
    setEvaluationError("");

    try {
      const response = await fetch(fileUrl);
      if (!response.ok) throw new Error("Unable to download the submitted workbook for evaluation.");

      const blob = await response.blob();
      const fileName = submission.submission_file.split("/").pop() || "submission.xlsx";
      const file = new File([blob], fileName, { type: blob.type || "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });

      const mission = {
        id: submission.missions.id,
        title: submission.missions.title,
        description: submission.missions.description,
        difficulty: submission.missions.difficulty,
        xp_reward: submission.missions.xp_reward,
        criteria: criteria.map((criterion) => ({
          name: criterion.criterion_name,
          description: criterion.criterion_description,
          weight: Number(criterion.weight) || 0,
          maxScore: Number(criterion.max_score) || 100,
          instructions: criterion.evaluation_instructions || "",
        })),
      };

      const result = await evaluateSubmission({ file, mission });
      setEvaluation(result.evaluation);

      const feedbackPayload = {
        evaluation: result.evaluation,
        feedback: result.feedback,
        provider: result.provider,
        version: result.version,
        evaluated_at: new Date().toISOString(),
      };

      const { data: updated, error: updateError } = await supabase
        .from("submissions")
        .update({
          score: result.evaluation.finalScore,
          feedback: JSON.stringify(feedbackPayload),
          status: "Evaluated",
        })
        .eq("id", submission.id)
        .select()
        .single();

      if (updateError) throw updateError;
      setSubmission((current) => ({ ...current, ...updated }));
    } catch (err) {
      console.error("AI evaluation failed:", err);
      setEvaluationError(err.message || "AI evaluation failed.");
    } finally {
      setEvaluating(false);
    }
  }

  if (loading) {
    return <Layout><div className="flex min-h-[60vh] items-center justify-center"><p className="text-gray-500">Loading submission...</p></div></Layout>;
  }

  if (error || !submission) {
    return (
      <Layout>
        <div className="rounded-xl bg-white p-8 text-center shadow">
          <h1 className="text-2xl font-bold text-gray-900">Submission unavailable</h1>
          <p className="mt-2 text-gray-500">{error || "Submission not found."}</p>
          <Link to="/admin/submissions" className="mt-6 inline-block rounded-lg bg-purple-600 px-5 py-2 text-sm font-semibold text-white">Back to Submissions</Link>
        </div>
      </Layout>
    );
  }

  const totalWeight = criteria.reduce((total, criterion) => total + Number(criterion.weight || 0), 0);

  return (
    <Layout>
      <div className="mx-auto max-w-5xl space-y-6">
        <Link to="/admin/submissions" className="text-sm font-medium text-purple-600 hover:text-purple-700">← Back to Submissions</Link>

        <div>
          <p className="text-sm font-medium text-purple-600">Submission Review</p>
          <h1 className="mt-1 text-3xl font-bold text-gray-900">{submission.missions?.title || "Mission"}</h1>
          <p className="mt-2 text-gray-500">Review the participant's submission and run the QAL Intelligence evaluator.</p>
        </div>

        <section className="rounded-xl bg-white p-6 shadow">
          <h2 className="text-xl font-bold text-gray-900">Student</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <InfoCard label="Name" value={submission.users?.full_name || "Unknown student"} />
            <InfoCard label="Email" value={submission.users?.email || "—"} />
            <InfoCard label="Submitted" value={submission.submitted_at ? new Date(submission.submitted_at).toLocaleString() : "—"} />
            <InfoCard label="Status" value={submission.status || "Pending"} />
          </div>
        </section>

        <section className="rounded-xl bg-white p-6 shadow">
          <h2 className="text-xl font-bold text-gray-900">Mission</h2>
          <p className="mt-3 whitespace-pre-line leading-7 text-gray-600">{submission.missions?.description || "No mission description available."}</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <InfoCard label="Difficulty" value={submission.missions?.difficulty || "—"} />
            <InfoCard label="XP Reward" value={`${submission.missions?.xp_reward ?? 0} XP`} />
          </div>
        </section>

        <section className="rounded-xl bg-white p-6 shadow">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">AI Scoring Matrix</h2>
              <p className="mt-2 text-sm text-gray-500">Criteria used by the QAL evaluation engine.</p>
            </div>
            <span className="rounded-full bg-purple-50 px-4 py-2 text-sm font-semibold text-purple-700">{totalWeight}%</span>
          </div>

          {criteria.length === 0 ? (
            <div className="mt-5 rounded-lg bg-yellow-50 p-4 text-sm text-yellow-700">No scoring criteria have been configured for this mission.</div>
          ) : (
            <div className="mt-5 space-y-4">
              {criteria.map((criterion) => (
                <div key={criterion.id} className="rounded-lg border border-gray-200 p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-semibold text-gray-900">{criterion.criterion_name}</h3>
                      {criterion.criterion_description && <p className="mt-2 text-sm leading-6 text-gray-600">{criterion.criterion_description}</p>}
                    </div>
                    <span className="shrink-0 rounded-full bg-gray-100 px-3 py-1 text-sm font-bold text-gray-700">{criterion.weight}%</span>
                  </div>
                  {criterion.evaluation_instructions && <div className="mt-4 rounded-lg bg-gray-50 p-4"><p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Evaluation Instructions</p><p className="mt-2 text-sm leading-6 text-gray-600">{criterion.evaluation_instructions}</p></div>}
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-xl bg-white p-6 shadow">
          <h2 className="text-xl font-bold text-gray-900">Submitted File</h2>
          <p className="mt-2 text-sm text-gray-500">Download the participant's submitted Excel file.</p>
          {fileUrl ? <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex rounded-lg bg-purple-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-purple-700">Download Submission</a> : <p className="mt-5 text-sm text-gray-500">Submission file unavailable.</p>}
        </section>

        <section className="rounded-xl border border-purple-100 bg-purple-50 p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">QAL Intelligence Evaluation</h2>
              <p className="mt-2 text-sm text-gray-600">Reads the workbook, understands the mission, extracts evidence, scores each criterion and generates feedback.</p>
            </div>
            <button type="button" onClick={handleEvaluate} disabled={evaluating || !fileUrl || !criteria.length} className="rounded-lg bg-purple-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50">
              {evaluating ? "Evaluating..." : evaluation ? "Run Evaluation Again" : "Run AI Evaluation"}
            </button>
          </div>

          {evaluationError && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{evaluationError}</p>}

          {evaluation && (
            <div className="mt-6 space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <InfoCard label="Final Score" value={`${evaluation.finalScore}/100`} />
                <InfoCard label="Criteria" value={evaluation.criteria?.length || 0} />
                <InfoCard label="Status" value="Evaluated" />
              </div>

              <div className="space-y-3">
                {(evaluation.criteria || []).map((item) => (
                  <div key={item.criterion} className="rounded-lg bg-white p-4">
                    <div className="flex items-center justify-between gap-4">
                      <span className="font-semibold text-gray-900">{item.criterion}</span>
                      <span className="font-bold text-purple-600">{item.score}/100</span>
                    </div>
                    <p className="mt-2 text-xs text-gray-500">Confidence: {Math.round((item.confidence || 0) * 100)}%</p>
                    {item.evidence?.length > 0 && <p className="mt-2 text-sm text-gray-600">Evidence detected: {item.evidence.length}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>
    </Layout>
  );
}

function InfoCard({ label, value }) {
  return <div className="rounded-lg border border-gray-100 p-4"><p className="text-xs font-medium uppercase tracking-wide text-gray-400">{label}</p><p className="mt-1 font-semibold text-gray-800">{value}</p></div>;
}

export default AdminSubmissionDetails;
