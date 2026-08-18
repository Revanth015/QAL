import { readExcelFile } from "./evaluator/fileReader";
import { analyzeWorkbook } from "./evaluator/evidenceEngine";
import { understandMission } from "./evaluator/missionUnderstanding";
import { evaluateCriteria } from "./evaluator/criterionEvaluator";
import { testMission } from "./testMission";

export async function runExcelTest(file) {
  console.log("=================================");
  console.log("QAL INTELLIGENCE ENGINE v0.2");
  console.log("=================================");

  const workbook = await readExcelFile(file);
  const analysis = analyzeWorkbook(workbook);
  const missionUnderstanding = understandMission(testMission, analysis);
  const evaluation = evaluateCriteria(
    testMission,
    workbook,
    analysis,
    missionUnderstanding
  );

  console.log("\nMISSION UNDERSTANDING");
  console.log(JSON.stringify(missionUnderstanding, null, 2));

  console.log("\nPROTOTYPE EVALUATION");
  console.log(JSON.stringify(evaluation, null, 2));

  return {
    workbook,
    analysis,
    missionUnderstanding,
    evaluation,
  };
}
