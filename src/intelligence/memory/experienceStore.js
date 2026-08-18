const memory = [];

export function recordEvaluationExperience(experience) {
  const record = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    ...experience,
  };

  memory.push(record);
  return record;
}

export function getEvaluationExperiences({ missionId, criterion } = {}) {
  return memory.filter((item) =>
    (!missionId || item.missionId === missionId) &&
    (!criterion || item.criterion === criterion)
  );
}

export function learnFromCorrection({ experienceId, correctedScore, reason }) {
  const experience = memory.find((item) => item.id === experienceId);
  if (!experience) return null;

  experience.correction = {
    correctedScore,
    reason: reason || null,
    correctedAt: new Date().toISOString(),
  };

  return experience;
}

export function clearPrototypeMemory() {
  memory.length = 0;
}
