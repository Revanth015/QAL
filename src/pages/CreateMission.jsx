import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import { supabase } from "../config/supabase";

const emptyCriterion = {
  criterion_name: "",
  criterion_description: "",
  weight: "",
  evaluation_instructions: "",
};

function CreateMission() {
  const navigate = useNavigate();

  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingTopics, setLoadingTopics] = useState(true);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    title: "",
    topic_id: "",
    description: "",
    difficulty: "Beginner",
    xp_reward: 100,
    deadline: "",
    is_active: true,
  });

  const [file, setFile] = useState(null);

  const [criteria, setCriteria] = useState([
    { ...emptyCriterion },
  ]);

  useEffect(() => {
    async function loadTopics() {
      const { data, error } = await supabase
        .from("topics")
        .select("id, name, icon, color")
        .order("id");

      if (error) {
        console.error("Failed to load topics:", error);
        setError("Unable to load topics.");
      } else {
        setTopics(data || []);
      }

      setLoadingTopics(false);
    }

    loadTopics();
  }, []);

  function handleChange(event) {
    const { name, value, type, checked } = event.target;

    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  function updateCriterion(index, field, value) {
    setCriteria((current) =>
      current.map((criterion, i) =>
        i === index
          ? {
              ...criterion,
              [field]: value,
            }
          : criterion
      )
    );
  }

  function addCriterion() {
    setCriteria((current) => [
      ...current,
      { ...emptyCriterion },
    ]);
  }

  function removeCriterion(index) {
    setCriteria((current) =>
      current.filter((_, i) => i !== index)
    );
  }

  const totalWeight = criteria.reduce(
    (sum, criterion) =>
      sum + (Number(criterion.weight) || 0),
    0
  );

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");

    if (!form.title.trim()) {
      setError("Mission title is required.");
      return;
    }

    if (!form.topic_id) {
      setError("Please select a topic.");
      return;
    }

    if (criteria.length === 0) {
      setError("Add at least one scoring criterion.");
      return;
    }

    if (Math.abs(totalWeight - 100) > 0.001) {
      setError(
        `Scoring weights must total 100%. Current total: ${totalWeight}%`
      );
      return;
    }

    if (!file) {
      setError("Please upload the mission Excel file.");
      return;
    }

    try {
      setLoading(true);

      const fileExtension =
        file.name.split(".").pop()?.toLowerCase() || "xlsx";

      const safeFileName = file.name
        .replace(/[^a-zA-Z0-9._-]/g, "_");

      const filePath = `missions/${Date.now()}-${safeFileName}`;

      const { error: uploadError } = await supabase.storage
        .from("qal-submissions")
        .upload(filePath, file, {
          upsert: false,
          contentType:
            fileExtension === "xlsx"
              ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              : file.type,
        });

      if (uploadError) {
        throw uploadError;
      }

      const { data: mission, error: missionError } =
        await supabase
          .from("missions")
          .insert({
            title: form.title.trim(),
            topic_id: Number(form.topic_id),
            description: form.description.trim() || null,
            difficulty: form.difficulty,
            xp_reward: Number(form.xp_reward) || 0,
            excel_file: filePath,
            deadline: form.deadline
              ? new Date(form.deadline).toISOString()
              : null,
            is_active: form.is_active,
          })
          .select()
          .single();

      if (missionError) {
        throw missionError;
      }

      const criteriaPayload = criteria.map((criterion) => ({
        mission_id: mission.id,
        criterion_name: criterion.criterion_name.trim(),
        criterion_description:
          criterion.criterion_description.trim() || null,
        weight: Number(criterion.weight),
        max_score: 100,
        evaluation_instructions:
          criterion.evaluation_instructions.trim() || null,
      }));

      const { error: criteriaError } = await supabase
        .from("mission_scoring_criteria")
        .insert(criteriaPayload);

      if (criteriaError) {
        throw criteriaError;
      }

      navigate("/admin/missions");
    } catch (err) {
      console.error("Failed to create mission:", err);
      setError(
        err?.message || "Unable to create mission."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Layout>
      <div className="mx-auto max-w-5xl space-y-8">
        <div>
          <p className="text-sm font-medium text-purple-600">
            QAL Administration
          </p>

          <h1 className="mt-1 text-3xl font-bold text-gray-900">
            Create Mission
          </h1>

          <p className="mt-2 text-gray-500">
            Create a mission and define how the AI evaluator should score it.
          </p>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Mission Details */}
          <section className="rounded-xl bg-white p-6 shadow">
            <h2 className="text-xl font-bold text-gray-900">
              Mission Details
            </h2>

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">
                  Mission Title
                </label>

                <input
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3"
                  placeholder="e.g. Sales Dashboard Challenge"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Topic
                </label>

                <select
                  name="topic_id"
                  value={form.topic_id}
                  onChange={handleChange}
                  disabled={loadingTopics}
                  className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3"
                >
                  <option value="">
                    Select topic
                  </option>

                  {topics.map((topic) => (
                    <option key={topic.id} value={topic.id}>
                      {topic.icon} {topic.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Difficulty
                </label>

                <select
                  name="difficulty"
                  value={form.difficulty}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3"
                >
                  <option>Beginner</option>
                  <option>Intermediate</option>
                  <option>Advanced</option>
                  <option>Expert</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">
                  Description / Instructions
                </label>

                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows={5}
                  className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3"
                  placeholder="Explain what the participant needs to accomplish..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  XP Reward
                </label>

                <input
                  type="number"
                  name="xp_reward"
                  min="0"
                  value={form.xp_reward}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Deadline
                </label>

                <input
                  type="datetime-local"
                  name="deadline"
                  value={form.deadline}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3"
                />
              </div>

              <label className="flex items-center gap-3 md:col-span-2">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={form.is_active}
                  onChange={handleChange}
                />

                <span className="text-sm text-gray-700">
                  Publish mission immediately
                </span>
              </label>
            </div>
          </section>

          {/* Dataset */}
          <section className="rounded-xl bg-white p-6 shadow">
            <h2 className="text-xl font-bold text-gray-900">
              Mission Dataset
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Upload the Excel file that participants will work on.
            </p>

            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={(event) =>
                setFile(event.target.files?.[0] || null)
              }
              className="mt-5 block w-full rounded-lg border border-gray-300 p-3"
            />

            {file && (
              <p className="mt-3 text-sm text-green-600">
                Selected: {file.name}
              </p>
            )}
          </section>

          {/* Scoring Matrix */}
          <section className="rounded-xl bg-white p-6 shadow">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  AI Scoring Matrix
                </h2>

                <p className="mt-2 text-sm text-gray-500">
                  Define exactly how the AI should evaluate submissions.
                </p>
              </div>

              <div
                className={`rounded-full px-4 py-2 text-sm font-semibold ${
                  Math.abs(totalWeight - 100) < 0.001
                    ? "bg-green-100 text-green-700"
                    : "bg-yellow-100 text-yellow-700"
                }`}
              >
                Weight: {totalWeight}%
              </div>
            </div>

            <div className="mt-6 space-y-5">
              {criteria.map((criterion, index) => (
                <div
                  key={index}
                  className="rounded-lg border border-gray-200 p-5"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-800">
                      Criterion {index + 1}
                    </h3>

                    {criteria.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeCriterion(index)}
                        className="text-sm font-medium text-red-600"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="mt-4 grid gap-4 md:grid-cols-3">
                    <div className="md:col-span-2">
                      <label className="text-sm font-medium text-gray-700">
                        Criterion Name
                      </label>

                      <input
                        value={criterion.criterion_name}
                        onChange={(event) =>
                          updateCriterion(
                            index,
                            "criterion_name",
                            event.target.value
                          )
                        }
                        className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3"
                        placeholder="Data Cleaning"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        Weight %
                      </label>

                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={criterion.weight}
                        onChange={(event) =>
                          updateCriterion(
                            index,
                            "weight",
                            event.target.value
                          )
                        }
                        className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3"
                      />
                    </div>

                    <div className="md:col-span-3">
                      <label className="text-sm font-medium text-gray-700">
                        What should be evaluated?
                      </label>

                      <textarea
                        value={criterion.criterion_description}
                        onChange={(event) =>
                          updateCriterion(
                            index,
                            "criterion_description",
                            event.target.value
                          )
                        }
                        rows={3}
                        className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3"
                        placeholder="Describe what a good submission should contain..."
                      />
                    </div>

                    <div className="md:col-span-3">
                      <label className="text-sm font-medium text-gray-700">
                        AI Evaluation Instructions
                      </label>

                      <textarea
                        value={criterion.evaluation_instructions}
                        onChange={(event) =>
                          updateCriterion(
                            index,
                            "evaluation_instructions",
                            event.target.value
                          )
                        }
                        rows={3}
                        className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3"
                        placeholder="Tell the evaluator what evidence to look for..."
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={addCriterion}
              className="mt-5 rounded-lg border border-purple-600 px-4 py-2 font-medium text-purple-600 hover:bg-purple-50"
            >
              + Add Criterion
            </button>
          </section>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate("/admin/missions")}
              className="rounded-lg border border-gray-300 px-6 py-3 font-semibold text-gray-700"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-purple-600 px-6 py-3 font-semibold text-white hover:bg-purple-700 disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create Mission"}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}

export default CreateMission;