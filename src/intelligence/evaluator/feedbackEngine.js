export function generateFeedback(evaluation) {
  const strengths = [];
  const improvements = [];

  for (const criterion of evaluation.criteria || []) {
    if (criterion.score >= 80) {
      strengths.push(`${criterion.criterion}: strong evidence (${criterion.score}/100).`);
    } else {
      improvements.push(`${criterion.criterion}: additional evidence or stronger execution is needed (${criterion.score}/100).`);
    }
  }

  return {
    strengths,
    improvements,
    summary:
      evaluation.finalScore >= 80
        ? "Strong submission with good evidence across the assessed criteria."
        : "The submission shows progress, but several criteria need stronger evidence or execution.",
  };
}
