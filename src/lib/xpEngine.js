export function calculateMissionXP({ baseXP = 100, score = 0, difficultyMultiplier = 1 } = {}) {
  const normalizedScore = Math.max(0, Math.min(100, Number(score) || 0));
  const multiplier = Number(difficultyMultiplier) || 1;
  return Math.round(baseXP * (normalizedScore / 100) * multiplier);
}

export function calculateLevel(totalXP = 0) {
  const xp = Math.max(0, Number(totalXP) || 0);
  return Math.floor(Math.sqrt(xp / 100)) + 1;
}

export function xpToNextLevel(totalXP = 0) {
  const level = calculateLevel(totalXP);
  const nextLevelXP = 100 * level * level;
  return Math.max(0, nextLevelXP - Math.max(0, Number(totalXP) || 0));
}
