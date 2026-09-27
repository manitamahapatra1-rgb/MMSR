// lib/courses.ts — owned by Person 4
// Loads every course pair file and gives the rest of the app one place to get courses.
// Used by: the main page dropdowns (Person 1), /api/compare (Person 2), scripts.

import type { CourseInfo } from "@/types/course";
import pair1 from "@/data/pairs/pair1.json";
import pair2 from "@/data/pairs/pair2.json";
import pair3 from "@/data/pairs/pair3.json";
import pair4 from "@/data/pairs/pair4.json";

export interface CoursePair {
  name: string; // the file name, e.g. "pair1"
  uwCourse: CourseInfo;
  foreignCourse: CourseInfo;
}

// To add a pair: create data/pairs/pair5.json, import it above, add it here.
const PAIR_FILES: Record<string, unknown> = { pair1, pair2, pair3, pair4 };

const LEVELS = ["intro", "intermediate", "advanced"];
const REQUIRED_TEXT = ["id", "school", "courseCode", "title", "description", "sourceUrl"] as const;

// Returns a list of problems with a course. An empty list means it's valid.
function findProblems(course: unknown): string[] {
  const c = course as Record<string, unknown> | null;
  if (!c || typeof c !== "object") return ["course is missing"];
  const problems: string[] = [];
  for (const field of REQUIRED_TEXT) {
    const value = c[field];
    if (typeof value !== "string" || value.trim() === "") problems.push(`${field} is empty`);
  }
  if (!Array.isArray(c.topics) || c.topics.length === 0) problems.push("topics is empty");
  if (typeof c.credits !== "number" || c.credits <= 0) problems.push("credits must be a number above 0");
  if (typeof c.level !== "string" || !LEVELS.includes(c.level)) problems.push(`level must be one of ${LEVELS.join(", ")}`);
  if (!Array.isArray(c.prerequisites)) problems.push("prerequisites must be a list (use [] if none)");
  return problems;
}

// A broken or unfinished pair file is skipped with a warning instead of crashing
// the app, so one teammate's half-done file never blocks everyone else.
function loadPairs(): CoursePair[] {
  const pairs: CoursePair[] = [];
  for (const [name, raw] of Object.entries(PAIR_FILES)) {
    const file = raw as { uwCourse?: { id?: string }; foreignCourse?: { id?: string } };
    if (!file.uwCourse?.id && !file.foreignCourse?.id) {
      console.warn(`[courses] data/pairs/${name}.json isn't filled in yet — skipping it for now.`);
      continue;
    }
    const problems = [
      ...findProblems(file.uwCourse).map((p) => `uwCourse: ${p}`),
      ...findProblems(file.foreignCourse).map((p) => `foreignCourse: ${p}`),
    ];
    if (problems.length > 0) {
      console.warn(`[courses] Skipping data/pairs/${name}.json — ${problems.join("; ")}`);
      continue;
    }
    pairs.push({
      name,
      uwCourse: file.uwCourse as CourseInfo,
      foreignCourse: file.foreignCourse as CourseInfo,
    });
  }
  return pairs;
}

export const coursePairs: CoursePair[] = loadPairs();

// Every course by id. Warns if two files use the same id for different courses.
const courseById = new Map<string, CourseInfo>();
for (const pair of coursePairs) {
  for (const course of [pair.uwCourse, pair.foreignCourse]) {
    const existing = courseById.get(course.id);
    if (existing && existing.title !== course.title) {
      console.warn(`[courses] Duplicate id "${course.id}" used for "${existing.title}" and "${course.title}". Give one a new id.`);
    }
    if (!existing) courseById.set(course.id, course);
  }
}

function unique(courses: CourseInfo[]): CourseInfo[] {
  const seen = new Set<string>();
  return courses.filter((c) => (seen.has(c.id) ? false : (seen.add(c.id), true)));
}

/** UW courses for the left dropdown. */
export const uwCourses: CourseInfo[] = unique(coursePairs.map((p) => p.uwCourse));

/** All partner-school courses. */
export const partnerCourses: CourseInfo[] = unique(coursePairs.map((p) => p.foreignCourse));

/** Partner school names for the school dropdown. */
export const partnerSchools: string[] = Array.from(new Set(partnerCourses.map((c) => c.school))).sort();

/** Partner courses at one school, for the course dropdown after a school is picked. */
export function getPartnerCourses(school: string): CourseInfo[] {
  return partnerCourses.filter((c) => c.school === school);
}

/** Look up any course by id. Returns undefined if it doesn't exist. */
export function getCourseById(id: string): CourseInfo | undefined {
  return courseById.get(id);
}

/** The key used for caching and fixtures: "uwId__foreignId". */
export function matchKey(uwId: string, foreignId: string): string {
  return `${uwId}__${foreignId}`;
}
