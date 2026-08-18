export function buildExcelGenerationPrompt(blueprint = {}) {
  const criteria = (blueprint.scoringCriteria || [])
    .map((c) => `- ${c.name}: ${c.weight}%${c.whatGoodLooksLike ? ` — ${c.whatGoodLooksLike}` : ""}`)
    .join("\n");

  const phases = (blueprint.phases || [])
    .map((p) => `Phase ${p.phase}: ${p.name} — ${p.goal}`)
    .join("\n");

  const tests = (blueprint.requiredStatisticalTests || blueprint.requiredTests || [])
    .map((t) => `- ${typeof t === "string" ? t : t.name || t.test || "Required statistical test"}`)
    .join("\n") || "- None unless explicitly required by the mission.";

  const processes = (blueprint.requiredProcesses || [])
    .map((p) => `- ${typeof p === "string" ? p : p.name || p.description || "Required analytical process"}`)
    .join("\n") || "- Define the analytical process needed for each mission task.";

  return `You are the QAL Excel Dataset Architect. Create a student-ready Excel workbook for this QAL mission. The workbook must make the required analytical PROCESS, process result, derived result and business interpretation visible enough for QAL to evaluate later.

MISSION
Title: ${blueprint.title || "Untitled mission"}
Topic: ${blueprint.topic || ""}
Skill: ${blueprint.skill || ""}
Difficulty: ${blueprint.difficulty || "Medium"}
Duration: ${blueprint.durationMinutes || 45} minutes

STORY
${blueprint.story || blueprint.hook || ""}

OBJECTIVE
${blueprint.objective || ""}

PHASES
${phases || "Create phases appropriate to the mission."}

DATASET PLAN
${(blueprint.datasetPlan || []).map((x) => `- ${x}`).join("\n") || "- Create realistic data supporting every task."}

REQUIRED STATISTICAL TESTS
${tests}

REQUIRED ANALYTICAL PROCESSES
${processes}

SCORING CRITERIA
${criteria || "Create measurable criteria linked to the mission."}

WORKBOOK STRUCTURE
Use these sheets unless the mission genuinely requires another structure:
1. 00_Instructions — mission context, role, tasks, required analysis and submission instructions. Never reveal answers.
2. 01_Data — raw student dataset. No completed answers or hidden answer keys.
3. 02_Analysis — formulas, statistical tests, intermediate calculations and visible process evidence.
4. 03_Results — final numerical/statistical outputs and comparisons.
5. 04_Conclusion — key finding, evidence, derived result, business interpretation and recommendation.

PROCESS EVIDENCE
QAL must be able to distinguish: data used; method/statistical test; actual process/calculation; process result; derived result; business interpretation; recommendation.

STATISTICAL TESTS
For every required test provide labelled areas for test name, variables, hypotheses, significance level, assumptions where relevant, test statistic, p-value, decision and interpretation. Leave student answers blank.

FORMULAS
Use Excel formulas where practical and preserve formulas/intermediate calculations. Do not replace required analytical work with precomputed answers.

DATA QUALITY
Use realistic, internally consistent data with enough observations and variation for every required analysis. Do not leak expected answers.

QAL EVALUATION CONTRACT
At the end, return JSON describing what QAL should check for each criterion: required evidence, required process, required process result, required derived result and required interpretation. Do not include hidden student answers.

Return the workbook design, sheet structure, column definitions, student instructions, process representation, evaluation contract JSON, and the .xlsx workbook if your environment supports file generation.`;
}
