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
  const [publishing, setPublishing] = useState(false);
  const [evaluation, setEvaluation] = useState(null);
  const [finalScore, setFinalScore] = useState(0);
  const [finalFeedback, setFinalFeedback] = useState("");
  const [error, setError] = useState("");
  const [evaluationError, setEvaluationError] = useState("");
  const [publishMessage, setPublishMessage] = useState("");

  useEffect(() => {
    async function loadSubmission() {
      try {
        const { data, error: submissionError } = await supabase.from("submissions").select(`id, user_id, mission_id, submission_file, score, feedback, status, submitted_at, users (full_name, email), missions (id, title, description, difficulty, xp_reward)`).eq("id", submissionId).single();
        if (submissionError) throw submissionError;
        setSubmission(data);
        setFinalScore(Number(data.score || 0));
        if (data?.feedback) {
          try {
            const parsed = typeof data.feedback === "string" ? JSON.parse(data.feedback) : data.feedback;
            if (parsed?.evaluation) {
              setEvaluation({ ...parsed.evaluation, aiReview: parsed.aiReview, analysis: parsed.analysis, understanding: parsed.understanding, aiStatus: parsed.aiStatus, provider: parsed.provider });
              setFinalFeedback(parsed.finalFeedback || parsed.feedback || "");
            } else setFinalFeedback(data.feedback);
          } catch { setFinalFeedback(data.feedback); }
        }
        const { data: criteriaData, error: criteriaError } = await supabase.from("mission_scoring_criteria").select("id, criterion_name, criterion_description, weight, max_score, evaluation_instructions").eq("mission_id", data.mission_id).order("id");
        if (criteriaError) throw criteriaError;
        setCriteria(criteriaData || []);
        if (data?.submission_file) {
          const { data: signedData, error: signedError } = await supabase.storage.from("qal-submissions").createSignedUrl(data.submission_file, 60 * 60);
          if (signedError) throw signedError;
          setFileUrl(signedData?.signedUrl || null);
        }
      } catch (err) {
        console.error("Failed to load submission:", err);
        setError(err.message || "Unable to load submission.");
      } finally { setLoading(false); }
    }
    loadSubmission();
  }, [submissionId]);

  async function handleEvaluate() {
    if (!submission?.submission_file || !criteria.length || !fileUrl) { setEvaluationError("A submission file, signed file URL and at least one scoring criterion are required."); return; }
    setEvaluating(true); setEvaluationError(""); setPublishMessage("");
    try {
      const response = await fetch(fileUrl);
      if (!response.ok) throw new Error("Unable to download the submitted workbook for evaluation.");
      const blob = await response.blob();
      const fileName = submission.submission_file.split("/").pop() || "submission.xlsx";
      const file = new File([blob], fileName, { type: blob.type || "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const mission = { id: submission.missions.id, title: submission.missions.title, description: submission.missions.description, difficulty: submission.missions.difficulty, xp_reward: submission.missions.xp_reward, criteria: criteria.map((c) => ({ name: c.criterion_name, description: c.criterion_description, weight: Number(c.weight) || 0, maxScore: Number(c.max_score) || 100, instructions: c.evaluation_instructions || "" })) };
      const result = await evaluateSubmission({ file, mission });
      const displayEvaluation = { ...result.evaluation, analysis: result.analysis, understanding: result.understanding, aiReview: result.aiReview, aiStatus: result.aiStatus, provider: result.provider, feedback: result.feedback };
      setEvaluation(displayEvaluation);
      setFinalScore(Math.round(result.evaluation.finalScore));
      setFinalFeedback(result.feedback || result.aiReview?.overallAssessment || "");
      const feedbackPayload = { evaluation: result.evaluation, analysis: result.analysis, understanding: result.understanding, aiReview: result.aiReview, feedback: result.feedback, provider: result.provider, aiStatus: result.aiStatus, version: result.version, evaluated_at: new Date().toISOString(), publication: null };
      const { error: updateError } = await supabase.from("submissions").update({ score: Math.round(result.evaluation.finalScore), feedback: JSON.stringify(feedbackPayload), status: "Evaluated" }).eq("id", submission.id);
      if (updateError) throw updateError;
      setSubmission((current) => ({ ...current, score: Math.round(result.evaluation.finalScore), feedback: JSON.stringify(feedbackPayload), status: "Evaluated" }));
    } catch (err) { console.error("AI evaluation failed:", err); setEvaluationError(err.message || "QAL evaluation failed."); }
    finally { setEvaluating(false); }
  }

  async function publishResult() {
    const score = Number(finalScore);
    if (!Number.isFinite(score) || score < 0 || score > 100) { setEvaluationError("Final score must be a number between 0 and 100."); return; }
    if (!String(finalFeedback).trim()) { setEvaluationError("Please provide feedback before publishing the result."); return; }
    setPublishing(true); setEvaluationError(""); setPublishMessage("");
    try {
      let existing = {};
      if (submission.feedback) { try { existing = typeof submission.feedback === "string" ? JSON.parse(submission.feedback) : submission.feedback; } catch { existing = {}; } }
      const publishedAt = new Date().toISOString();
      const payload = { ...existing, finalFeedback: String(finalFeedback).trim(), publication: { published: true, published_at: publishedAt, published_score: score, source: evaluation ? "admin_approved_or_edited_ai_evaluation" : "admin_manual_review" } };
      const { error: updateError } = await supabase.from("submissions").update({ score, feedback: JSON.stringify(payload), status: "Published" }).eq("id", submission.id);
      if (updateError) throw updateError;
      setSubmission((current) => ({ ...current, score, feedback: JSON.stringify(payload), status: "Published" }));
      setPublishMessage(`Result published successfully. The student can now see ${score}/100.`);
    } catch (err) { console.error("Failed to publish result:", err); setEvaluationError(err.message || "Unable to publish result."); }
    finally { setPublishing(false); }
  }

  if (loading) return <Layout><div className="flex min-h-[60vh] items-center justify-center"><p className="text-gray-500">Loading submission...</p></div></Layout>;
  if (error || !submission) return <Layout><div className="rounded-xl bg-white p-8 text-center shadow"><h1 className="text-2xl font-bold text-gray-900">Submission unavailable</h1><p className="mt-2 text-gray-500">{error || "Submission not found."}</p><Link to="/admin/submissions" className="mt-6 inline-block rounded-lg bg-purple-600 px-5 py-2 text-sm font-semibold text-white">Back to Submissions</Link></div></Layout>;

  const totalWeight = criteria.reduce((sum, c) => sum + Number(c.weight || 0), 0);
  const analysis = evaluation?.analysis;
  const understanding = evaluation?.understanding;
  const aiReview = evaluation?.aiReview;

  return <Layout><div className="mx-auto max-w-6xl space-y-6">
    <Link to="/admin/submissions" className="text-sm font-medium text-purple-600">← Back to Submissions</Link>
    <div><p className="text-sm font-medium text-purple-600">Submission Review</p><h1 className="mt-1 text-3xl font-bold text-gray-900">{submission.missions?.title || "Mission"}</h1><p className="mt-2 text-gray-500">Review QAL's evaluation, make corrections if required, and publish the official result.</p></div>
    <section className="rounded-xl bg-white p-6 shadow"><h2 className="text-xl font-bold text-gray-900">Student</h2><div className="mt-4 grid gap-4 sm:grid-cols-2"><InfoCard label="Name" value={submission.users?.full_name || "Unknown student"}/><InfoCard label="Email" value={submission.users?.email || "—"}/><InfoCard label="Submitted" value={submission.submitted_at ? new Date(submission.submitted_at).toLocaleString() : "—"}/><InfoCard label="Status" value={submission.status || "Pending"}/></div></section>
    <section className="rounded-xl bg-white p-6 shadow"><h2 className="text-xl font-bold text-gray-900">Mission</h2><p className="mt-3 whitespace-pre-line leading-7 text-gray-600">{submission.missions?.description || "No mission description available."}</p><div className="mt-5 grid gap-4 sm:grid-cols-2"><InfoCard label="Difficulty" value={submission.missions?.difficulty || "—"}/><InfoCard label="XP Reward" value={`${submission.missions?.xp_reward ?? 0} XP`}/></div></section>
    <section className="rounded-xl bg-white p-6 shadow"><div className="flex items-center justify-between"><div><h2 className="text-xl font-bold text-gray-900">AI Scoring Matrix</h2><p className="mt-2 text-sm text-gray-500">Criteria supplied to the QAL evaluator.</p></div><span className="rounded-full bg-purple-50 px-4 py-2 text-sm font-semibold text-purple-700">{totalWeight}%</span></div><div className="mt-5 space-y-3">{criteria.map((c)=><div key={c.id} className="rounded-lg border border-gray-200 p-4"><div className="flex items-center justify-between"><h3 className="font-semibold text-gray-900">{c.criterion_name}</h3><span className="font-bold text-purple-600">{c.weight}%</span></div><p className="mt-2 text-sm text-gray-600">{c.criterion_description || "No description"}</p>{c.evaluation_instructions&&<p className="mt-2 rounded bg-gray-50 p-3 text-xs text-gray-500"><strong>Evaluation instructions:</strong> {c.evaluation_instructions}</p>}</div>)}</div></section>
    <section className="rounded-xl border border-purple-200 bg-purple-50 p-6 shadow-sm"><div className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-widest text-purple-600">QAL Intelligence Engine</p><h2 className="mt-1 text-2xl font-bold text-gray-900">Workbook → Evidence → Evaluation → AI Review</h2><p className="mt-2 max-w-3xl text-sm text-gray-600">QAL reads the workbook, maps each criterion to evidence, computes the proposed score, and asks the live AI gateway to review the evidence.</p></div><button type="button" onClick={handleEvaluate} disabled={evaluating||publishing||!fileUrl||!criteria.length||submission.status==="Published"} className="rounded-lg bg-purple-600 px-5 py-3 font-semibold text-white hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50">{evaluating?"QAL is working...":evaluation?"Run QAL Again":"Run QAL Intelligence"}</button></div>{evaluationError&&<p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{evaluationError}</p>}{publishMessage&&<p className="mt-4 rounded-lg bg-green-50 p-3 text-sm font-medium text-green-700">{publishMessage}</p>}
      {evaluation&&<div className="mt-6 space-y-6"><div className="grid gap-4 sm:grid-cols-4"><InfoCard label="Proposed Score" value={`${evaluation.finalScore}/100`}/><InfoCard label="Criteria" value={evaluation.criteria?.length||0}/><InfoCard label="AI Status" value={evaluation.aiStatus==="live-ai"?"Live AI":"Deterministic"}/><InfoCard label="Provider" value={evaluation.provider||"QAL"}/></div>
      <div className="rounded-xl bg-white p-5"><h3 className="font-bold text-gray-900">1. Workbook scan</h3><div className="mt-3 grid gap-3 sm:grid-cols-4"><InfoCard label="Sheets" value={analysis?.totalSheets??"—"}/><InfoCard label="Columns" value={understanding?.workbook?.columnsFound??"—"}/><InfoCard label="Warnings" value={analysis?.warnings?.length??0}/><InfoCard label="Ignored sheets" value={understanding?.workbook?.ignoredSheets?.join(", ")||"None"}/></div>{analysis?.warnings?.length>0&&<div className="mt-3 space-y-2">{analysis.warnings.map(w=><p key={w} className="rounded bg-yellow-50 p-2 text-xs text-yellow-700">{w}</p>)}</div>}</div>
      <div className="rounded-xl bg-white p-5"><h3 className="font-bold text-gray-900">2. Mission understanding</h3><p className="mt-1 text-sm text-gray-500">Criterion-specific column mapping produced by QAL.</p><div className="mt-4 space-y-3">{(understanding?.criterionAnalysis||[]).map(item=><div key={item.criterion} className="rounded-lg border border-gray-200 p-4"><div className="flex items-center justify-between"><span className="font-semibold text-gray-900">{item.criterion}</span><span className="text-xs text-purple-600">{item.weight}%</span></div><div className="mt-2 flex flex-wrap gap-2">{(item.requiredCapabilities||[]).map(cap=><span key={cap} className="rounded-full bg-purple-50 px-2 py-1 text-xs text-purple-700">{cap}</span>)}</div><p className="mt-3 text-sm text-gray-600">Relevant columns: {(item.relevantColumns||[]).map(c=>`${c.sheet}.${c.column}`).join(", ")||"None detected"}</p></div>)}</div></div>
      <div className="rounded-xl bg-white p-5"><h3 className="font-bold text-gray-900">3. Evidence and scoring</h3><div className="mt-4 space-y-3">{(evaluation.criteria||[]).map(item=><div key={item.criterion} className="rounded-lg border border-gray-200 p-4"><div className="flex items-center justify-between"><span className="font-semibold text-gray-900">{item.criterion}</span><span className="font-bold text-purple-600">{item.score}/100</span></div><p className="mt-1 text-xs text-gray-500">Confidence: {Math.round((item.confidence||0)*100)}% · Evidence items: {item.evidence?.length||0}</p><div className="mt-3 space-y-2">{(item.evidence||[]).map((e,i)=><EvidenceCard key={`${item.criterion}-${i}`} evidence={e}/>)}</div></div>)}</div></div>
      <div className="rounded-xl bg-gray-950 p-5 text-white"><div className="flex items-center justify-between"><div><p className="text-xs font-semibold uppercase tracking-widest text-purple-300">4. Live AI reviewer</p><h3 className="mt-1 text-xl font-bold">AI interpretation of the evidence</h3></div><span className="text-xs text-gray-400">{aiReview?.model||aiReview?.provider||"Fallback"}</span></div><p className="mt-4 text-sm leading-6 text-gray-300">{aiReview?.overallAssessment||"No live AI review available."}</p>{aiReview?.businessInsight&&<div className="mt-4 rounded-lg bg-white/10 p-4"><p className="text-xs font-semibold uppercase tracking-wide text-purple-300">Business insight</p><p className="mt-1 text-sm text-gray-200">{aiReview.businessInsight}</p></div>}<div className="mt-4 grid gap-4 sm:grid-cols-2"><div><p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Strengths</p><ul className="mt-2 space-y-1 text-sm text-gray-300">{(aiReview?.strengths||[]).map(x=><li key={x}>• {x}</li>)}</ul></div><div><p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Improvements</p><ul className="mt-2 space-y-1 text-sm text-gray-300">{(aiReview?.improvements||[]).map(x=><li key={x}>• {x}</li>)}</ul></div></div></div></div>}
    </section>
    {submission.status!=="Published"&&(evaluation||submission.status==="Evaluated")&&<section className="rounded-xl border-2 border-green-200 bg-green-50 p-6 shadow-sm"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-widest text-green-700">Admin approval</p><h2 className="mt-1 text-2xl font-bold text-gray-900">Final Score & Publish</h2><p className="mt-2 text-sm text-gray-600">Accept QAL's proposed score or correct it before publishing. The student will not see the result until you publish it.</p></div><span className="rounded-full bg-white px-4 py-2 text-sm font-bold text-green-700">Not Published</span></div><div className="mt-5 grid gap-5 md:grid-cols-[220px_1fr]"><div><label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Official score / 100</label><input type="number" min="0" max="100" step="1" value={finalScore} onChange={e=>setFinalScore(e.target.value)} className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-2xl font-bold text-gray-900"/></div><div><label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Official feedback</label><textarea value={finalFeedback} onChange={e=>setFinalFeedback(e.target.value)} rows={6} className="mt-2 w-full rounded-lg border border-gray-300 bg-white p-4 text-sm leading-6 text-gray-800" placeholder="Write the feedback the student should receive..."/></div></div><div className="mt-5 flex flex-wrap gap-3"><button type="button" onClick={publishResult} disabled={publishing||evaluating} className="rounded-lg bg-green-600 px-6 py-3 font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50">{publishing?"Publishing...":"Accept / Edit & Publish Result"}</button><button type="button" onClick={()=>{setFinalScore(Math.round(evaluation?.finalScore||submission.score||0));setFinalFeedback(evaluation?.feedback||evaluation?.aiReview?.overallAssessment||"")}} className="rounded-lg border border-gray-300 bg-white px-5 py-3 font-semibold text-gray-700">Reset to QAL Proposal</button></div></section>}
    {submission.status==="Published"&&<section className="rounded-xl border-2 border-green-200 bg-green-50 p-6"><p className="text-xs font-semibold uppercase tracking-widest text-green-700">Published result</p><h2 className="mt-1 text-2xl font-bold text-gray-900">{submission.score}/100</h2><p className="mt-2 text-sm text-gray-600">This result has been published and is visible to the student.</p></section>}
    <section className="rounded-xl bg-white p-6 shadow"><h2 className="text-xl font-bold text-gray-900">Submitted File</h2><p className="mt-2 text-sm text-gray-500">Download the participant's submitted Excel file.</p>{fileUrl?<a href={fileUrl} target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex rounded-lg bg-purple-600 px-5 py-2.5 text-sm font-semibold text-white">Download Submission</a>:<p className="mt-5 text-sm text-gray-500">Submission file unavailable.</p>}</section>
  </div></Layout>;
}
function InfoCard({label,value}){return <div className="rounded-lg border border-gray-100 p-4"><p className="text-xs font-medium uppercase tracking-wide text-gray-400">{label}</p><p className="mt-1 font-semibold text-gray-800">{value}</p></div>}
function EvidenceCard({evidence}){if(evidence.type==="aggregation")return <div className="rounded-lg bg-green-50 p-3"><p className="text-xs font-semibold text-green-700">Aggregation</p><p className="mt-1 text-xs text-gray-600">{evidence.operation}</p><div className="mt-2 grid gap-1 sm:grid-cols-2">{(evidence.result||[]).map(row=><div key={row.group} className="flex justify-between rounded bg-white px-2 py-1 text-xs"><span>{row.group}</span><strong>{row.total}</strong></div>)}</div></div>;if(evidence.type==="column")return <div className="rounded-lg bg-gray-50 p-3 text-xs text-gray-600"><strong>{evidence.sheet}.{evidence.column}</strong> · {evidence.semanticType} · relevance {evidence.relevanceScore??"—"}</div>;return <div className="rounded-lg bg-yellow-50 p-3 text-xs text-yellow-700"><strong>{evidence.type}</strong> · {Array.isArray(evidence.value)?evidence.value.join("; "):String(evidence.value)}</div>}
export default AdminSubmissionDetails;
