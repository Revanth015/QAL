import { runStatisticalTestChecks } from "./statisticalTestEngine";

/**
 * Evidence-first evaluator.
 *
 * A criterion is not considered successfully demonstrated merely because a
 * final number/text exists. QAL checks, in order:
 *   1. the requested statistical test / method,
 *   2. the process used to produce it,
 *   3. the intermediate result of that process, and
 *   4. the final/derived result.
 *
 * This keeps the prototype aligned with the product rule that students are
 * assessed on analytical work, not only on the final answer.
 */
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
  const criterionText = [
    criterion.name,
    criterion.description,
    criterion.evaluation_instructions,
  ]
    .filter(Boolean)
    .join(" ");

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

  // Statistical-test evidence is deliberately separate from generic column
  // evidence. A student must demonstrate the requested test/method, not just
  // mention a variable.
  const statistical = runStatisticalTestChecks({
    criterionText,
    workbook,
    relevantColumns,
  });
  if (statistical.requestedTests.length || statistical.detectedTests.length) {
    evidence.push({
      type: "statistical_test",
      requestedTests: statistical.requestedTests,
      detectedTests: statistical.detectedTests,
      validatedTests: statistical.validatedTests,
      missingTests: statistical.missingTests,
      source: "workbook analytical-process inspection",
    });
  }

  if (
    capabilities.includes("aggregation") &&
    capabilities.includes("monetary_analysis")
  ) {
    const grouped = aggregateByCategory(workbook, relevantColumns);
    if (grouped) {
      evidence.push({
        type: "process_result",
        process: "sum monetary measure by categorical dimension",
        result: grouped,
        source: "QAL independent calculation",
      });

      const derived = grouped[0];
      if (derived) {
        evidence.push({
          type: "derived_result",
          operation: "highest grouped total",
          result: derived,
          source: "QAL independent derivation",
        });
      }
    }
  }

  // A process trace is useful even when the criterion is not an aggregation.
  // It records whether the workbook contains formulas or explicit analytical
  // method/output labels. The raw workbook reader exposes this metadata.
  const process = inspectProcess(workbook, criterionText);
  if (process.formulaCount || process.methodMentions.length || process.resultMentions.length) {
    evidence.push({
      type: "process",
      formulaCount: process.formulaCount,
      methodMentions: process.methodMentions,
      resultMentions: process.resultMentions,
      source: "submitted workbook inspection",
    });
  }

  return evidence;
}

function inspectProcess(workbook, criterionText) {
  const haystack = criterionText.toLowerCase();
  const methodMentions = [];
  const resultMentions = [];
  const methods = [
    "mean",
    "median",
    "standard deviation",
    "variance",
    "correlation",
    "regression",
    "t-test",
    "chi-square",
    "anova",
    "z-test",
    "hypothesis test",
    "confidence interval",
    "pivot table",
    "sum",
    "average",
    "count",
    "ranking",
  ];

  for (const method of methods) {
    if (haystack.includes(method)) methodMentions.push(method);
  }

  const resultWords = [
    "result",
    "conclusion",
    "finding",
    "recommendation",
    "highest",
    "lowest",
    "significant",
    "p-value",
    "p value",
  ];

  for (const word of resultWords) {
    if (haystack.includes(word)) resultMentions.push(word);
  }

  let formulaCount = 0;
  for (const sheet of workbook.sheets || []) {
    formulaCount += Number(sheet.formulaCount || 0);
  }

  return { formulaCount, methodMentions, resultMentions };
}

function aggregateByCategory(workbook, relevantColumns) {
  const category = relevantColumns.find(
    (item) => item.semanticType === "categorical"
  );
  const measure = relevantColumns.find(
    (item) => item.semanticType === "monetary_measure"
  );

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
  if (!evidence.length) return 0;

  const statistical = evidence.find((item) => item.type === "statistical_test");
  const process = evidence.find((item) => item.type === "process");
  const processResult = evidence.find((item) => item.type === "process_result");
  const derivedResult = evidence.find((item) => item.type === "derived_result");

  // Evidence gates: final/derived output cannot receive full credit when the
  // underlying process or requested statistical method is absent.
  let score = 20; // relevant evidence exists

  if (statistical) {
    if (statistical.validatedTests.length) score += 30;
    else if (statistical.detectedTests.length) score += 15;
  }

  if (process || processResult) score += 20;
  if (derivedResult) score += 20;

  if (evidence.some((item) => item.type === "column")) score += 10;
  if (evidence.some((item) => item.type === "data_quality")) score += 5;

  // Missing requested tests cap the score. This prevents a correct-looking
  // final answer from receiving a high score when the required statistical
  // procedure was not demonstrated.
  if (statistical?.missingTests?.length) score = Math.min(score, 55);

  const text = `${criterion.name || ""} ${criterion.description || ""}`.toLowerCase();
  if (
    text.includes("recommend") &&
    !processResult &&
    !derivedResult
  ) {
    score = Math.min(score, 60);
  }

  return Math.min(100, score);
}

function calculateConfidence(evidence) {
  if (!evidence.length) return 0;

  const directEvidence = evidence.filter((item) =>
    ["column", "process", "process_result", "derived_result", "statistical_test"].includes(item.type)
  ).length;

  return Math.min(1, 0.35 + directEvidence * 0.12);
}
