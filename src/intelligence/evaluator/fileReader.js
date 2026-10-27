import * as XLSX from "xlsx";

export const EXCEL_FILE_LIMITS = Object.freeze({
  maxFileBytes: 10 * 1024 * 1024,
  maxSheets: 20,
  maxRowsPerSheet: 10_000,
  maxColumnsPerSheet: 100,
  maxTotalCells: 100_000,
});

export async function readExcelFile(file) {
  if (!file) {
    throw new Error("No Excel file provided.");
  }

  const extension = file.name?.split(".").pop()?.toLowerCase();
  if (!["xlsx", "xls", "csv"].includes(extension)) {
    throw new Error("Unsupported file type. Upload an XLSX, XLS, or CSV file.");
  }

  if (!Number.isFinite(file.size) || file.size < 0) {
    throw new Error("Unable to determine the Excel file size.");
  }

  if (file.size > EXCEL_FILE_LIMITS.maxFileBytes) {
    throw new Error("Excel file exceeds the 10 MB limit.");
  }

  const arrayBuffer = await file.arrayBuffer();
  if (arrayBuffer.byteLength === 0) {
    throw new Error("Excel file is empty.");
  }
  if (arrayBuffer.byteLength > EXCEL_FILE_LIMITS.maxFileBytes) {
    throw new Error("Excel file exceeds the 10 MB limit.");
  }

  const bytes = new Uint8Array(arrayBuffer);
  if (extension === "xlsx" && (bytes[0] !== 0x50 || bytes[1] !== 0x4b)) {
    throw new Error("The XLSX file is malformed or has the wrong file extension.");
  }
  const xlsSignature = [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1];
  if (extension === "xls" && !xlsSignature.every((value, index) => bytes[index] === value)) {
    throw new Error("The XLS file is malformed or has the wrong file extension.");
  }

  const workbook = XLSX.read(arrayBuffer, {
    type: "array",
    cellFormula: true,
    cellNF: true,
    cellStyles: true,
    sheetRows: EXCEL_FILE_LIMITS.maxRowsPerSheet + 1,
  });

  if (workbook.SheetNames.length === 0) {
    throw new Error("Workbook contains no worksheets.");
  }

  if (workbook.SheetNames.length > EXCEL_FILE_LIMITS.maxSheets) {
    throw new Error(`Workbook exceeds the ${EXCEL_FILE_LIMITS.maxSheets}-sheet limit.`);
  }

  let totalCells = 0;
  const sheetMetadata = workbook.SheetNames.map((sheetName) => {
    const worksheet = workbook.Sheets[sheetName];
    let range;

    try {
      range = XLSX.utils.decode_range(worksheet["!ref"] || "A1");
    } catch {
      throw new Error(`Worksheet "${sheetName}" has invalid dimensions.`);
    }

    const rowCount = range.e.r - range.s.r + 1;
    const columnCount = range.e.c - range.s.c + 1;
    if (
      !Number.isSafeInteger(rowCount) ||
      !Number.isSafeInteger(columnCount) ||
      rowCount < 1 ||
      columnCount < 1
    ) {
      throw new Error(`Worksheet "${sheetName}" has invalid dimensions.`);
    }

    if (rowCount > EXCEL_FILE_LIMITS.maxRowsPerSheet) {
      throw new Error(
        `Worksheet "${sheetName}" exceeds the ${EXCEL_FILE_LIMITS.maxRowsPerSheet.toLocaleString("en-US")}-row limit.`,
      );
    }

    if (columnCount > EXCEL_FILE_LIMITS.maxColumnsPerSheet) {
      throw new Error(
        `Worksheet "${sheetName}" exceeds the ${EXCEL_FILE_LIMITS.maxColumnsPerSheet}-column limit.`,
      );
    }

    totalCells += rowCount * columnCount;
    if (totalCells > EXCEL_FILE_LIMITS.maxTotalCells) {
      throw new Error(
        `Workbook exceeds the ${EXCEL_FILE_LIMITS.maxTotalCells.toLocaleString("en-US")}-cell limit.`,
      );
    }

    return { sheetName, worksheet, columnCount };
  });

  const sheets = sheetMetadata.map(({ sheetName, worksheet, columnCount }) => {
    const rows = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      defval: null,
      raw: true,
    });
    const formulas = Object.entries(worksheet)
      .filter(([address, cell]) =>
        !address.startsWith("!") && typeof cell?.f === "string",
      )
      .map(([address, cell]) => ({ address, formula: cell.f }));

    return {
      name: sheetName,
      rowCount: rows.length,
      columnCount,
      range: worksheet["!ref"] || null,
      headers: rows.length > 0 ? rows[0] : [],
      rows,
      formulas,
      formulaCount: formulas.length,
    };
  });

  return {
    fileName: file.name,
    fileSize: file.size,
    sheetCount: sheets.length,
    sheetNames: workbook.SheetNames,
    sheets,
  };
}
