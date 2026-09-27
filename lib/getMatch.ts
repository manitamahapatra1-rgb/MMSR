import type { CourseMatch } from "@/types/course";
import mockMatch from "@/data/mockMatch.json";

/**
 * TEMPORARY STAND-IN — Person 4 owns the real version of this file.
 *
 * Real version will:
 *  - look up the two courses by id
 *  - call POST /api/compare (Person 2's route)
 *  - cache successful results
 *  - fall back to data/fixtures/*.json if the API fails or times out
 *
 * Person 1: don't wait on that. Build against this signature and swap
 * the import for the real lib/getMatch.ts the moment it lands — nothing
 * else in page.tsx needs to change.
 */
export async function getMatch(
  uwCourseId: string,
  foreignCourseId: string
): Promise<CourseMatch> {
  // Simulate network latency so loading states are visible during dev.
  await new Promise((resolve) => setTimeout(resolve, 700));

  return mockMatch as CourseMatch;
}
