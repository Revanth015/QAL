import * as XLSX from "xlsx";

export async function readExcelFile(file) {
  if (!file) {
    throw new Error("No Excel file provided.");
  }

  const arrayBuffer = await file.arrayBuffer();

  const workbook = XLSX.read(arrayBuffer, {
    type: "array",
    cellFormula: true,
    cellNF: true,
    cellStyles: true,
  });

  const sheets = workbook.SheetNames.map((sheetName) => {
    const worksheet = workbook.Sheets[sheetName];

    const range = XLSX.utils.decode_range(
      worksheet["!ref"] || "A1"
    );

    const rows = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      defval: null,
      raw: true,
    });

    return {
      name: sheetName,
      rowCount: rows.length,
      columnCount: range.e.c - range.s.c + 1,
      range: worksheet["!ref"] || null,
      headers: rows.length > 0 ? rows[0] : [],
      rows,
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