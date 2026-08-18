import { readExcelFile } from "../evaluator/fileReader";
import { analyzeWorkbook } from "../evaluator/evidenceEngine";
import { understandMission } from "../evaluator/missionUnderstanding";
import { evaluateCriteria } from "../evaluator/criterionEvaluator";
import { generateFeedback } from "../evaluator/feedbackEngine";
import { defaultAIProvider } from "./aiProvider";

export async function evaluateSubmission({ file, mission, provider = defaultAIProvider }) {
  const workbook = await readExcelFile(file);
  const analysis = analyzeWorkbook(workbook);
  const understanding = understandMission(mission, analysis);
  const evaluation = evaluateCriteria(mission, workbook, analysis, understanding);
  const feedback = generateFeedback(evaluation);

  let aiReview = null;
  let aiStatus = "deterministic";

  const liveReview = await provider.generateJSON({
    task: "evaluation_review",
    mission,
    analysis,
    understanding,
    evaluation,
  });

  if (liveReview?.live && !liveReview?.error) {
    aiReview = liveReview;
    aiStatus = "live-ai";
  } else {
    aiReview = {
      overallAssessment: "Deterministic QAL evaluation completed. Live AI review was unavailable, so no model-generated claims were added.",
      criterionReviews: [],
      strengths: feedback.strengths,
      improvements: feedback.improvements,
      businessInsight: "Enable the QAL AI gateway to add a live model review on top of the evidence engine.",
      provider: liveReview?.provider || "deterministic-fallback",
      error: liveReview?.error || liveReview?.message,
      live: false,
    };
  }

  return {
    version: "0.2-prototype",
    provider: aiReview.provider || provider.name,
    aiStatus,
    workbook,
    analysis,
    understanding,
    evaluation,
    feedback,
    aiReview,
  };
}
