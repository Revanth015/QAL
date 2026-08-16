import { readExcelFile } from "./evaluator/fileReader";
import { analyzeWorkbook } from "./evaluator/evidenceEngine";

export async function runExcelTest(file) {
  console.log("=================================");
  console.log("QAL INTELLIGENCE ENGINE v0.1");
  console.log("=================================");

  console.log("\nReading workbook...");

  const workbook = await readExcelFile(file);

  console.log("\nWORKBOOK");
  console.log("File:", workbook.fileName);
  console.log("Size:", workbook.fileSize, "bytes");
  console.log("Sheets:", workbook.sheetCount);
  console.log("Sheet names:", workbook.sheetNames);

  console.log("\nAnalyzing workbook...");

  const analysis = analyzeWorkbook(workbook);

  console.log("\nANALYSIS");
  console.log(JSON.stringify(analysis, null, 2));

  return {
    workbook,
    analysis,
  };
}