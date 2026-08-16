export function analyzeWorkbook(workbookData) {
  const analysis = {
    totalSheets: workbookData.sheetCount,
    sheets: [],
    warnings: [],
  };

  for (const sheet of workbookData.sheets) {
    const headers = sheet.headers || [];
    const rows = sheet.rows || [];

    const dataRows = rows.slice(1);

    const missingCells = countMissingCells(dataRows);
    const duplicateRows = countDuplicateRows(dataRows);

    const columnTypes = classifyAllColumns(
  headers,
  dataRows
);

const numericColumns = columnTypes.filter(
  (column) =>
    column.semanticType !== "categorical" &&
    column.semanticType !== "text" &&
    column.semanticType !== "date_time"
);

    analysis.sheets.push({
  name: sheet.name,
  rowCount: Math.max(sheet.rowCount - 1, 0),
  columnCount: sheet.columnCount,
  headers,
  missingCells,
  duplicateRows,
  numericColumns,
  columnTypes,
});

    if (missingCells > 0) {
      analysis.warnings.push(
        `${sheet.name}: ${missingCells} missing cells detected.`
      );
    }

    if (duplicateRows > 0) {
      analysis.warnings.push(
        `${sheet.name}: ${duplicateRows} duplicate rows detected.`
      );
    }
  }

  return analysis;
}

function countMissingCells(rows) {
  let count = 0;

  for (const row of rows) {
    for (const value of row) {
      if (
        value === null ||
        value === undefined ||
        value === ""
      ) {
        count++;
      }
    }
  }

  return count;
}

function countDuplicateRows(rows) {
  const seen = new Set();
  let duplicates = 0;

  for (const row of rows) {
    const key = JSON.stringify(row);

    if (seen.has(key)) {
      duplicates++;
    } else {
      seen.add(key);
    }
  }

  return duplicates;
}

function findNumericColumns(headers, rows) {
  const result = [];

  headers.forEach((header, index) => {
    if (!header) return;

    const headerText = String(header)
      .toLowerCase()
      .replace(/[_-]/g, " ")
      .trim();

    const values = rows
      .map((row) => row[index])
      .filter(
        (value) =>
          value !== null &&
          value !== undefined &&
          value !== ""
      );

    if (!values.length) return;

    const numericCount = values.filter(
      (value) =>
        typeof value === "number" &&
        Number.isFinite(value)
    ).length;

    if (numericCount / values.length < 0.8) {
      return;
    }

    const semanticType = classifyNumericColumn(headerText);

    result.push({
      column: header,
      index,
      numericValues: numericCount,
      semanticType,
    });
  });

  return result;
}

function classifyNumericColumn(header) {
  const identifierPatterns = [
    "id",
    "code",
    "identifier",
    "number",
    "no",
  ];

  const monetaryPatterns = [
    "revenue",
    "sales",
    "amount",
    "price",
    "cost",
    "value",
    "profit",
    "income",
  ];

  const percentagePatterns = [
    "%",
    "percent",
    "percentage",
    "margin",
    "rate",
  ];

  const ratingPatterns = [
    "rating",
    "score",
    "rank",
  ];

  const quantityPatterns = [
    "quantity",
    "qty",
    "units",
    "volume",
    "count",
  ];

  if (
    identifierPatterns.some(
      (pattern) =>
        header === pattern ||
        header.startsWith(`${pattern} `) ||
        header.endsWith(` ${pattern}`)
    )
  ) {
    return "identifier";
  }

  if (
    monetaryPatterns.some((pattern) =>
      header.includes(pattern)
    )
  ) {
    return "monetary_measure";
  }

  if (
    percentagePatterns.some((pattern) =>
      header.includes(pattern)
    )
  ) {
    return "percentage_measure";
  }

  if (
    ratingPatterns.some((pattern) =>
      header.includes(pattern)
    )
  ) {
    return "rating_measure";
  }

  if (
    quantityPatterns.some((pattern) =>
      header.includes(pattern)
    )
  ) {
    return "quantity_measure";
  }

  return "numeric_measure";
}

function classifyColumn(header, values) {
  const headerText = String(header)
    .toLowerCase()
    .replace(/[_-]/g, " ")
    .trim();

  if (
    headerText.includes("id") ||
    headerText.includes("code") ||
    headerText.includes("identifier")
  ) {
    return "identifier";
  }

  if (
    headerText.includes("date") ||
    headerText.includes("time")
  ) {
    return "date_time";
  }

  if (
    headerText.includes("name") ||
    headerText.includes("product") ||
    headerText.includes("category") ||
    headerText.includes("region") ||
    headerText.includes("type")
  ) {
    return "categorical";
  }

  const uniqueValues = new Set(
    values.map((value) => String(value))
  );

  if (uniqueValues.size <= Math.max(20, values.length * 0.2)) {
    return "categorical";
  }

  return "text";
}

function classifyAllColumns(headers, rows) {
  return headers.map((header, index) => {
    const values = rows
      .map((row) => row[index])
      .filter(
        (value) =>
          value !== null &&
          value !== undefined &&
          value !== ""
      );

    const numericCount = values.filter(
      (value) =>
        typeof value === "number" &&
        Number.isFinite(value)
    ).length;

    if (
      values.length > 0 &&
      numericCount / values.length >= 0.8
    ) {
      return {
        column: header,
        index,
        semanticType: classifyNumericColumn(
          String(header)
            .toLowerCase()
            .replace(/[_-]/g, " ")
            .trim()
        ),
      };
    }

    return {
      column: header,
      index,
      semanticType: classifyColumn(header, values),
    };
  });
}