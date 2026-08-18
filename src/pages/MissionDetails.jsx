import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Layout from "../components/Layout";
import { getMissionById, getMissionFileUrl } from "../services/missionService";
import { submitMissionFile, getMySubmission } from "../services/submissionService";

function MissionDetails() {
  const { missionId } = useParams();
  const [mission, setMission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submission, setSubmission] = useState(null);
  const [submitError, setSubmitError] = useState(null);
  const [datasetUrl, setDatasetUrl] = useState(null);
  const [datasetLoading, setDatasetLoading] = useState(false);

  useEffect(() => {
    async function loadMission() {
      try {
        const data = await getMissionById(missionId);
        setMission(data);
        if (data?.excel_file) {
          setDatasetLoading(true);
          try { setDatasetUrl(await getMissionFileUrl(data.excel_file)); }
          catch (fileError) { console.error("Failed to load mission dataset:", fileError); }
          finally { setDatasetLoading(false); }
        }
        setSubmission(await getMySubmission(missionId));
      } catch (err) {
        console.error("Failed to load mission:", err);
        setError("Mission not found or no longer available.");
      } finally { setLoading(false); }
    }
    loadMission();
  }, [missionId]);

  async function handleSubmit() {
    if (!selectedFile) { setSubmitError("Please select an Excel file first."); return; }
    setSubmitting(true); setSubmitError(null);
    try {
      const result = await submitMissionFile({ missionId: mission.id, file: selectedFile });
      setSubmission(result); setSelectedFile(null);
    } catch (err) {
      console.error("Mission submission failed:", err);
      setSubmitError(err.message || "Unable to submit your file. Please try again.");
    } finally { setSubmitting(false); }
  }

  if (loading) return <Layout><div className="flex min-h-[60vh] items-center justify-center"><p className="text-gray-500">Loading mission...</p></div></Layout>;
  if (error || !mission) return <Layout><div className="rounded-xl bg-white p-8 text-center shadow"><h1 className="text-2xl font-bold text-gray-900">Mission unavailable</h1><p className="mt-2 text-gray-500">{error || "This mission could not be found."}</p><Link to="/missions" className="mt-6 inline-block rounded-lg bg-purple-600 px-5 py-2 text-sm font-semibold text-white">Back to Missions</Link></div></Layout>;

  let publishedResult = null;
  if (submission?.status === "Published") {
    try {
      const parsed = typeof submission.feedback === "string" ? JSON.parse(submission.feedback) : submission.feedback;
      publishedResult = { score: submission.score, feedback: parsed?.finalFeedback || parsed?.feedback || "Your result has been published.", publishedAt: parsed?.publication?.published_at };
    } catch { publishedResult = { score: submission.score, feedback: "Your result has been published." }; }
  }

  return <Layout><div className="mx-auto max-w-4xl space-y-6">
    <Link to="/missions" className="inline-block text-sm font-medium text-purple-600 hover:text-purple-700">← Back to Missions</Link>
    <div className="rounded-xl bg-white p-8 shadow">
      <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-sm font-medium text-purple-600">{mission.topics?.icon || "🎯"} {mission.topics?.name || "Analytics"}</p><h1 className="mt-2 text-3xl font-bold text-gray-900">{mission.title}</h1></div><span className="rounded-full bg-purple-50 px-4 py-2 text-sm font-bold text-purple-600">+{mission.xp_reward ?? 0} XP</span></div>
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2"><InfoCard label="Difficulty" value={mission.difficulty || "Not specified"}/><InfoCard label="Deadline" value={mission.deadline ? new Date(mission.deadline).toLocaleString() : "No deadline"}/></div>
      <div className="mt-8"><h2 className="text-xl font-bold text-gray-900">Mission Brief</h2><p className="mt-3 whitespace-pre-line leading-7 text-gray-600">{mission.description || "No mission description available."}</p></div>
      <div className="mt-8 rounded-lg border border-purple-100 bg-purple-50 p-5"><h2 className="font-bold text-gray-900">📊 Mission Dataset</h2><p className="mt-2 text-sm text-gray-600">Download the Excel dataset required for this mission.</p>{datasetLoading?<p className="mt-4 text-sm text-gray-500">Preparing dataset...</p>:datasetUrl?<a href={datasetUrl} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex rounded-lg bg-purple-600 px-5 py-2.5 text-sm font-semibold text-white">Download Dataset</a>:<p className="mt-4 text-sm text-gray-500">No dataset is attached to this mission.</p>}</div>

      {publishedResult && <div className="mt-8 rounded-xl border-2 border-green-200 bg-green-50 p-6"><div className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-widest text-green-700">🎉 Official Result</p><h2 className="mt-1 text-4xl font-black text-gray-900">{publishedResult.score}/100</h2></div><span className="rounded-full bg-white px-4 py-2 text-sm font-bold text-green-700">Published</span></div><div className="mt-5 rounded-lg bg-white p-4"><p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Feedback</p><p className="mt-2 whitespace-pre-line text-sm leading-6 text-gray-700">{publishedResult.feedback}</p>{publishedResult.publishedAt&&<p className="mt-3 text-xs text-gray-400">Published {new Date(publishedResult.publishedAt).toLocaleString()}</p>}</div></div>}

      <div className="mt-8 rounded-lg bg-gray-50 p-5"><h2 className="font-bold text-gray-900">Submission</h2>{submission ? <div className={`mt-4 rounded-lg border p-4 ${submission.status === "Published" ? "border-green-200 bg-green-50" : "border-blue-200 bg-blue-50"}`}><p className={`font-semibold ${submission.status === "Published" ? "text-green-700" : "text-blue-700"}`}>{submission.status === "Published" ? "✓ Result published" : "✓ Submission received"}</p><p className="mt-2 text-sm text-gray-600">Status: <span className="font-medium">{submission.status}</span></p><p className="mt-1 text-sm text-gray-600">Submitted: {submission.submitted_at ? new Date(submission.submitted_at).toLocaleString() : "Just now"}</p>{submission.status === "Evaluated"&&<p className="mt-2 text-xs text-gray-500">Your submission is under admin review. Your score will appear here after it is published.</p>}</div> : <><p className="mt-2 text-sm text-gray-500">Upload your completed Excel file for evaluation.</p><div className="mt-5"><input type="file" accept=".xlsx,.xls,.csv" onChange={event=>{setSelectedFile(event.target.files?.[0]||null);setSubmitError(null)}} className="block w-full rounded-lg border border-gray-200 bg-white p-3 text-sm"/></div>{selectedFile&&<p className="mt-3 text-sm text-gray-600">Selected: <span className="font-medium">{selectedFile.name}</span></p>}{submitError&&<p className="mt-3 text-sm text-red-600">{submitError}</p>}<button type="button" onClick={handleSubmit} disabled={!selectedFile||submitting} className="mt-5 rounded-lg bg-purple-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50">{submitting?"Submitting...":"Submit Mission"}</button></>}</div>
    </div>
  </div></Layout>;
}
function InfoCard({label,value}){return <div className="rounded-lg border border-gray-100 p-4"><p className="text-xs font-medium uppercase tracking-wide text-gray-400">{label}</p><p className="mt-1 font-semibold text-gray-800">{value}</p></div>}
export default MissionDetails;
