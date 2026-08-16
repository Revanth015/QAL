export function understandMission(mission, workbookAnalysis) {
  if (!mission) {
    throw new Error("Mission is required.");
  }

  if (!workbookAnalysis) {
    throw new Error("Workbook analysis is required.");
  }

  const criteria = mission.criteria || [];

  const columns = workbookAnalysis.sheets.flatMap(
    (sheet) =>
      (sheet.columnTypes || []).map((column) => ({
        sheet: sheet.name,
        ...column,
      }))
  );

  const missionText = [
    mission.title || "",
    mission.description || "",
    ...(mission.objectives || []),
  ]
    .join(" ")
    .toLowerCase();

  const criterionAnalysis = criteria.map((criterion) => {
    const criterionText = [
      criterion.name || "",
      criterion.description || "",
      criterion.instructions || "",
    ]
      .join(" ")
      .toLowerCase();

    const combinedText = `${missionText} ${criterionText}`;

    const relevantColumns = columns.filter((column) =>
      columnMatchesRequirement(column, combinedText)
    );

    return {
      criterion: criterion.name,
      weight: criterion.weight,
      relevantColumns,
      requiredCapabilities:
        detectRequiredCapabilities(combinedText),
    };
  });

  return {
    mission: {
      title: mission.title,
      description: mission.description,
      objectives: mission.objectives || [],
    },

    workbook: {
      sheets: workbookAnalysis.totalSheets,
      columnsFound: columns.length,
    },

    criterionAnalysis,

    overallRequirements:
      detectRequiredCapabilities(missionText),
  };
}

function columnMatchesRequirement(column, text) {
  const name = String(column.column).toLowerCase();

  const semanticType = column.semanticType;

  const keywordMatches = [
    ...name.split(/[_\s-]+/),
  ].some((word) => text.includes(word));

  const semanticMatches =
    (text.includes("revenue") &&
      semanticType === "monetary_measure") ||
    (text.includes("sales") &&
      semanticType === "monetary_measure") ||
    (text.includes("quantity") &&
      semanticType === "quantity_measure") ||
    (text.includes("rating") &&
      semanticType === "rating_measure") ||
    (text.includes("region") &&
      semanticType === "categorical") ||
    (text.includes("product") &&
      semanticType === "categorical");

  return keywordMatches || semanticMatches;
}

function detectRequiredCapabilities(text) {
  const capabilities = [];

  if (
    text.includes("revenue") ||
    text.includes("sales") ||
    text.includes("amount")
  ) {
    capabilities.push("monetary_analysis");
  }

  if (
    text.includes("region") ||
    text.includes("category") ||
    text.includes("product")
  ) {
    capabilities.push("categorical_comparison");
  }

  if (
    text.includes("total") ||
    text.includes("sum") ||
    text.includes("calculate")
  ) {
    capabilities.push("aggregation");
  }

  if (
    text.includes("highest") ||
    text.includes("lowest") ||
    text.includes("top") ||
    text.includes("rank")
  ) {
    capabilities.push("ranking");
  }

  if (
    text.includes("trend") ||
    text.includes("over time") ||
    text.includes("monthly") ||
    text.includes("daily")
  ) {
    capabilities.push("trend_analysis");
  }

  if (
    text.includes("recommend") ||
    text.includes("recommendation") ||
    text.includes("business insight")
  ) {
    capabilities.push("business_interpretation");
  }

  if (
    text.includes("clean") ||
    text.includes("duplicate") ||
    text.includes("missing")
  ) {
    capabilities.push("data_quality");
  }

  return [...new Set(capabilities)];
}