# QAL Excel Submission & Evaluation Guide

## Purpose

This document is the shared contract between the **mission designer**, the **student**, and the **QAL Intelligence Engine**.

It explains how an intended Excel submission should be structured so that QAL can reliably understand:

1. what data the student was given;
2. what process the student performed;
3. what statistical or analytical test was used;
4. what result the process produced; and
5. what conclusion or business insight was derived from that result.

The guide is intentionally explicit. A well-structured workbook makes automated evaluation more reliable and makes the student's analytical work auditable.

---

# 1. Recommended workbook structure

Unless a mission explicitly specifies another structure, use the following pattern.

```text
01_Data
02_Analysis
03_Results
04_Conclusion
05_Notes          (optional)
```

Sheet names are recommendations, not universal requirements. The **mission-specific instructions always take precedence**.

## 01_Data

Contains the source data provided for the task or the cleaned working copy.

Recommended contents:

- one clear header row;
- one variable/field per column;
- one observation/record per row;
- stable identifiers where appropriate;
- no merged cells inside the data table;
- no decorative rows above the header;
- dates stored as dates where possible;
- numeric measures stored as numbers, not formatted text.

Example:

| Order_ID | Product | Region | Quantity | Revenue |
|---|---|---|---:|---:|
| 1001 | Laptop | South | 4 | 120000 |
| 1002 | Monitor | North | 6 | 90000 |

---

# 2. Analysis / Process sheet

If a mission requires a statistical test or analytical method, the student should show the **process**, not only the answer.

Recommended sheet name:

```text
02_Analysis
```

For every major analysis, make the following visible:

```text
Analysis Name
Method / Test
Input Variable(s)
Grouping Variable (if applicable)
Sample / Filter Used
Formula / Excel Function / Procedure
Intermediate Calculations
Test Statistic / Model Output
p-value / confidence interval / relevant statistic
Decision Rule
```

Example for a t-test:

| Field | Value |
|---|---|
| Analysis | Customer Rating Comparison |
| Test | Independent Two-Sample t-test |
| Variable | Customer_Rating |
| Group | Region |
| Group A | South |
| Group B | North |
| Alpha | 0.05 |
| t-statistic | 2.31 |
| p-value | 0.026 |
| Decision | Reject H0 |

The exact statistical test must match the mission. Do not claim a test was performed merely by typing its name.

---

# 3. Show the actual process

QAL should be able to distinguish a real analytical process from a final answer typed into a cell.

Where possible, show one or more of:

- Excel formulas;
- pivot tables;
- calculated columns;
- intermediate tables;
- aggregation tables;
- statistical-test outputs;
- regression/model output;
- charts that correspond to the analysis;
- clearly labelled calculation blocks.

### Good

```text
Region | SUM Revenue
South  | 793000
North  | 440000
West   | 423000
East   | 217000
```

with a visible formula/pivot/calculation supporting the totals.

### Weak

```text
Highest Region = South
```

with no supporting calculation.

The second example may contain the correct answer but does not demonstrate the analytical process.

---

# 4. Statistical tests

When a mission requests a statistical test, the workbook should identify the test explicitly and expose its important outputs.

## Descriptive statistics

Where requested, show appropriate statistics such as:

- N;
- mean;
- median;
- standard deviation;
- minimum;
- maximum;
- quartiles;
- confidence interval where required.

## t-test

Recommended evidence:

- groups/variables compared;
- sample sizes;
- hypotheses;
- alpha/significance level;
- test type;
- t-statistic;
- p-value;
- decision;
- interpretation.

## Chi-square test

Recommended evidence:

- categorical variables;
- observed frequency table;
- expected frequency table where applicable;
- chi-square statistic;
- degrees of freedom;
- p-value;
- decision;
- interpretation.

## ANOVA

Recommended evidence:

- dependent variable;
- groups/factor;
- group sizes;
- group means where useful;
- ANOVA table;
- F-statistic;
- degrees of freedom;
- p-value;
- decision;
- post-hoc analysis when required by the mission.

## Correlation

Recommended evidence:

- variables tested;
- sample size;
- correlation coefficient;
- p-value when required;
- direction and strength interpretation.

## Regression

Recommended evidence:

- dependent variable;
- independent variable(s);
- model specification;
- coefficients;
- R-squared / adjusted R-squared where appropriate;
- significance information;
- prediction output where required;
- interpretation.

The mission may require additional statistics. The mission-specific scoring criteria remain authoritative.

---

# 5. Results sheet

Recommended sheet name:

```text
03_Results
```

This sheet should contain the **result produced by the process**.

Example:

