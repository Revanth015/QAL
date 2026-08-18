const TEST_PATTERNS = [
  ["t-test", /\bt[- ]?test\b/i],
  ["chi-square", /\bchi[- ]?square\b|\bchi2\b/i],
  ["anova", /\banova\b|analysis of variance/i],
  ["z-test", /\bz[- ]?test\b/i],
  ["correlation", /\bcorrelation\b|\bpearson\b|\bspearman\b/i],
  ["regression", /\bregression\b|\blinear model\b/i],
  ["confidence interval", /\bconfidence interval\b|\bconfidence level\b/i],
  ["descriptive statistics", /\bdescriptive statistics\b|\bmean\b.*\bmedian\b|\bmedian\b.*\bmean\b/i],
];

/**
 * Identifies statistical methods requested by a criterion and checks whether
 * the submitted workbook contains a defensible trace of that method.
 *
 * This is intentionally conservative. A text mention alone is not treated as
 * a successful statistical test. We require either a recognised spreadsheet
 * formula/function, or a clearly labelled method/result in the workbook.
 */
export function runStatisticalTestChecks({ criterionText = "", workbook, relevantColumns = [] }) {
  const requestedTests = TEST_PATTERNS
    .filter(([, pattern]) => pattern.test(criterionText))
    .map(([name]) => name);

  const workbookText = collectWorkbookText(workbook);
  const formulaText = collectFormulaText(workbook);
  const detectedTests = [];

  for (const [name, pattern] of TEST_PATTERNS) {
    if (pattern.test(workbookText) || pattern.test(formulaText)) {
      detectedTests.push(name);
    }
  }

  // Common Excel statistical functions count as process evidence even when
  // the workbook does not contain the test name as plain text.
  const functionSignals = {
    "t-test": /T\.TEST|TTEST/i,
    "chi-square": /CHISQ\.TEST|CHITEST/i,
    anova: /ANOVA/i,
    "z-test": /NORM\.S\.DIST|NORM\.DIST|Z\.TEST/i,
    correlation: /CORREL|PEARSON|SPEARMAN/i,
    regression: /LINEST|TREND|SLOPE|INTERCEPT|RSQ/i,
    "confidence interval": /CONFIDENCE\.NORM|CONFIDENCE\.T/i,
    "descriptive statistics": /AVERAGE|MEDIAN|STDEV|VAR\.S|VARIANCE/i,
  };

  for (const [name, pattern] of Object.entries(functionSignals)) {
    if (pattern.test(formulaText) && !detectedTests.includes(name)) {
      detectedTests.push(name);
    }
  }

  const validatedTests = requestedTests.filter((name) => detectedTests.includes(name));
  const missingTests = requestedTests.filter((name) => !validatedTests.includes(name));

  return {
    requestedTests,
    detectedTests,
    validatedTests,
    missingTests,
    relevantColumns: relevantColumns.map((item) => ({
      sheet: item.sheet,
      column: item.column,
      semanticType: item.semanticType,
    })),
  };
}

function collectWorkbookText(workbook) {
  const values = [];
  for (const sheet of workbook?.sheets || []) {
    for (const row of sheet.rows || []) {
      for (const cell of row || []) {
        if (cell !== null && cell !== undefined) values.push(String(cell));
      }
    }
  }
  return values.join(" ");
}

function collectFormulaText(workbook) {
  return (workbook?.sheets || [])
    .flatMap((sheet) => sheet.formulas || [])
    .map((item) => `${item.address || ""} ${item.formula || ""}`)
    .join(" ");
}
