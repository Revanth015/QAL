export function createAIProvider({ generate } = {}) {
  return {
    name: generate ? "custom" : "deterministic",
    async generateJSON(request) {
      if (generate) return generate(request);
      return {
        provider: "deterministic",
        mode: "prototype",
        message: "No external model configured. Use the deterministic QAL reasoning engine until an AI provider is connected.",
      };
    },
  };
}

export const defaultAIProvider = createAIProvider();
