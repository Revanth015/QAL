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

  return {
    version: "0.1-prototype",
    provider: provider.name,
    workbook,
    analysis,
    understanding,
    evaluation,
    feedback,
  };
}
