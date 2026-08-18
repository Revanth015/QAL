import { useState } from "react";
import Layout from "../components/Layout";
import { generateMissionWithQAL } from "../services/intelligenceService";

function AdminAIStudio() {
  const [form, setForm] = useState({
    topic: "Business Analytics",
    skill: "Excel analysis",
    difficulty: "Medium",
    theme: "mystery investigation",
    durationMinutes: 45,
  });
  const [blueprint, setBlueprint] = useState(null);

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function generate() {
    setBlueprint(generateMissionWithQAL(form));
  }

  return (
    <Layout>
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <p className="text-sm font-medium text-purple-600">QAL Intelligence</p>
          <h1 className="mt-1 text-3xl font-bold text-gray-900">AI Mission Studio</h1>
          <p className="mt-2 text-gray-500">Prototype mission and story generation for admins.</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl bg-white p-6 shadow">
            <h2 className="text-xl font-bold text-gray-900">Mission inputs</h2>
            <div className="mt-5 space-y-4">
              <Field label="Topic" value={form.topic} onChange={(value) => update("topic", value)} />
              <Field label="Skill" value={form.skill} onChange={(value) => update("skill", value)} />
              <Field label="Theme" value={form.theme} onChange={(value) => update("theme", value)} />
              <label className="block text-sm font-medium text-gray-700">Difficulty<select value={form.difficulty} onChange={(e) => update("difficulty", e.target.value)} className="mt-1 w-full rounded-lg border border-gray-300 p-2.5"><option>Easy</option><option>Medium</option><option>Hard</option></select></label>
              <label className="block text-sm font-medium text-gray-700">Duration (minutes)<input type="number" value={form.durationMinutes} onChange={(e) => update("durationMinutes", Number(e.target.value))} className="mt-1 w-full rounded-lg border border-gray-300 p-2.5" /></label>
              <button onClick={generate} className="rounded-lg bg-purple-600 px-5 py-2.5 font-semibold text-white hover:bg-purple-700">Generate Mission Blueprint</button>
            </div>
          </div>

          <div className="rounded-xl bg-white p-6 shadow">
            <h2 className="text-xl font-bold text-gray-900">Generated blueprint</h2>
            {!blueprint ? <p className="mt-4 text-sm text-gray-500">Enter the mission details and generate a prototype.</p> : (
              <div className="mt-5 space-y-4">
                <div><p className="text-xs uppercase tracking-wide text-gray-400">Title</p><p className="font-bold text-gray-900">{blueprint.title}</p></div>
                <div><p className="text-xs uppercase tracking-wide text-gray-400">Story</p><p className="text-sm leading-6 text-gray-600">{blueprint.story}</p></div>
                <div><p className="text-xs uppercase tracking-wide text-gray-400">Phases</p><div className="mt-2 space-y-2">{blueprint.phases.map((phase) => <div key={phase.phase} className="rounded-lg bg-gray-50 p-3 text-sm"><strong>Phase {phase.phase}: {phase.name}</strong><p className="text-gray-500">{phase.goal}</p></div>)}</div></div>
                <div><p className="text-xs uppercase tracking-wide text-gray-400">Scoring</p><p className="mt-2 text-sm text-gray-600">{blueprint.scoringCriteria.map((item) => `${item.name} ${item.weight}%`).join(" · ")}</p></div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}

function Field({ label, value, onChange }) {
  return <label className="block text-sm font-medium text-gray-700">{label}<input value={value} onChange={(e) => onChange(e.target.value)} className="mt-1 w-full rounded-lg border border-gray-300 p-2.5" /></label>;
}

export default AdminAIStudio;
