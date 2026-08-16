const [criteria, setCriteria] = useState([]);
setSubmission(data);
const { data: criteriaData, error: criteriaError } =
  await supabase
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
      {criteria.reduce(
        (total, criterion) =>
          total + Number(criterion.weight || 0),
        0
      )}
      %
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