import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Layout from "../components/Layout";
import {
  getAdminMissionById,
  getMissionCriteria,
  updateMission,
} from "../services/missionService";
import { supabase } from "../config/supabase";

const emptyCriterion = {
  criterion_name: "",
  criterion_description: "",
  weight: "",
  evaluation_instructions: "",
};

function EditMission() {
  const { missionId } = useParams();
  const navigate = useNavigate();
  const [topics, setTopics] = useState([]);
  const [form, setForm] = useState(null);
  const [criteria, setCriteria] = useState([]);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const [{ data: topicData, error: topicError }, mission, missionCriteria] = await Promise.all([
          supabase.from("topics").select("id, name, icon, color").order("id"),
          getAdminMissionById(missionId),
          getMissionCriteria(missionId),
        ]);

        if (topicError) throw topicError;
        setTopics(topicData || []);
        setForm({
          title: mission.title || "",
          topic_id: mission.topic_id || "",
          description: mission.description || "",
          difficulty: mission.difficulty || "Beginner",
          xp_reward: mission.xp_reward ?? 100,
          deadline: mission.deadline ? new Date(mission.deadline).toISOString().slice(0, 16) : "",
          is_active: mission.is_active !== false,
          excel_file: mission.excel_file || null,
        });
        setCriteria(
          missionCriteria.length
            ? missionCriteria.map((item) => ({
                criterion_name: item.criterion_name || "",
                criterion_description: item.criterion_description || "",
                weight: item.weight ?? "",
                evaluation_instructions: item.evaluation_instructions || "",
              }))
            : [{ ...emptyCriterion }]
        );
      } catch (err) {
        console.error("Failed to load mission:", err);
        setError(err.message || "Unable to load mission.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [missionId]);

  function handleChange(event) {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
  }

  function updateCriterion(index, field, value) {
    setCriteria((current) => current.map((item, i) => i === index ? { ...item, [field]: value } : item));
  }

  const totalWeight = criteria.reduce((sum, item) => sum + (Number(item.weight) || 0), 0);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!form.title.trim()) return setError("Mission title is required.");
    if (!form.topic_id) return setError("Please select a topic.");
    if (!criteria.length) return setError("Add at least one scoring criterion.");
    if (Math.abs(totalWeight - 100) > 0.001) return setError(`Scoring weights must total 100%. Current total: ${totalWeight}%`);

    try {
      setSaving(true);
      await updateMission({ missionId, mission: form, criteria, file });
      navigate("/admin/missions");
    } catch (err) {
      console.error("Failed to update mission:", err);
      setError(err.message || "Unable to update mission.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <Layout><div className="p-8 text-gray-500">Loading mission...</div></Layout>;
  if (!form) return <Layout><div className="p-8 text-red-600">{error || "Mission unavailable."}</div></Layout>;

  return (
    <Layout>
      <form onSubmit={handleSubmit} className="mx-auto max-w-5xl space-y-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <Link to="/admin/missions" className="text-sm font-medium text-purple-600">← Mission Management</Link>
            <h1 className="mt-2 text-3xl font-bold text-gray-900">Edit Mission</h1>
            <p className="mt-2 text-gray-500">Update the mission, dataset and AI scoring criteria.</p>
          </div>
          <button disabled={saving} className="rounded-lg bg-purple-600 px-5 py-2.5 font-semibold text-white disabled:opacity-50">
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>

        {error && <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600">{error}</div>}

        <section className="rounded-xl bg-white p-6 shadow space-y-5">
          <h2 className="text-xl font-bold text-gray-900">Mission Details</h2>
          <Field label="Title" name="title" value={form.title} onChange={handleChange} />
          <label className="block text-sm font-medium text-gray-700">Topic<select name="topic_id" value={form.topic_id} onChange={handleChange} className="mt-1 w-full rounded-lg border border-gray-300 p-2.5"><option value="">Select topic</option>{topics.map((topic) => <option key={topic.id} value={topic.id}>{topic.icon} {topic.name}</option>)}</select></label>
          <label className="block text-sm font-medium text-gray-700">Description<textarea name="description" value={form.description} onChange={handleChange} rows={5} className="mt-1 w-full rounded-lg border border-gray-300 p-2.5" /></label>
          <div className="grid gap-4 sm:grid-cols-3">
            <label className="block text-sm font-medium text-gray-700">Difficulty<select name="difficulty" value={form.difficulty} onChange={handleChange} className="mt-1 w-full rounded-lg border border-gray-300 p-2.5"><option>Beginner</option><option>Intermediate</option><option>Advanced</option><option>Hard</option></select></label>
            <Field label="XP Reward" name="xp_reward" type="number" value={form.xp_reward} onChange={handleChange} />
            <Field label="Deadline" name="deadline" type="datetime-local" value={form.deadline} onChange={handleChange} />
          </div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700"><input type="checkbox" name="is_active" checked={form.is_active} onChange={handleChange} /> Mission is active</label>
          <div className="rounded-lg border border-gray-200 p-4"><p className="text-sm font-semibold text-gray-800">Dataset</p><p className="mt-1 text-xs text-gray-500">Current: {form.excel_file || "No dataset"}</p><input type="file" accept=".xlsx,.xls,.csv" onChange={(e) => setFile(e.target.files?.[0] || null)} className="mt-3 block w-full rounded-lg border border-gray-200 p-2 text-sm" /></div>
        </section>

        <section className="rounded-xl bg-white p-6 shadow space-y-5">
          <div className="flex items-center justify-between"><div><h2 className="text-xl font-bold text-gray-900">AI Scoring Criteria</h2><p className="mt-1 text-sm text-gray-500">Tell QAL what evidence matters and how it should evaluate it.</p></div><span className={`rounded-full px-3 py-1 text-sm font-bold ${totalWeight === 100 ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>{totalWeight}%</span></div>
          {criteria.map((criterion, index) => <div key={index} className="rounded-lg border border-gray-200 p-5 space-y-4"><div className="grid gap-4 sm:grid-cols-[1fr_120px]"><Field label={`Criterion ${index + 1}`} value={criterion.criterion_name} onChange={(e) => updateCriterion(index, "criterion_name", e.target.value)} /><Field label="Weight %" type="number" value={criterion.weight} onChange={(e) => updateCriterion(index, "weight", e.target.value)} /></div><label className="block text-sm font-medium text-gray-700">Description<textarea value={criterion.criterion_description} onChange={(e) => updateCriterion(index, "criterion_description", e.target.value)} rows={3} className="mt-1 w-full rounded-lg border border-gray-300 p-2.5" /></label><label className="block text-sm font-medium text-gray-700">Evaluation Instructions<textarea value={criterion.evaluation_instructions} onChange={(e) => updateCriterion(index, "evaluation_instructions", e.target.value)} rows={3} placeholder="Example: Calculate total revenue by region and identify the highest-revenue region." className="mt-1 w-full rounded-lg border border-gray-300 p-2.5" /></label><button type="button" onClick={() => setCriteria((current) => current.filter((_, i) => i !== index))} className="text-sm font-medium text-red-600">Remove criterion</button></div>)}
          <button type="button" onClick={() => setCriteria((current) => [...current, { ...emptyCriterion }])} className="rounded-lg border border-purple-200 px-4 py-2 text-sm font-semibold text-purple-700">+ Add Criterion</button>
        </section>
      </form>
    </Layout>
  );
}

function Field({ label, name, value, onChange, type = "text" }) {
  return <label className="block text-sm font-medium text-gray-700">{label}<input name={name} type={type} value={value ?? ""} onChange={onChange} className="mt-1 w-full rounded-lg border border-gray-300 p-2.5" /></label>;
}

export default EditMission;
