# QAL — Quantrix Analytics League

QAL is an interactive learning and assessment platform built around **story-driven missions, practical data tasks, autonomous evaluation, and continuous improvement**.

The long-term product is not intended to be a conventional LMS. QAL is intended to become an intelligence-powered challenge platform where admins create engaging missions, students complete real analytical tasks, and the QAL Intelligence Engine reads submissions, reasons against mission-specific criteria, scores work with evidence, learns from corrections, and eventually helps generate new missions.

## Product Vision

```text
Mission Generation → Story + Challenge → Student Mission → Submission
        → QAL Intelligence Engine → Evidence + Reasoning → Scores
        → Feedback + XP → Admin Review / Correction → Experience Memory
        → Improved Evaluation + Better Missions
```

QAL should eventually support practical missions for Excel, Statistics, SQL, Power BI, Python, AI, and other business/analytics skills.

---

## Current Technology

- React + Vite
- React Router
- Tailwind CSS
- Supabase authentication, database, and storage
- `xlsx` for browser-side Excel/XLS/CSV parsing

The intelligence layer is deliberately separated from UI code so a future LLM can replace or augment the reasoning layer without rebuilding the application.

---

# Completed Work

## Application / Authentication

- React/Vite application foundation
- Supabase authentication
- User profiles and role-aware behaviour
- Admin-only routing through `AdminRoute`
- Admin navigation visible only to admins

## Mission System

Mission records currently support fields including `id`, `topic_id`, `title`, `description`, `difficulty`, `xp_reward`, `excel_file`, `deadline`, `is_active`, and `created_at`.

Current topics:

- Excel 📊
- Statistics 📈
- SQL 🗄️
- Power BI 📉
- Python 🐍
- AI 🤖

Student mission functionality implemented:

- Mission listing and details
- Topic/difficulty/XP/deadline display
- Mission description
- Mission dataset download
- Excel/XLS/CSV submission
- Existing submission detection
- Submission status

Mission datasets are stored in Supabase Storage and linked through `missions.excel_file`.

## Submission System

Current `submissions` structure supports `id`, `user_id`, `mission_id`, `submission_file`, `score`, `feedback`, `status`, and `submitted_at`.

The submission workflow has been manually tested with a real stored submission.

## Admin System

Implemented:

- Admin dashboard foundation
- Admin-only routing
- Admin mission-management foundation
- Mission creation page
- Admin submission list
- Admin submission details/review page
- Submitted-file download
- Mission scoring criteria display

The admin area is intended to become the control centre for missions, submissions, evaluations, analytics, and intelligence oversight.

## Scoring Criteria

`mission_scoring_criteria` is the mission-specific source of truth for evaluation criteria.

The future evaluator must read criteria from the mission rather than hard-coding criterion names, weights, or column names.

Database security must continue to use appropriate Row Level Security policies for new user/student/admin data.

---

# QAL Intelligence Engine — Current State

The intelligence engine is currently a **working prototype**, not yet a true autonomous AI evaluator.

## v0.1 — Workbook Reader ✅

The engine can read an uploaded workbook and identify:

- Number of sheets
- Sheet names
- Row count
- Column count
- Headers
- Rows/values
- Missing cells
- Duplicate rows
- Numeric columns

```text
Excel → XLSX parser → Workbook → Sheets / rows / columns / values
```

## v0.2 — Semantic Column Intelligence ✅

Columns are classified semantically rather than treating every number as equivalent.

Supported categories include:

```text
identifier
categorical
quantity_measure
monetary_measure
percentage_measure
rating_measure
numeric_measure
date_time
text
```

The controlled test workbook is correctly understood as:

```text
Order_ID        → identifier
Product         → categorical
Region          → categorical
Quantity        → quantity_measure
Revenue         → monetary_measure
Customer_Rating → rating_measure
```

This is the foundation for reasoning over meaning rather than raw data types.

## v0.3 — Mission Understanding Prototype ✅ / LIMITED

