import { evaluateMissionFile } from "../intelligence/evaluator/evaluationService";
import { generateMissionBlueprint } from "../intelligence/generator/missionGenerator";

export async function evaluateSubmissionWithQAL({ file, mission, provider }) {
  return evaluateMissionFile({ file, mission, provider });
}

export function generateMissionWithQAL(options) {
  return generateMissionBlueprint(options);
}
