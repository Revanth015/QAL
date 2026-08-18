export function generateMissionBlueprint({ topic, skill, difficulty = "Medium", theme = "real-world challenge", durationMinutes = 45 } = {}) {
  if (!topic || !skill) {
    throw new Error("topic and skill are required");
  }

  const title = `${theme}: ${skill} Challenge`;

  return {
    title,
    topic,
    skill,
    difficulty,
    durationMinutes,
    story: `You have been assigned a ${theme}. Your team must use ${skill} to solve a practical ${topic} problem before time runs out.`,
    objective: `Use ${skill} to produce a defensible solution to the ${topic} challenge.`,
    phases: [
      { phase: 1, name: "Briefing", goal: "Understand the situation, data and constraints." },
      { phase: 2, name: "Investigation", goal: "Explore the evidence and identify the key problem." },
      { phase: 3, name: "Decision", goal: "Build and justify the recommended solution." },
      { phase: 4, name: "Final Mission", goal: "Submit the completed work for evaluation." },
    ],
    scoringCriteria: [
      { name: "Problem Understanding", weight: 20 },
      { name: "Technical Execution", weight: 40 },
      { name: "Reasoning and Evidence", weight: 25 },
      { name: "Business Communication", weight: 15 },
    ],
    generatedBy: "QAL deterministic prototype",
  };
}
