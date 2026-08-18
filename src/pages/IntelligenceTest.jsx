import { useState } from "react";
import Layout from "../components/Layout";
import { runExcelTest } from "../intelligence/testEvaluator";

function IntelligenceTest() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleAnalyze() {
    if (!file) {
      setError("Select an Excel file first.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      setResult(await runExcelTest(file));
    } catch (err) {
      console.error(err);
      setError(err.message || "Unable to analyze workbook.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Layout>
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <p className="text-sm font-medium text-purple-600">QAL Intelligence</p>
          <h1 className="mt-1 text-3xl font-bold text-gray-900">Excel Intelligence Test</h1>
          <p className="mt-2 text-gray-500">Test workbook understanding, mission reasoning and prototype evaluation.</p>
        </div>

        <div className="rounded-xl bg-white p-6 shadow">
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={(event) => {
              setFile(event.target.files?.[0] || null);
              setResult(null);
              setError("");
            }}
            className="block w-full rounded-lg border border-gray-300 p-3"
          />

          {file && <p className="mt-3 text-sm text-gray-600">Selected: <span className="font-semibold">{file.name}</span></p>}
          {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

          <button
            type="button"
            onClick={handleAnalyze}
            disabled={!file || loading}
            className="mt-5 rounded-lg bg-purple-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-purple-700 disabled:opacity-50"
          >
            {loading ? "Analyzing..." : "Analyze Workbook"}
          </button>
        </div>

        {result && (
          <div className="space-y-6">
            <section className="rounded-xl bg-white p-6 shadow">
              <h2 className="text-xl font-bold text-gray-900">Workbook</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                <Info label="File" value={result.workbook.fileName} />
                <Info label="Sheets" value={result.workbook.sheetCount} />
                <Info label="Size" value={`${result.workbook.fileSize} bytes`} />
              </div>
            </section>

            <section className="rounded-xl bg-white p-6 shadow">
              <h2 className="text-xl font-bold text-gray-900">Detected Sheets</h2>
              <div className="mt-5 space-y-4">
                {result.analysis.sheets.map((sheet) => (
                  <div key={sheet.name} className="rounded-lg border border-gray-200 p-5">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900">{sheet.name}</h3>
                      <span className="text-sm text-gray-500">{sheet.rowCount} rows × {sheet.columnCount} columns</span>
                    </div>
                    <p className="mt-3 text-sm text-gray-600">Headers: {sheet.headers.join(", ") || "None detected"}</p>
                    <p className="mt-2 text-sm text-gray-600">Missing cells: <strong>{sheet.missingCells}</strong></p>
                    <p className="mt-2 text-sm text-gray-600">Duplicate rows: <strong>{sheet.duplicateRows}</strong></p>

                    <div className="mt-4 overflow-hidden rounded-lg border border-gray-200">
                      <table className="min-w-full text-sm">
                        <thead className="bg-gray-50"><tr><th className="px-4 py-2 text-left">Column</th><th className="px-4 py-2 text-left">Detected Type</th></tr></thead>
                        <tbody className="divide-y divide-gray-100">
                          {sheet.columnTypes.map((column) => (
                            <tr key={column.column}>
                              <td className="px-4 py-2 font-medium text-gray-800">{column.column}</td>
                              <td className="px-4 py-2 text-gray-600">{column.semanticType}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-xl bg-white p-6 shadow">
              <h2 className="text-xl font-bold text-gray-900">Mission Understanding</h2>
              <p className="mt-2 text-sm text-gray-500">Sales Detective</p>
              <div className="mt-5 space-y-4">
                {result.missionUnderstanding.criterionAnalysis.map((criterion) => (
                  <div key={criterion.criterion} className="rounded-lg border border-gray-200 p-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900">{criterion.criterion}</h3>
                      <span className="text-sm font-semibold text-purple-600">{criterion.weight}%</span>
                    </div>
                    <p className="mt-2 text-xs font-medium uppercase tracking-wide text-gray-400">Relevant evidence</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {criterion.relevantColumns.length ? criterion.relevantColumns.map((column) => (
                        <span key={`${criterion.criterion}-${column.sheet}-${column.column}`} className="rounded-full bg-purple-50 px-3 py-1 text-xs text-purple-700">
                          {column.column} · {column.semanticType}
                        </span>
                      )) : <span className="text-sm text-gray-500">No relevant columns identified.</span>}
                    </div>
                    <p className="mt-3 text-sm text-gray-600">Capabilities: {criterion.requiredCapabilities.join(", ") || "None"}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-xl bg-white p-6 shadow">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Prototype Evaluation</h2>
                <span className="text-2xl font-bold text-purple-600">{result.evaluation.finalScore}/100</span>
              </div>
              <div className="mt-5 space-y-4">
                {result.evaluation.criteria.map((criterion) => (
                  <div key={criterion.criterion} className="rounded-lg border border-gray-200 p-4">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-gray-900">{criterion.criterion}</span>
                      <span className="font-bold text-purple-600">{criterion.score}/100</span>
                    </div>
                    <p className="mt-2 text-sm text-gray-500">Confidence: {Math.round(criterion.confidence * 100)}%</p>
                    {criterion.evidence.length > 0 && (
                      <p className="mt-2 text-sm text-gray-600">Evidence items: {criterion.evidence.length}</p>
                    )}
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-xl bg-white p-6 shadow">
              <h2 className="text-xl font-bold text-gray-900">Evidence Warnings</h2>
              {result.analysis.warnings.length === 0 ? (
                <p className="mt-4 text-sm text-green-600">No obvious data-quality warnings detected.</p>
              ) : (
                <ul className="mt-4 space-y-2">
                  {result.analysis.warnings.map((warning, index) => (
                    <li key={index} className="rounded-lg bg-yellow-50 p-3 text-sm text-yellow-700">{warning}</li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        )}
      </div>
    </Layout>
  );
}

function Info({ label, value }) {
  return <div className="rounded-lg border border-gray-100 p-4"><p className="text-xs font-medium uppercase tracking-wide text-gray-400">{label}</p><p className="mt-1 font-semibold text-gray-800">{value}</p></div>;
}

export default IntelligenceTest;
