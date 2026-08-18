import { useState } from "react";
import Layout from "../components/Layout";
import { generateMissionWithQAL } from "../services/intelligenceService";

const stages = [
  ["brief", "Understand brief"],
  ["story", "Design story"],
  ["phases", "Build phases"],
  ["scoring", "Design evaluation"],
];

function AdminAIStudio() {
  const [form, setForm] = useState({
    topic: "Supply Chain Analytics",
    skill: "Excel analysis",
    difficulty: "Medium",
    theme: "warehouse crisis investigation",
    durationMinutes: 45,
  });
  const [blueprint, setBlueprint] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [activeStage, setActiveStage] = useState(null);
  const [error, setError] = useState("");

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function generate() {
    setGenerating(true);
    setBlueprint(null);
    setError("");

    for (const [key] of stages) {
      setActiveStage(key);
      await new Promise((resolve) => setTimeout(resolve, 250));
    }

    try {
      setBlueprint(await generateMissionWithQAL(form));
      setActiveStage("done");
    } catch (err) {
      setError(err.message || "Unable to generate mission.");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <Layout>
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <p className="text-sm font-semibold text-purple-600">QAL Intelligence</p>
          <h1 className="mt-1 text-3xl font-bold text-gray-900">AI Mission Studio</h1>
          <p className="mt-2 max-w-3xl text-gray-500">
            Give QAL a learning goal and a theme. The AI converts it into a story-driven student mission, phases, deliverables and an evaluation plan.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
          <section className="rounded-xl bg-white p-6 shadow">
            <div className="flex items-center justify-between">
              <div><h2 className="text-xl font-bold text-gray-900">Mission brief</h2><p className="mt-1 text-sm text-gray-500">What should QAL create?</p></div>
              <span className="rounded-full bg-purple-50 px-3 py-1 text-xs font-bold text-purple-700">AI</span>
            </div>
            <div className="mt-5 space-y-4">
              <Field label="Topic" value={form.topic} onChange={(value) => update("topic", value)} />
              <Field label="Skill to assess" value={form.skill} onChange={(value) => update("skill", value)} />
              <Field label="Story theme" value={form.theme} onChange={(value) => update("theme", value)} />
              <label className="block text-sm font-medium text-gray-700">Difficulty<select value={form.difficulty} onChange={(e) => update("difficulty", e.target.value)} className="mt-1 w-full rounded-lg border border-gray-300 p-2.5"><option>Easy</option><option>Medium</option><option>Hard</option></select></label>
              <Field label="Duration (minutes)" type="number" value={form.durationMinutes} onChange={(value) => update("durationMinutes", Number(value))} />
              <button disabled={generating} onClick={generate} className="w-full rounded-lg bg-purple-600 px-5 py-3 font-semibold text-white hover:bg-purple-700 disabled:opacity-50">{generating ? "QAL is generating..." : "Generate with QAL AI"}</button>
            </div>
            {error && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>}
          </section>

          <section className="space-y-6">
            <div className="rounded-xl bg-gray-950 p-6 text-white shadow">
              <div className="flex items-center justify-between"><div><p className="text-xs font-semibold uppercase tracking-widest text-purple-300">QAL AI pipeline</p><h2 className="mt-1 text-xl font-bold">Mission generation trace</h2></div><span className="text-xs text-gray-400">{blueprint?.generatedBy || (generating ? "running" : "ready")}</span></div>
              <div className="mt-6 grid gap-3 sm:grid-cols-4">
                {stages.map(([key, label], index) => {
                  const done = activeStage === "done" || (activeStage && stages.findIndex(([stage]) => stage === activeStage) > index);
                  const active = activeStage === key;
                  return <div key={key} className={`rounded-lg border p-3 ${active ? "border-purple-400 bg-purple-500/20" : done ? "border-green-400/40 bg-green-500/10" : "border-gray-700"}`}><div className="text-xs text-gray-400">0{index + 1}</div><div className="mt-1 text-sm font-semibold">{label}</div><div className="mt-2 text-xs text-gray-400">{active ? "Running" : done ? "Complete" : "Waiting"}</div></div>;
                })}
              </div>
            </div>

            {!blueprint ? (
              <div className="rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center shadow-sm"><div className="text-4xl">🤖</div><h2 className="mt-3 text-xl font-bold text-gray-900">No mission generated yet</h2><p className="mt-2 text-sm text-gray-500">Run the generator to see the AI's actual mission output.</p></div>
            ) : (
              <div className="space-y-6">
                <section className="rounded-xl bg-white p-6 shadow"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-wide text-purple-600">Generated mission</p><h2 className="mt-1 text-2xl font-bold text-gray-900">{blueprint.title}</h2></div><span className="rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-700">{blueprint.generatedBy}</span></div><p className="mt-4 text-gray-700">{blueprint.hook || blueprint.story}</p><div className="mt-5 grid gap-4 sm:grid-cols-3"><Info label="Student Role" value={blueprint.studentRole || "Decision maker"} /><Info label="Objective" value={blueprint.objective || "Complete the challenge"} /><Info label="Stakes" value={blueprint.stakes || "Deliver a defensible decision"} /></div></section>

                <section className="rounded-xl bg-white p-6 shadow"><h2 className="text-xl font-bold text-gray-900">Story & mission phases</h2><p className="mt-3 whitespace-pre-line leading-7 text-gray-600">{blueprint.story}</p><div className="mt-5 space-y-3">{(blueprint.phases || []).map((phase) => <div key={phase.phase} className="rounded-lg border border-gray-200 p-4"><div className="flex items-center justify-between"><h3 className="font-bold text-gray-900">Phase {phase.phase}: {phase.name}</h3><span className="text-xs font-semibold text-purple-600">Deliverable</span></div><p className="mt-2 text-sm text-gray-600">{phase.goal}</p>{phase.studentAction && <p className="mt-2 text-sm text-gray-500"><strong>Action:</strong> {phase.studentAction}</p>}{phase.deliverable && <p className="mt-1 text-sm text-gray-500"><strong>Output:</strong> {phase.deliverable}</p>}</div>)}</div></section>

                <div className="grid gap-6 lg:grid-cols-2"><section className="rounded-xl bg-white p-6 shadow"><h2 className="text-xl font-bold text-gray-900">Dataset plan</h2><ul className="mt-4 space-y-2">{(blueprint.datasetPlan || []).map((item, index) => <li key={index} className="rounded-lg bg-gray-50 p-3 text-sm text-gray-700">{item}</li>)}</ul></section><section className="rounded-xl bg-white p-6 shadow"><h2 className="text-xl font-bold text-gray-900">AI scoring design</h2><div className="mt-4 space-y-3">{(blueprint.scoringCriteria || []).map((item) => <div key={item.name} className="flex items-start justify-between gap-3 rounded-lg border border-gray-200 p-3"><div><p className="font-semibold text-gray-900">{item.name}</p>{item.whatGoodLooksLike && <p className="mt-1 text-xs text-gray-500">{item.whatGoodLooksLike}</p>}</div><span className="shrink-0 font-bold text-purple-600">{item.weight}%</span></div>)}</div></section></div>

                <section className="rounded-xl border border-purple-100 bg-purple-50 p-6"><h2 className="text-xl font-bold text-gray-900">What QAL generated</h2><p className="mt-2 text-sm text-gray-600">{blueprint.successCondition || "A coherent student challenge with measurable outputs."}</p></section>
              </div>
            )}
          </section>
        </div>
      </div>
    </Layout>
  );
}

function Field({ label, value, onChange, type = "text" }) { return <label className="block text-sm font-medium text-gray-700">{label}<input type={type} value={value ?? ""} onChange={(e) => onChange(e.target.value)} className="mt-1 w-full rounded-lg border border-gray-300 p-2.5" /></label>; }
function Info({ label, value }) { return <div className="rounded-lg border border-gray-100 bg-gray-50 p-4"><p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{label}</p><p className="mt-2 text-sm font-medium text-gray-800">{value}</p></div>; }

export default AdminAIStudio;