The engine can accept a mission definition plus workbook analysis and identify mission title, description, objectives, scoring criteria, criterion weights, candidate relevant columns, and capabilities such as monetary analysis, categorical comparison, aggregation, ranking, trend analysis, business interpretation, and data quality.

A controlled `Sales Detective` mission was used to test this.

### Known limitation

The current mission-understanding logic is still **keyword/rule based and too broad**. It can select unrelated columns because mission-wide text and criterion text are currently combined for matching. It must be improved before autonomous scoring is considered reliable.

The next intelligence milestone is **criterion-specific reasoning**, not simply adding more keywords.

---

# Excel Submission & Evaluation Contract

QAL now has a reusable help document for mission designers and students:

**`docs/QAL_EXCEL_SUBMISSION_GUIDE.md`**

The guide can be consulted when a mission needs a clearer Excel contract. It defines recommended sheet naming (`01_Data`, `02_Analysis`, `03_Results`, `04_Conclusion`), how statistical tests should be represented, how to show the analytical process, how process results differ from derived conclusions, formula/process transparency, evidence hierarchy, and how mission-specific templates override the generic recommendations.

The important principle is:

```text
Data
 ↓
Method / Statistical Test
 ↓
Actual Process
 ↓
Process Result
 ↓
Derived Result / Conclusion
 ↓
Business Interpretation
```

This guide is a recommendation and evaluation aid, not a rigid universal template. Mission-specific instructions and scoring criteria remain authoritative.

---

# Intelligence Test / Ground Truth

A controlled workbook named `QAL_Intelligence_Test.xlsx` was created for repeatable testing. It contains `Sales_Data` and `Instructions` sheets.

`Sales_Data` intentionally contains:

- 21 data rows
- 6 columns
- 1 missing cell
- 1 duplicate row

The engine successfully detects these conditions.

For the `Sales Detective` test mission, expected regional revenue totals are:

| Region | Total Revenue |
|---|---:|
| South | ₹793,000 |
| North | ₹440,000 |
| West | ₹423,000 |
| East | ₹217,000 |

Expected highest-revenue region: **South**.

This is a future ground-truth test. QAL must independently calculate these values from the workbook rather than receiving the answer directly.

---

# Target Intelligence Architecture

Planned architecture:

```text
src/intelligence/
│
├── core/
│   ├── agent.js
│   ├── memory.js
│   └── reasoning.js
│
├── evaluator/
│   ├── fileReader.js
│   ├── evidenceEngine.js
│   ├── missionUnderstanding.js
│   ├── criterionEvaluator.js
│   ├── scoreEngine.js
│   └── evaluationEngine.js
│
├── generator/
│   ├── missionGenerator.js
│   ├── storyGenerator.js
│   ├── phaseGenerator.js
│   └── criteriaGenerator.js
│
└── learning/
    ├── experienceStore.js
    ├── feedbackAnalyzer.js
    └── evaluatorCalibration.js
```

Some listed components are **planned only** and must not be treated as implemented.

---

# Target Autonomous Evaluation

```text
Mission + Scoring Criteria + Student Submission
                     ↓
File Reader → Workbook Understanding → Mission Understanding
                     ↓
          Criterion-specific Reasoning
                     ↓
             Evidence Extraction
                     ↓
              Calculations / Analysis
                     ↓
              Criterion Evaluation
                     ↓
               Weighted Score
                     ↓
        Evidence + Reasoning + Confidence
                     ↓
                  Feedback
                     ↓
             Persist Evaluation
```

Every criterion should eventually produce:

```text
criterion
score
maxScore
weight
evidence
reasoning
confidence
feedback
```

The evaluator should determine what the student was asked to do, which workbook evidence is relevant, what the student actually did, whether the result is correct, what evidence supports the score, confidence in the decision, and how the student can improve.

It must not reduce evaluation to simplistic rules such as `column exists = marks`.

---

# Evaluation Evidence Philosophy

QAL should evaluate analytical work in stages rather than rewarding only a final answer.

