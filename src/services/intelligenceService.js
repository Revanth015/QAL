import { evaluateMissionFile } from "../intelligence/evaluator/evaluationService";
import { generateMissionBlueprint } from "../intelligence/generator/missionGenerator";
import { buildExcelGenerationPrompt } from "../intelligence/generator/excelPromptGenerator";
import { defaultAIProvider } from "../intelligence/core/aiProvider";

export async function evaluateSubmissionWithQAL({ file, mission, provider }) {
  return evaluateMissionFile({ file, mission, provider });
}

function attachExcelPrompt(blueprint) {
  return { ...blueprint, excelGenerationPrompt: buildExcelGenerationPrompt(blueprint) };
}

export async function generateMissionWithQAL(options) {
  const live = await defaultAIProvider.generateJSON({ task: "mission_generation", input: options });
  if (live?.live && live.title && live.phases && live.scoringCriteria) return attachExcelPrompt(live);
  return { ...attachExcelPrompt(generateMissionBlueprint(options)), generatedBy: "QAL deterministic fallback", aiStatus: live?.message || "Live AI unavailable" };
}
