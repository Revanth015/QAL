import { evaluateSubmission } from "../core/aiOrchestrator";

export async function evaluateMissionFile({ file, mission, provider }) {
  if (!file) throw new Error("Submission file is required.");
  if (!mission) throw new Error("Mission is required.");

  return evaluateSubmission({ file, mission, provider });
}

export function evaluationToSubmissionPatch(result) {
  return {
    score: Math.round(result.evaluation.finalScore),
    feedback: result.feedback.summary,
    status: "Evaluated",
  };
}
