export function evaluateCriteria(mission, workbook, analysis, understanding) {
  const criteria = mission.criteria || [];

  const results = criteria.map((criterion) => {
    const plan = understanding.criterionAnalysis.find(
      (item) => item.criterion === criterion.name
    );

    const evidence = collectEvidence(criterion, workbook, analysis, plan);
    const score = scoreCriterion(criterion, evidence);

    return {
      criterion: criterion.name,
      weight: Number(criterion.weight) || 0,
      maxScore: 100,
      score,
      evidence,
      confidence: calculateConfidence(evidence),
    };
  });

  const totalWeight = results.reduce((sum, item) => sum + item.weight, 0) || 1;
  const finalScore = results.reduce(
    (sum, item) => sum + item.score * (item.weight / totalWeight),
    0
  );

  return {
    criteria: results,
    finalScore: Math.round(finalScore * 100) / 100,
    totalWeight,
  };
}

function collectEvidence(criterion, workbook, analysis, plan) {
  const evidence = [];
  const capabilities = plan?.requiredCapabilities || [];
  const relevantColumns = plan?.relevantColumns || [];

  if (capabilities.includes("data_quality")) {
    const warnings = analysis.warnings || [];
    evidence.push({
      type: "data_quality",
      value: warnings.length === 0 ? "No detected warnings" : warnings,
      source: "workbook analysis",
    });
  }

  for (const column of relevantColumns) {
    const sheet = workbook.sheets.find((item) => item.name === column.sheet);
    if (!sheet) continue;

    evidence.push({
      type: "column",
      sheet: column.sheet,
      column: column.column,
      semanticType: column.semanticType,
      relevanceScore: column.relevanceScore,
      source: "workbook column semantics",
    });
  }

  if (capabilities.includes("aggregation") && capabilities.includes("monetary_analysis")) {
    const grouped = aggregateByCategory(workbook, relevantColumns);
    if (grouped) {
      evidence.push({
        type: "aggregation",
        operation: "sum monetary measure by categorical dimension",
        result: grouped,
      });
    }
  }

  return evidence;
}

function aggregateByCategory(workbook, relevantColumns) {
  const category = relevantColumns.find((item) => item.semanticType === "categorical");
  const measure = relevantColumns.find((item) => item.semanticType === "monetary_measure");

  if (!category || !measure) return null;

  const sheet = workbook.sheets.find((item) => item.name === category.sheet);
  if (!sheet) return null;

  const categoryIndex = sheet.headers.indexOf(category.column);
  const measureIndex = sheet.headers.indexOf(measure.column);
  if (categoryIndex < 0 || measureIndex < 0) return null;

  const totals = {};
  for (const row of sheet.rows.slice(1)) {
    const key = row[categoryIndex];
    const value = Number(row[measureIndex]);
    if (key === null || key === undefined || key === "") continue;
    if (!Number.isFinite(value)) continue;
    totals[key] = (totals[key] || 0) + value;
  }

  return Object.entries(totals)
    .map(([group, total]) => ({ group, total }))
    .sort((a, b) => b.total - a.total);
}

function scoreCriterion(criterion, evidence) {
  const text = `${criterion.name || ""} ${criterion.description || ""}`.toLowerCase();
  if (!evidence.length) return 0;

  let score = 40;
  if (evidence.some((item) => item.type === "column")) score += 20;
  if (evidence.some((item) => item.type === "aggregation")) score += 25;
  if (evidence.some((item) => item.type === "data_quality")) score += 15;

  if (text.includes("recommend") && !evidence.some((item) => item.type === "aggregation")) {
    score = Math.min(score, 60);
  }

  return Math.min(100, score);
}

function calculateConfidence(evidence) {
  if (!evidence.length) return 0;
  const directEvidence = evidence.filter(
    (item) => item.type === "column" || item.type === "aggregation"
  ).length;
  return Math.min(1, 0.5 + directEvidence * 0.15);
}
