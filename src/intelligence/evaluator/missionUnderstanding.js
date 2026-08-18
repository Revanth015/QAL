const STOP_WORDS = new Set([
  "the", "a", "an", "and", "or", "to", "of", "for", "in", "on",
  "with", "from", "by", "is", "are", "be", "this", "that", "using",
  "your", "their", "identify", "provide", "calculate", "correctly",
  "clear", "available", "data", "dataset", "analysis", "understanding",
]);

const SHEET_STOP_WORDS = [
  "instruction", "instructions", "readme", "read me", "metadata", "notes",
  "note", "cover", "guide", "expected workbook facts",
];

const CONCEPTS = {
  monetary_measure: ["revenue", "sales", "amount", "price", "cost", "profit", "income", "value"],
  quantity_measure: ["quantity", "qty", "units", "volume", "count"],
  rating_measure: ["rating", "score", "rank"],
  categorical: ["region", "product", "category", "type", "segment", "department", "customer", "company"],
  date_time: ["date", "time", "month", "year", "day", "period"],
};

export function understandMission(mission, workbookAnalysis) {
  if (!mission) throw new Error("Mission is required.");
  if (!workbookAnalysis) throw new Error("Workbook analysis is required.");

  const criteria = mission.criteria || [];
  const sheets = (workbookAnalysis.sheets || []).filter(
    (sheet) => !isMetadataSheet(sheet.name)
  );

  const columns = sheets.flatMap((sheet) =>
    (sheet.columnTypes || []).map((column) => ({
      sheet: sheet.name,
      ...column,
    }))
  );

  const missionText = normalize([
    mission.title,
    mission.description,
    ...(mission.objectives || []),
  ].filter(Boolean).join(" "));

  const criterionAnalysis = criteria.map((criterion) => {
    const criterionText = normalize([
      criterion.name,
      criterion.description,
      criterion.instructions,
    ].filter(Boolean).join(" "));

    const requirements = inferRequirements(criterionText);
    const relevantColumns = rankRelevantColumns(columns, requirements, criterionText);

    return {
      criterion: criterion.name,
      weight: criterion.weight,
      requirements,
      relevantColumns,
      requiredCapabilities: detectRequiredCapabilities(criterionText),
    };
  });

  return {
    mission: {
      title: mission.title,
      description: mission.description,
      objectives: mission.objectives || [],
    },
    workbook: {
      sheets: sheets.length,
      ignoredSheets: (workbookAnalysis.sheets || [])
        .filter((sheet) => isMetadataSheet(sheet.name))
        .map((sheet) => sheet.name),
      columnsFound: columns.length,
    },
    criterionAnalysis,
    overallRequirements: detectRequiredCapabilities(missionText),
  };
}

function rankRelevantColumns(columns, requirements, text) {
  return columns
    .map((column) => {
      const name = normalize(column.column);
      const semanticType = column.semanticType;
      const concepts = CONCEPTS[semanticType] || [];
      let score = 0;
      const matchedConcepts = [];

      for (const concept of concepts) {
        if (text.includes(concept)) {
          score += 4;
          matchedConcepts.push(concept);
        }
      }

      if (name && meaningfulTokens(text).some((token) => name === token)) {
        score += 5;
      }

      if (requirements.semanticTypes.includes(semanticType)) score += 3;
      if (requirements.needsIdentifier && semanticType === "identifier") score += 2;

      return {
        column,
        score,
        matchedConcepts: [...new Set(matchedConcepts)],
      };
    })
    .filter((item) => item.score >= 4)
    .sort((a, b) => b.score - a.score)
    .map((item) => ({
      ...item.column,
      relevanceScore: item.score,
      matchedConcepts: item.matchedConcepts,
    }));
}

function inferRequirements(text) {
  const semanticTypes = [];

  for (const [type, concepts] of Object.entries(CONCEPTS)) {
    if (concepts.some((concept) => text.includes(concept))) {
      semanticTypes.push(type);
    }
  }

  return {
    semanticTypes: [...new Set(semanticTypes)],
    needsIdentifier: text.includes("id") || text.includes("identifier") || text.includes("record"),
    needsComparison:
      text.includes("compare") || text.includes("comparison") || text.includes("highest") || text.includes("lowest") || text.includes("rank"),
    needsAggregation:
      text.includes("total") || text.includes("sum") || text.includes("average") || text.includes("mean") || text.includes("calculate"),
    needsRecommendation:
      text.includes("recommend") || text.includes("recommendation") || text.includes("business insight"),
  };
}

function meaningfulTokens(text) {
  return text
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 2 && !STOP_WORDS.has(token));
}

function normalize(value) {
  return String(value || "").toLowerCase().replace(/[_-]/g, " ").replace(/\s+/g, " ").trim();
}

function isMetadataSheet(name) {
  const normalized = normalize(name);
  return SHEET_STOP_WORDS.some((term) => normalized === term || normalized.includes(term));
}

function detectRequiredCapabilities(text) {
  const capabilities = [];
  if (/(revenue|sales|amount|price|cost|profit|income|value)/.test(text)) capabilities.push("monetary_analysis");
  if (/(region|category|product|segment|department|customer|company)/.test(text)) capabilities.push("categorical_comparison");
  if (/(total|sum|average|mean|calculate)/.test(text)) capabilities.push("aggregation");
  if (/(highest|lowest|top|rank|ranking|compare)/.test(text)) capabilities.push("ranking");
  if (/(trend|over time|monthly|daily|year|period)/.test(text)) capabilities.push("trend_analysis");
  if (/(recommend|recommendation|business insight)/.test(text)) capabilities.push("business_interpretation");
  if (/(clean|duplicate|missing|quality)/.test(text)) capabilities.push("data_quality");
  return [...new Set(capabilities)];
}