| Region | Total Revenue | Rank |
|---|---:|---:|
| South | 793000 | 1 |
| North | 440000 | 2 |
| West | 423000 | 3 |
| East | 217000 | 4 |

This is different from the conclusion.

**Process result:** South has ₹793,000 revenue.

**Derived result:** South is the highest-revenue region.

QAL evaluates these separately.

---

# 6. Conclusion / Business interpretation

Recommended sheet name:

```text
04_Conclusion
```

A conclusion should be derived from the displayed results.

Recommended structure:

```text
Finding
Evidence
Business Meaning
Recommendation
Limitation / Caveat
```

Example:

> South generated the highest total revenue at ₹793,000. This is approximately ₹353,000 above North, the second-highest region. Based on the observed revenue performance, the company should investigate the drivers of South's performance and consider prioritising resources there while checking whether the result is driven by volume, pricing, or product mix.

The conclusion should not introduce numbers that cannot be traced to the analysis.

---

# 7. Formula and process transparency

When formulas are used, prefer transparent formulas in the workbook rather than pasting only their final values.

Examples:

```excel
=SUMIF(C:C,"South",E:E)
```

or a pivot table / equivalent reproducible calculation.

For statistical tests, use the appropriate Excel function or analysis output when the mission allows it.

QAL may use the underlying workbook values to independently reproduce or validate the calculation.

**Important:** displaying a formula is evidence of the intended process, but QAL should still verify that the process uses the correct variables and produces a valid result.

---

# 8. Naming rules

Use clear names for sheets, columns, tables, and analysis blocks.

### Prefer

```text
01_Data
02_Analysis
03_Results
04_Conclusion
Revenue
Customer_Rating
Region
T_Test_Rating
Regional_Revenue
```

### Avoid

```text
Sheet1
Sheet2
Final_Final2
abc
x1
Answer
```

Generic names are allowed when the mission does not control the workbook, but meaningful names make automated interpretation easier.

---

# 9. If the mission provides a specific template

The mission template takes priority over this guide.

For example, if the mission says:

```text
Input sheet: Raw_Data
Analysis sheet: Hypothesis_Test
Output sheet: Management_Summary
```

the student should use those names.

QAL should use the mission instructions and scoring criteria to understand the intended structure rather than requiring a universal sheet naming convention.

---

# 10. What QAL evaluates

QAL's intended evaluation model is:

```text
Workbook
   ↓
Data / structure
   ↓
Required method or statistical test
   ↓
Actual analytical process
   ↓
Process result
   ↓
Derived result / conclusion
   ↓
Business interpretation
```

A correct final answer without supporting work should not automatically receive full marks.

Likewise, a student should not be penalised merely for using a different sheet name if the mission does not prescribe one and the analytical evidence is clear.

---

# 11. Evidence hierarchy

QAL should prefer evidence in approximately this order:

1. Reproducible calculation / formula / statistical output;
2. Clearly labelled intermediate result;
3. Final numerical result that can be independently verified;
4. Derived conclusion supported by the result;
5. Written explanation;
6. Unsupported final answer.

This hierarchy is intended to prevent answer-only submissions from receiving the same confidence as transparent analytical work.

---

# 12. Mission designer checklist

When creating a mission, the admin/mission generator should specify, where relevant:

- required input sheet(s);
- expected data fields;
- optional recommended sheet names;
- required statistical test or analytical method;
- variables to analyse;
- expected process evidence;
- required intermediate outputs;
- expected result format;
- required derived conclusion;
- business recommendation requirements;
- scoring weights for each stage.

A mission should tell the student **what must be demonstrated**, not necessarily prescribe every cell location unless that is pedagogically important.

---

# 13. Mission-specific Excel contract

For future QAL missions, the preferred approach is to store an explicit Excel contract with the mission.

Conceptually:

```json
{
  "inputSheets": ["01_Data"],
  "recommendedSheets": [
    "02_Analysis",
    "03_Results",
    "04_Conclusion"
  ],
  "requiredMethods": ["regional_aggregation"],
  "requiredEvidence": [
    "process",
    "process_result",
    "derived_result"
  ],
  "requiredOutputs": [
    "regional_total_revenue",
    "highest_revenue_region"
  ]
}
```

This is a **contract example**, not a requirement that every mission use these exact fields.

The future QAL evaluator should consult this contract together with the mission description and scoring criteria.

---

# 14. Student-facing principle

The simplest rule for students is:

> **Show your work, show the result, and show how you derived your conclusion.**

If a statistical test is required:

> **Show the test, its important outputs, the decision, and the interpretation.**

This gives QAL enough evidence to evaluate the analytical thinking rather than just the final answer.
