
// lib/getMatch.ts
import type { CourseMatch } from "../types/course";

const cache = new Map<string, CourseMatch>();

export async function getMatch(
  uwCourseId: string,
  foreignCourseId: string,
): Promise<CourseMatch> {
  const cacheKey = `${uwCourseId}::${foreignCourseId}`;

  if (cache.has(cacheKey)) {
    return cache.get(cacheKey)!;
  }

  try {
    const res = await fetch("/api/compare", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uwCourseId, foreignCourseId }),
    });

    if (!res.ok) throw new Error(`API returned ${res.status}`);

    const result: CourseMatch = await res.json();
    cache.set(cacheKey, result);
    return result;
  } catch (err) {
    // Fallback to a saved fixture if the live call fails
    try {
      const fixture = await import(`../data/fixtures/${uwCourseId}__${foreignCourseId}.json`);
      return fixture.default as CourseMatch;
    } catch {
      throw new Error(`No live result and no fixture available for ${cacheKey}`);
    }
  }
}