export function calculateFinalScore(criteriaResults = []) {
  const totalWeight = criteriaResults.reduce(
    (sum, item) => sum + (Number(item.weight) || 0),
    0
  );

  if (!totalWeight) {
    return { score: 0, totalWeight: 0, breakdown: [] };
  }

  const breakdown = criteriaResults.map((item) => ({
    criterion: item.criterion,
    weight: Number(item.weight) || 0,
    score: Number(item.score) || 0,
    weightedScore:
      (Number(item.score) || 0) * ((Number(item.weight) || 0) / totalWeight),
  }));

  return {
    score: Math.round(
      breakdown.reduce((sum, item) => sum + item.weightedScore, 0) * 100
    ) / 100,
    totalWeight,
    breakdown,
  };
}

export function scoreToGrade(score) {
  if (score >= 90) return "A+";
  if (score >= 80) return "A";
  if (score >= 70) return "B";
  if (score >= 60) return "C";
  if (score >= 50) return "D";
  return "F";
}
