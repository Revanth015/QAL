import http from "node:http";

const PORT = Number(process.env.PORT || 8787);
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const MODEL = process.env.OPENROUTER_MODEL || "openrouter/free";

const headers = {
  "Access-Control-Allow-Origin": "http://localhost:5173",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json",
};

function send(res, status, body) {
  res.writeHead(status, headers);
  res.end(JSON.stringify(body));
}

function parseJsonContent(content) {
  if (typeof content !== "string") return content;
  const cleaned = content.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start >= 0 && end > start) return JSON.parse(cleaned.slice(start, end + 1));
    throw new Error("AI returned non-JSON content.");
  }
}

function buildPrompt(request) {
  if (request.task === "mission_generation") {
    return `You are QAL Mission Architect, an AI that creates engaging business-learning missions for MBA/PGDM students.

Create a complete mission blueprint from these inputs:
${JSON.stringify(request.input, null, 2)}

Return ONLY valid JSON with this exact shape:
{
  "title": "string",
  "hook": "string",
  "story": "string",
  "objective": "string",
  "studentRole": "string",
  "stakes": "string",
  "datasetPlan": ["string"],
  "phases": [{"phase":1,"name":"string","goal":"string","studentAction":"string","deliverable":"string"}],
  "scoringCriteria": [{"name":"string","weight":20,"whatGoodLooksLike":"string"}],
  "successCondition": "string",
  "generatedBy": "QAL AI"
}

Make it specific, realistic, fun and coherent. Avoid generic filler. Make every phase contribute to the final business decision.`;
  }

  if (request.task === "evaluation_review") {
    return `You are QAL Evaluation Reviewer. Review a deterministic evidence-based evaluation of a student's workbook.

Mission understanding:
${JSON.stringify(request.understanding, null, 2)}

Workbook analysis:
${JSON.stringify(request.analysis, null, 2)}

Deterministic evaluation:
${JSON.stringify(request.evaluation, null, 2)}

Return ONLY valid JSON:
{
  "overallAssessment": "string",
  "criterionReviews": [
    {"criterion":"string","assessment":"string","evidenceUsed":["string"],"suggestedScore":0,"confidence":0.0}
  ],
  "strengths":["string"],
  "improvements":["string"],
  "businessInsight":"string"
}

Use only the evidence supplied. Do not invent workbook facts. Suggested scores must be 0-100. Confidence must be 0-1. Give concise professional feedback. Do not provide hidden chain-of-thought; provide only conclusions and evidence references.`;
  }

  throw new Error(`Unknown QAL AI task: ${request.task}`);
}

async function callOpenRouter(request) {
  if (!OPENROUTER_API_KEY) {
    throw new Error("OPENROUTER_API_KEY is not configured. Add it to .env.server for live AI.");
  }

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "http://localhost:5173",
      "X-Title": "QAL Intelligence",
    },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0.4,
      messages: [
        { role: "system", content: "You are the QAL Intelligence Engine. Return strict JSON when requested." },
        { role: "user", content: buildPrompt(request) },
      ],
    }),
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload?.error?.message || `OpenRouter returned ${response.status}`);
  }

  const content = payload?.choices?.[0]?.message?.content;
  const parsed = parseJsonContent(content);
  return {
    ...parsed,
    provider: "OpenRouter",
    model: payload.model || MODEL,
    live: true,
  };
}

const server = http.createServer(async (req, res) => {
  if (req.method === "OPTIONS") {
    res.writeHead(204, headers);
    res.end();
    return;
  }

  if (req.method !== "POST" || req.url !== "/api/ai") {
    send(res, 404, { error: "Not found" });
    return;
  }

  try {
    let body = "";
    for await (const chunk of req) body += chunk;
    const request = JSON.parse(body || "{}");
    const result = await callOpenRouter(request);
    send(res, 200, result);
  } catch (error) {
    send(res, 500, { error: error.message || "AI gateway failed", live: false });
  }
});

server.listen(PORT, () => {
  console.log(`QAL AI Gateway running at http://localhost:${PORT}`);
  console.log(`Model: ${MODEL}`);
});
