import { evaluateMissionFile } from "../intelligence/evaluator/evaluationService";
import { generateMissionBlueprint } from "../intelligence/generator/missionGenerator";
import { defaultAIProvider } from "../intelligence/core/aiProvider";

export async function evaluateSubmissionWithQAL({ file, mission, provider }) {
  return evaluateMissionFile({ file, mission, provider });
}

export async function generateMissionWithQAL(options) {
  const live = await defaultAIProvider.generateJSON({
    task: "mission_generation",
    input: options,
  });

  if (live?.live && live.title && live.phases && live.scoringCriteria) {
    return live;
  }

  return {
    ...generateMissionBlueprint(options),
    generatedBy: "QAL deterministic fallback",
    aiStatus: live?.message || "Live AI unavailable",
  };
}
