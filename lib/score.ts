import type { TopicCoverage } from "../types/course";

export function calculateScore(topicCoverage: TopicCoverage[]): number {
  if (topicCoverage.length === 0) return 0;
  const points = topicCoverage.reduce((sum, t) => {
    if (t.coverage === "covered") return sum + 1;
    if (t.coverage === "partial") return sum + 0.5;
    return sum;
  }, 0);
  return Math.round((points / topicCoverage.length) * 100);
}