```text
Required statistical test / analytical method
                 ↓
Actual analytical process
                 ↓
Process result
                 ↓
Derived result / conclusion
                 ↓
Business interpretation
```

A correct final answer without supporting work should not automatically receive full marks. At the same time, students should not be penalised merely for using different sheet names when the mission did not prescribe them and the evidence is clear.

The evaluator should prefer reproducible formulas/statistical output, clearly labelled intermediate results, independently verifiable final results, and supported conclusions over unsupported answer-only cells.

See `docs/QAL_EXCEL_SUBMISSION_GUIDE.md` for the detailed workbook contract and examples.

---

# Self-Improvement / Experience Memory

The long-term system should improve through persistent experience rather than uncontrolled self-modification.

Each evaluation should eventually preserve:

```text
Mission
Submission
Criteria
Evidence
AI score
AI reasoning
AI confidence
Admin correction
Admin feedback/reason
Final accepted result
```

Example:

```text
AI score: 82
Admin correction: 74
Difference: -8
Reason: AI overvalued visualization and undervalued business interpretation
```

This becomes **experience memory**.

The system should distinguish:

- **Knowledge** — general domain knowledge
- **Mission knowledge** — what a specific mission expects
- **Evaluation experience** — previous submissions, decisions, corrections, and outcomes
- **Creative memory** — successful story structures, themes, phases, challenge patterns, and engagement feedback

Human/admin corrections should become structured learning signals. The system should not blindly rewrite its own source code or model.

---

# Future Mission Generator

A major future feature is an AI-assisted mission creator.

Admin should eventually be able to provide details such as:

```text
Topic: Excel
Skills: Pivot Tables + Business Analysis
Difficulty: Intermediate
Duration: 30 minutes
Theme: Space exploration
Student level: PGDM
```

QAL should generate a mission blueprint containing:

- Mission title
- Story
- Student role
- Situation/problem
- Objectives
- Phases
- Tasks
- Dataset requirements
- Constraints
- Hints
- Expected outcomes
- Scoring criteria
- Evaluation instructions
- Expected solution/evidence

Example concept:

> **Operation: Save the Mars Colony** — students act as operations analysts using a supply-chain dataset to diagnose a failing colony supply network.

Generated missions must be engaging and varied while retaining measurable learning objectives and objectively assessable outcomes.

---

# Long-Term QAL Loop

```text
Admin gives mission idea
        ↓
Mission Generator
        ↓
Story + phases + dataset requirements
        ↓
Scoring Matrix Generator
        ↓
Evaluation Instructions
        ↓
Admin Review
        ↓
Publish
        ↓
Student completes mission
        ↓
Submission
        ↓
QAL Intelligence Engine
        ↓
Score + Evidence + Feedback
        ↓
Admin Review / Correction
        ↓
Experience Memory
        ↓
Improved Future Evaluation + Mission Generation
```

---

# Admin Product Direction

### Admin Dashboard

Eventually track active/draft missions, submissions, pending evaluations, average scores, mission performance, student performance, AI confidence, AI/admin disagreement, and intelligence calibration.

### Mission Management

Eventually support create/edit/delete/deactivate, datasets, topics, difficulty, XP, deadlines, phases, scoring criteria, preview, publish/unpublish, and AI-assisted mission generation.

### Submission Management

Eventually support submission details, file download, AI score, evidence, reasoning, admin score override, admin feedback, re-run evaluation, and evaluation history.

### Intelligence Management

Eventually support AI confidence, AI/admin disagreement, calibration examples, experience inspection, domain knowledge management, and generated mission review.

---

# Database Direction

Current important entities:

```text
users
missions
topics / mission_topics
mission_scoring_criteria
submissions
```

Future intelligence-related entities may include:

```text
evaluations
evaluation_criteria_results
evaluation_evidence
experience_memory
admin_corrections
mission_generation_history
```

These future schemas should be designed when implemented; they are not assumed to already exist. All new data must have appropriate RLS policies.

---

