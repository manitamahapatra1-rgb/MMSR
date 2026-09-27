import { TopicCoverage } from "@/types/course";

/**
 * Weight applied to each coverage level when computing the overall
 * match percentage. This is the ONLY place scoring logic lives —
 * the AI never outputs a percentage directly, it only judges
 * per-topic coverage. That split is deliberate: it makes the score
 * reproducible and defensible ("it's a fixed formula over the AI's
 * topic-level judgments," not "the model said so").
 */
const COVERAGE_WEIGHTS: Record<TopicCoverage["coverage"], number> = {
  covered: 1,
  partial: 0.5,
  missing: 0,
};

/**
 * Computes the overall match percentage from per-topic coverage.
 * Percentage = (sum of weights) / (number of UW topics) * 100, rounded.
 *
 * Returns 0 for an empty topic list rather than NaN, so callers
 * (UI badge, PDF) never have to special-case a missing score.
 */
export function computeMatchPercentage(topicCoverage: TopicCoverage[]): number {
  if (topicCoverage.length === 0) return 0;

  const totalWeight = topicCoverage.reduce(
    (sum, t) => sum + COVERAGE_WEIGHTS[t.coverage],
    0
  );

  const percentage = (totalWeight / topicCoverage.length) * 100;
  return Math.round(percentage);
}

/**
 * Small helper for the UI badge color (red/yellow/green), so Person 1
 * doesn't have to reimplement the same thresholds separately.
 * red: <50, yellow: 50–75, green: >75
 */
export function matchBadgeColor(
  matchPercentage: number
): "red" | "yellow" | "green" {
  if (matchPercentage < 50) return "red";
  if (matchPercentage <= 75) return "yellow";
  return "green";
}
