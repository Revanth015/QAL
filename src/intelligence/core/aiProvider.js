import { generateMissionBlueprint } from "../generator/missionGenerator";

const AI_API_URL = import.meta.env.VITE_QAL_AI_URL || "http://localhost:8787";

export function createAIProvider({ generate } = {}) {
  return {
    name: generate ? "custom" : "QAL AI Gateway",

    async generateJSON(request) {
      if (generate) return generate(request);

      try {
        const response = await fetch(`${AI_API_URL}/api/ai`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(request),
        });

        if (!response.ok) {
          const message = await response.text();
          throw new Error(message || `AI gateway returned ${response.status}`);
        }

        const payload = await response.json();
        return {
          ...payload,
          provider: payload.provider || "OpenRouter",
          live: true,
        };
      } catch (error) {
        return {
          provider: "deterministic-fallback",
          live: false,
          error: error.message,
          message: "AI gateway unavailable. QAL continued with its deterministic intelligence engine.",
        };
      }
    },
  };
}

export const defaultAIProvider = createAIProvider();
export { generateMissionBlueprint };
