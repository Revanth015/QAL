import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Layout from "../components/Layout";
import { supabase } from "../config/supabase";
import { evaluateSubmission } from "../intelligence/core/aiOrchestrator";

function parseFeedback(value) {
  if (!value) return {};
  if (typeof value === "object") return value;
  try { return JSON.parse(value); } catch { return { feedback: value }; }
}

function AdminSubmissionDetails() {
  const { submissionId } = useParams();
  const [submission, setSubmission] = useState(null);
  const [criteria, setCriteria] = useState([]);
  const [fileUrl, setFileUrl] = useState(null);
  const [evaluation, setEvaluation] = useState(null);
  const [finalScore, setFinalScore] = useState(0);
  const [finalFeedback, setFinalFeedback] = useState("");
  const [loading, setLoading] = useState(true);
  const [evaluating, setEvaluating] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function loadSubmission() {
    setLoading(true);
    setError("");
    try {
      const { data, error: submissionError } = await supabase
        .from("submissions")
        .select("id,user_id,mission_id,submission_file,score,feedback,status,submitted_at,users(full_name,email),missions(id,title,description,difficulty,xp_reward)")
        .eq("id", submissionId)
        .single();
      if (submissionError) throw submissionError;
      setSubmission(data);
      setFinalScore(Number(data.score || 0));
      const payload = parseFeedback(data.feedback);
      if (payload.evaluation) {
        setEvaluation({ ...payload.evaluation, analysis: payload.analysis, understanding: payload.understanding, aiReview: payload.aiReview, aiStatus: payload.aiStatus, provider: payload.provider });
      }
      setFinalFeedback(payload.finalFeedback || payload.feedback || "");

      const { data: criteriaData, error: criteriaError } = await supabase
        .from("mission_scoring_criteria")
        .select("id,criterion_name,criterion_description,weight,max_score,evaluation_instructions")
        .eq("mission_id", data.mission_id)
        .order("id");
      if (criteriaError) throw criteriaError;
      setCriteria(criteriaData || []);

      if (data.submission_file) {
        const { data: signedData, error: signedError } = await supabase.storage
          .from("qal-submissions")
          .createSignedUrl(data.submission_file, 3600);
        if (signedError) throw signedError;
        setFileUrl(signedData?.signedUrl || null);
      }
    } catch (err) {
      console.error("Failed to load submission:", err);
      setError(err.message || "Unable to load submission.");
    } finally { setLoading(false); }
  }

  useEffect(() => { loadSubmission(); }, [submissionId]);

  async function handleEvaluate() {
    if (!submission?.submission_file || !fileUrl || !criteria.length) {
      setError("A submission file, signed URL and scoring criteria are required.");
      return;
    }
    setEvaluating(true); setError(""); setMessage("");
    try {
      const response = await fetch(fileUrl);
      if (!response.ok) throw new Error("Unable to download the submitted workbook.");
      const blob = await response.blob();
      const fileName = submission.submission_file.split("/").pop() || "submission.xlsx";
      const file = new File([blob], fileName, { type: blob.type || "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const mission = {
        id: submission.missions.id,
        title: submission.missions.title,
        description: submission.missions.description,
        difficulty: submission.missions.difficulty,
        xp_reward: submission.missions.xp_reward,
        criteria: criteria.map(c => ({ name: c.criterion_name, description: c.criterion_description, weight: Number(c.weight) || 0, maxScore: Number(c.max_score) || 100, instructions: c.evaluation_instructions || "" }))
      };
      const result = await evaluateSubmission({ file, mission });
      const score = Math.round(result.evaluation.finalScore);
      const feedbackPayload = {
        evaluation: result.evaluation,
        analysis: result.analysis,
        understanding: result.understanding,
        aiReview: result.aiReview,
        feedback: result.feedback,
        provider: result.provider,
        aiStatus: result.aiStatus,
        version: result.version,
        evaluated_at: new Date().toISOString(),
        publication: null
      };
      const { data: updated, error: updateError } = await supabase
        .from("submissions")
        .update({ score, feedback: JSON.stringify(feedbackPayload), status: "Evaluated" })
        .eq("id", submission.id)
        .select("id,score,status,feedback")
        .single();
      if (updateError) throw updateError;
      if (!updated || updated.status !== "Evaluated") throw new Error("The evaluation was not persisted correctly.");
      setEvaluation({ ...result.evaluation, analysis: result.analysis, understanding: result.understanding, aiReview: result.aiReview, aiStatus: result.aiStatus, provider: result.provider });
      setFinalScore(score);
      setFinalFeedback(result.feedback || result.aiReview?.overallAssessment || "");
      setSubmission(s => ({ ...s, ...updated }));
      setMessage(`QAL evaluation saved: ${score}/100. It is waiting for admin publication.`);
    } catch (err) {
      console.error("AI evaluation failed:", err);
      setError(err.message || "QAL evaluation failed.");
    } finally { setEvaluating(false); }
  }

  async function publishResult() {
    const score = Number(finalScore);
    if (!Number.isFinite(score) || score < 0 || score > 100) { setError("Final score must be between 0 and 100."); return; }
    if (!String(finalFeedback).trim()) { setError("Please provide feedback before publishing."); return; }
    setPublishing(true); setError(""); setMessage("");
    try {
      const existing = parseFeedback(submission.feedback);
      const publishedAt = new Date().toISOString();
      const payload = {
        ...existing,
        finalFeedback: String(finalFeedback).trim(),
        publication: {
          published: true,
          published_at: publishedAt,
          published_score: score,
          source: evaluation ? "admin_approved_or_edited_ai_evaluation" : "admin_manual_review"
        }
      };

      const { data: updated, error: updateError } = await supabase
        .from("submissions")
        .update({ score, feedback: JSON.stringify(payload), status: "Published" })
        .eq("id", submission.id)
        .select("id,user_id,mission_id,score,feedback,status,submitted_at")
        .single();
      if (updateError) throw updateError;
      if (!updated) throw new Error("Supabase returned no updated submission.");
      if (String(updated.status).toLowerCase() !== "published") {
        throw new Error(`Publish was not persisted. Database returned status: ${updated.status || "empty"}. Check the admin UPDATE RLS policy.`);
      }
      if (Number(updated.score) !== score) {
        throw new Error(`Publish was not persisted. Database returned score ${updated.score} instead of ${score}.`);
      }

      setSubmission(s => ({ ...s, ...updated }));
      setMessage(`Official result published successfully: ${updated.score}/100. The student can now see this result.`);
    } catch (err) {
      console.error("Failed to publish result:", err);
      setError(err.message || "Unable to publish result.");
    } finally { setPublishing(false); }
  }

  if (loading) return <Layout><div className="flex min-h-[60vh] items-center justify-center"><p className="text-gray-500">Loading submission...</p></div></Layout>;
  if (error && !submission) return <Layout><div className="rounded-xl bg-white p-8 text-center shadow"><h1 className="text-2xl font-bold">Submission unavailable</h1><p className="mt-2 text-red-500">{error}</p><Link to="/admin/submissions" className="mt-6 inline-block rounded-lg bg-purple-600 px-5 py-2 text-white">Back to Submissions</Link></div></Layout>;

  return <Layout><div className="mx-auto max-w-5xl space-y-6">
    <Link to="/admin/submissions" className="text-sm font-medium text-purple-600">← Back to Submissions</Link>
    <div><p className="text-sm font-medium text-purple-600">Submission Review</p><h1 className="mt-1 text-3xl font-bold text-gray-900">{submission.missions?.title || "Mission"}</h1><p className="mt-2 text-gray-500">AI proposes the evaluation. Admin controls the official published result.</p></div>

    <section className="rounded-xl bg-white p-6 shadow"><div className="grid gap-4 sm:grid-cols-4"><InfoCard label="Student" value={submission.users?.full_name || "Unknown"}/><InfoCard label="Submitted" value={submission.submitted_at ? new Date(submission.submitted_at).toLocaleString() : "—"}/><InfoCard label="Status" value={submission.status}/><InfoCard label="Current Score" value={`${submission.score ?? 0}/100`}/></div></section>

    {error && <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</div>}
    {message && <div className="rounded-lg bg-green-50 p-4 text-sm font-medium text-green-700">{message}</div>}

    <section className="rounded-xl bg-white p-6 shadow"><h2 className="text-xl font-bold">Scoring Criteria</h2><div className="mt-4 space-y-3">{criteria.map(c=><div key={c.id} className="rounded-lg border p-4"><div className="flex justify-between gap-4"><strong>{c.criterion_name}</strong><span className="font-bold text-purple-600">{c.weight}%</span></div><p className="mt-2 text-sm text-gray-600">{c.criterion_description || "No description"}</p></div>)}</div></section>

    <section className="rounded-xl border border-purple-200 bg-purple-50 p-6 shadow-sm"><div className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-widest text-purple-600">QAL Intelligence</p><h2 className="mt-1 text-2xl font-bold">Evaluate Submission</h2><p className="mt-2 text-sm text-gray-600">Reads the workbook, checks evidence and process, calculates the proposed score, and uses the AI gateway for review.</p></div><button type="button" onClick={handleEvaluate} disabled={evaluating||publishing||!fileUrl||!criteria.length||submission.status === "Published"} className="rounded-lg bg-purple-600 px-5 py-3 font-semibold text-white hover:bg-purple-700 disabled:opacity-50">{evaluating ? "QAL is working..." : evaluation ? "Run QAL Again" : "Run QAL Intelligence"}</button></div>{evaluation&&<div className="mt-6 grid gap-4 sm:grid-cols-4"><InfoCard label="Proposed Score" value={`${evaluation.finalScore}/100`}/><InfoCard label="Criteria" value={evaluation.criteria?.length || 0}/><InfoCard label="AI Status" value={evaluation.aiStatus === "live-ai" ? "Live AI" : "Deterministic"}/><InfoCard label="Provider" value={evaluation.provider || "QAL"}/></div>}</section>

    {submission.status !== "Published" && (evaluation || submission.status === "Evaluated") && <section className="rounded-xl border-2 border-green-200 bg-green-50 p-6 shadow-sm"><p className="text-xs font-semibold uppercase tracking-widest text-green-700">Admin Approval</p><h2 className="mt-1 text-2xl font-bold">Final Score & Publish</h2><p className="mt-2 text-sm text-gray-600">Accept or edit QAL's score. Nothing is visible to the student until this update is verified as Published.</p><div className="mt-5 grid gap-5 md:grid-cols-[220px_1fr]"><div><label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Official score / 100</label><input type="number" min="0" max="100" step="1" value={finalScore} onChange={e=>setFinalScore(e.target.value)} className="mt-2 w-full rounded-lg border bg-white px-4 py-3 text-2xl font-bold"/></div><div><label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Official feedback</label><textarea value={finalFeedback} onChange={e=>setFinalFeedback(e.target.value)} rows={6} className="mt-2 w-full rounded-lg border bg-white p-4" placeholder="Feedback visible to the student..."/></div></div><div className="mt-5 flex flex-wrap gap-3"><button type="button" onClick={publishResult} disabled={publishing||evaluating} className="rounded-lg bg-green-600 px-6 py-3 font-semibold text-white hover:bg-green-700 disabled:opacity-50">{publishing ? "Publishing & verifying..." : "Accept / Edit & Publish Result"}</button><button type="button" onClick={()=>{setFinalScore(Math.round(evaluation?.finalScore||submission.score||0));setFinalFeedback(evaluation?.feedback||evaluation?.aiReview?.overallAssessment||"")}} className="rounded-lg border bg-white px-5 py-3 font-semibold">Reset to QAL Proposal</button></div></section>}

    {submission.status === "Published" && <section className="rounded-xl border-2 border-green-200 bg-green-50 p-6"><p className="text-xs font-semibold uppercase tracking-widest text-green-700">Official Result</p><h2 className="mt-1 text-3xl font-bold">{submission.score}/100</h2><p className="mt-2 text-sm text-gray-600">Verified as Published in Supabase. The student can now retrieve this result.</p></section>}

    <section className="rounded-xl bg-white p-6 shadow"><h2 className="text-xl font-bold">Submitted File</h2>{fileUrl?<a href={fileUrl} target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex rounded-lg bg-purple-600 px-5 py-2.5 text-sm font-semibold text-white">Download Submission</a>:<p className="mt-3 text-sm text-gray-500">Submission file unavailable.</p>}</section>
  </div></Layout>;
}

function InfoCard({ label, value }) { return <div className="rounded-lg border border-gray-100 p-4"><p className="text-xs font-medium uppercase tracking-wide text-gray-400">{label}</p><p className="mt-1 font-semibold text-gray-800">{value}</p></div>; }

export default AdminSubmissionDetails;
