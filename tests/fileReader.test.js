import assert from "node:assert/strict";
import test from "node:test";
import * as XLSX from "xlsx";
import { EXCEL_FILE_LIMITS, readExcelFile } from "../src/intelligence/evaluator/fileReader.js";

function workbookFile(workbook, name = "submission.xlsx", bookType = "xlsx") {
  const bytes = XLSX.write(workbook, { type: "array", bookType });
  return new File([bytes], name, {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}

function workbookWithSheet(rows, sheetName = "Data") {
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(rows), sheetName);
  return workbook;
}

test("reads worksheet rows and extracts formula evidence", async () => {
  const workbook = workbookWithSheet([
    ["Value", "Calculated"],
    [3, { t: "n", f: "A2*2", v: 6 }],
  ]);

  const result = await readExcelFile(workbookFile(workbook));
  assert.equal(result.sheetCount, 1);
  assert.deepEqual(result.sheets[0].headers, ["Value", "Calculated"]);
  assert.deepEqual(result.sheets[0].rows[1], [3, 6]);
  assert.deepEqual(result.sheets[0].formulas, [{ address: "B2", formula: "A2*2" }]);
  assert.equal(result.sheets[0].formulaCount, 1);
});

test("accepts an empty worksheet", async () => {
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, {}, "Empty");

  const result = await readExcelFile(workbookFile(workbook));
  assert.equal(result.sheets[0].rowCount, 0);
  assert.deepEqual(result.sheets[0].rows, []);
});

test("rejects a missing file", async () => {
  await assert.rejects(readExcelFile(null), /No Excel file provided/);
});

test("rejects oversized files before reading their contents", async () => {
  let readCalled = false;
  const file = {
    name: "large.xlsx",
    size: EXCEL_FILE_LIMITS.maxFileBytes + 1,
    async arrayBuffer() {
      readCalled = true;
      return new ArrayBuffer(0);
    },
  };

  await assert.rejects(readExcelFile(file), /10 MB limit/);
  assert.equal(readCalled, false);
});

test("rejects bytes exceeding the limit even when file metadata understates size", async () => {
  const file = {
    name: "large.xlsx",
    size: 1,
    async arrayBuffer() {
      return new ArrayBuffer(EXCEL_FILE_LIMITS.maxFileBytes + 1);
    },
  };

  await assert.rejects(readExcelFile(file), /10 MB limit/);
});

test("rejects malformed workbook bytes", async () => {
  const file = new File([new Uint8Array([1, 2, 3])], "malformed.xlsx");
  await assert.rejects(readExcelFile(file));
});

test("rejects workbooks with too many sheets", async () => {
  const workbook = XLSX.utils.book_new();
  for (let index = 0; index <= EXCEL_FILE_LIMITS.maxSheets; index++) {
    XLSX.utils.book_append_sheet(workbook, { A1: { t: "n", v: index }, "!ref": "A1" }, `Sheet${index}`);
  }

  await assert.rejects(readExcelFile(workbookFile(workbook)), /20-sheet limit/);
});

test("rejects sheets wider than the column limit before row conversion", async () => {
  const workbook = workbookWithSheet([Array(EXCEL_FILE_LIMITS.maxColumnsPerSheet + 1).fill(1)]);
  await assert.rejects(readExcelFile(workbookFile(workbook)), /100-column limit/);
});

test("rejects sheets taller than the row limit before row conversion", async () => {
  const workbook = workbookWithSheet(Array.from(
    { length: EXCEL_FILE_LIMITS.maxRowsPerSheet + 1 },
    () => [1],
  ));
  await assert.rejects(readExcelFile(workbookFile(workbook)), /10,000-row limit/);
});

test("rejects workbooks exceeding the total cell limit before row conversion", async () => {
  const workbook = workbookWithSheet(Array.from({ length: 1_001 }, () => Array(100).fill(1)));
  await assert.rejects(readExcelFile(workbookFile(workbook)), /100,000-cell limit/);
});

test("continues to read CSV uploads", async () => {
  const file = new File(["Region,Revenue\nSouth,793000"], "sales.csv", { type: "text/csv" });
  const result = await readExcelFile(file);
  assert.deepEqual(result.sheets[0].rows, [["Region", "Revenue"], ["South", 793000]]);
});

test("continues to read legacy XLS uploads", async () => {
  const workbook = workbookWithSheet([["Region", "Revenue"], ["South", 793000]]);
  const file = workbookFile(workbook, "sales.xls", "biff8");
  const result = await readExcelFile(file);
  assert.deepEqual(result.sheets[0].rows, [["Region", "Revenue"], ["South", 793000]]);
});

test("rejects empty files", async () => {
  const file = new File([], "empty.xlsx");
  await assert.rejects(readExcelFile(file), /file is empty/);
});

test("rejects unsupported file extensions", async () => {
  let readCalled = false;
  const file = {
    name: "submission.txt",
    size: 0,
    async arrayBuffer() {
      readCalled = true;
      return new ArrayBuffer(0);
    },
  };

  await assert.rejects(readExcelFile(file), /Unsupported file type/);
  assert.equal(readCalled, false);
});