# Development Rules

1. Build and validate the intelligence architecture before relying on paid external AI APIs.
2. Prefer free/local/browser-based prototypes where practical.
3. Do not hard-code specific mission names, criterion names, or column names into the final evaluator.
4. Test intelligence features using controlled files with known expected results.
5. Commit stable checkpoints before major changes.
6. When something breaks, inspect the actual committed code before making broad changes.
7. Keep UI and intelligence logic separate.
8. Mission scoring criteria are the source of truth for weights and evaluation requirements.
9. Evaluation must be evidence-based and explainable.
10. Preserve human/admin corrections as learning signals.
11. Do not represent planned components as implemented.
12. Keep the architecture extensible so a real LLM can later replace or augment the reasoning layer.
13. Use `docs/QAL_EXCEL_SUBMISSION_GUIDE.md` as the reusable workbook/evaluation contract when a mission needs explicit Excel structure guidance.

---

# Immediate Roadmap

### 1. Criterion-specific reasoning 🔜
Fix broad keyword matching and prevent irrelevant columns/sheets from being treated as evidence.

### 2. Evidence reasoning 🔜
Determine what evidence each criterion requires and calculate relevant values from the workbook.

### 3. Criterion scoring 🔜
Produce score, maximum, weight, evidence, reasoning, confidence, and feedback.

### 4. Final evaluation engine 🔜
Combine criterion scores into a weighted final score.

### 5. Real submission integration 🔜
Run the intelligence engine against actual Supabase-stored student submissions.

### 6. Evaluation persistence 🔜
Store evaluation results, evidence, reasoning, and confidence.

### 7. Admin calibration 🔜
Allow administrators to correct scores and explain corrections.

### 8. Experience memory 🔜
Use previous evaluations/corrections to improve future consistency.

### 9. Mission generator 🔜
Generate story-driven missions, phases, datasets, criteria, and evaluation instructions.

### 10. Full QAL Intelligence Loop 🔜
Connect generation → mission → submission → evaluation → correction → memory → improved generation/evaluation.

---

# Status

```text
PRODUCT FOUNDATION
────────────────────────────────────────────
React/Vite                         ✅
Supabase                           ✅
Authentication                     ✅
Admin role/routing                 ✅
Mission display                    ✅
Mission dataset download           ✅
Student submission                 ✅
Admin dashboard foundation         ✅
Admin mission management           ✅
Admin submission review            ✅
Mission scoring criteria           ✅

INTELLIGENCE
────────────────────────────────────────────
Excel parsing                      ✅
Workbook analysis                  ✅
Missing/duplicate detection        ✅
Semantic column classification     ✅
Mission understanding prototype    ✅
Criterion-specific reasoning       🔜
Evidence reasoning                 🔜
Autonomous scoring                 🔜
Explainable feedback               🔜
Evaluation persistence             🔜
Admin calibration                  🔜
Experience memory                  🔜
Self-improving evaluation          🔜
Mission/story generation           🔜
Full autonomous QAL loop           🔜
```

## Important Current Limitation

The current intelligence engine is a prototype, not yet a true autonomous AI evaluator. It can inspect workbook structure, classify columns, and perform initial mission-understanding logic. Mission understanding is currently simple and has known false-positive behaviour.

The next stage must improve reasoning before autonomous scoring is considered reliable.

## Development Philosophy

```text
Read
 ↓
Understand
 ↓
Reason
 ↓
Evaluate
 ↓
Explain
 ↓
Remember
 ↓
Improve
 ↓
Create
```

The final objective is a QAL intelligence system that can understand what a mission is trying to teach, understand what a student actually submitted, evaluate the work fairly with evidence, learn from corrections, and create engaging new challenges.

---

# Excel Submission Help Document

Detailed reusable guidance is maintained in:

`docs/QAL_EXCEL_SUBMISSION_GUIDE.md`

Use this document when creating a mission template, writing student instructions, defining expected statistical-test/process evidence, or designing future machine-readable Excel contracts.