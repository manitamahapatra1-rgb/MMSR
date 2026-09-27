// lib/courses.ts
import type { CourseInfo } from "../types/course";

interface PairFile {
  uwCourse: CourseInfo;
  foreignCourse: CourseInfo;
}

function safeLoadPair(pairModule: unknown): PairFile | null {
  const pair = pairModule as Partial<PairFile>;
  if (pair?.uwCourse?.id && pair?.foreignCourse?.id) {
    return pair as PairFile;
  }
  return null;
}

const pairs: PairFile[] = [];

// Each import wrapped so one broken/empty file doesn't kill the whole app
try {
  const pair1 = require("../data/pairs/pair1.json");
  const loaded = safeLoadPair(pair1);
  if (loaded) pairs.push(loaded);
} catch {}

try {
  const pair2 = require("../data/pairs/pair2.json");
  const loaded = safeLoadPair(pair2);
  if (loaded) pairs.push(loaded);
} catch {}

try {
  const pair3 = require("../data/pairs/pair3.json");
  const loaded = safeLoadPair(pair3);
  if (loaded) pairs.push(loaded);
} catch {}

try {
  const pair4 = require("../data/pairs/pair4.json");
  const loaded = safeLoadPair(pair4);
  if (loaded) pairs.push(loaded);
} catch {}

export function getAllUwCourses(): CourseInfo[] {
  const seen = new Map<string, CourseInfo>();
  pairs.forEach((p) => seen.set(p.uwCourse.id, p.uwCourse));
  return Array.from(seen.values());
}

export function getAllForeignCourses(): CourseInfo[] {
  const seen = new Map<string, CourseInfo>();
  pairs.forEach((p) => seen.set(p.foreignCourse.id, p.foreignCourse));
  return Array.from(seen.values());
}

export function getCourseById(id: string): CourseInfo | null {
  for (const p of pairs) {
    if (p.uwCourse.id === id) return p.uwCourse;
    if (p.foreignCourse.id === id) return p.foreignCourse;
  }
  return null;
}