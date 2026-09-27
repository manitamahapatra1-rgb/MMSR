// lib/getMatch.ts â€” owned by Person 4
// The ONE function the main page (Person 1) and report page (Person 3) use to get a result.
// Call it from client components only ("use client"), since it uses fetch("/api/compare")
// and browser storage.

import type { CourseMatch } from "@/types/course";
import { getCourseById, matchKey } from "@/lib/courses";
import mockJson from "@/data/fixtures/mock.json";
import demoJson from "@/data/fixtures/demo.json";

// â”€â”€â”€ The switch â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// "mock" â†’ before 3:00. Returns the shared mock result (no API needed).
// "live" â†’ after the 3:00 checkpoint. Calls the real API, falls back to fixtures.
// "demo" â†’ while recording. Uses saved fixtures first, the API only if one is missing.
export type MatchMode = "mock" | "live" | "demo";
export const MODE: MatchMode = "mock";
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const API_TIMEOUT_MS = 30_000;
// Bump this (v2, v3â€¦) whenever Person 2 changes the prompt, so old cached results are ignored.
const CACHE_VERSION = "v1";
const STORAGE_PREFIX = `tcm:${CACHE_VERSION}:`;
const MOCK_DELAY_MS = 700; // so Person 1 can see the loading state in mock mode

export type MatchSource = "mock" | "cache" | "live" | "fixture";
export interface MatchResult {
  match: CourseMatch;
  source: MatchSource;
}

const FRIENDLY_ERROR = "We couldn't compare these courses right now. Please try again in a moment.";

// â”€â”€â”€ Checking results â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export function isCourseMatch(x: unknown): x is CourseMatch {
  const m = x as Record<string, unknown> | null;
  if (!m || typeof m !== "object") return false;
  const uw = m.uwCourse as Record<string, unknown> | undefined;
  const fc = m.foreignCourse as Record<string, unknown> | undefined;
  return (
    typeof uw?.id === "string" &&
    typeof fc?.id === "string" &&
    typeof m.matchPercentage === "number" &&
    Number.isFinite(m.matchPercentage) &&
    Array.isArray(m.topicCoverage) &&
    Array.isArray(m.extraTopics) &&
    Array.isArray(m.caveats) &&
    typeof m.advisorJustification === "string"
  );
}

// â”€â”€â”€ Cache (memory + localStorage) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// localStorage means the report page gets the SAME result the main page showed,
// even if it opens in a new tab â€” instead of asking the AI again and getting a
// slightly different score.
const memoryCache = new Map<string, CourseMatch>();
const inFlight = new Map<string, Promise<CourseMatch>>();

function readStored(key: string): CourseMatch | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_PREFIX + key);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return isCourseMatch(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function writeStored(key: string, match: CourseMatch): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(match));
  } catch {
    // Storage full or blocked â€” the memory cache still works.
  }
}

/** Clears every cached result. Handy while Person 2 is tuning the prompt. */
export function clearMatchCache(): void {
  memoryCache.clear();
  if (typeof window === "undefined") return;
  try {
    for (const key of Object.keys(window.localStorage)) {
      if (key.startsWith("tcm:")) window.localStorage.removeItem(key);
    }
  } catch {
    // ignore
  }
}

// â”€â”€â”€ Fixtures and mock â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const fixtures = demoJson as Record<string, unknown>;

function getFixture(key: string): CourseMatch | null {
  const f = fixtures[key];
  return isCourseMatch(f) ? f : null;
}

// The mock, but showing the courses the user actually picked.
function buildMock(uwId: string, foreignId: string): CourseMatch {
  const base = mockJson as unknown as CourseMatch;
  return {
    ...base,
    uwCourse: getCourseById(uwId) ?? base.uwCourse,
    foreignCourse: getCourseById(foreignId) ?? base.foreignCourse,
  };
}

// â”€â”€â”€ Calling the real API â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Contract with Person 2:
//   POST /api/compare   body: { "uwCourseId": "...", "foreignCourseId": "..." }
//   200 â†’ a CourseMatch      error â†’ any status with { "error": "message" }
async function callApi(uwId: string, foreignId: string): Promise<CourseMatch> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
  try {
    const res = await fetch("/api/compare", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uwCourseId: uwId, foreignCourseId: foreignId }),
      signal: controller.signal,
    });
    const body: unknown = await res.json().catch(() => null);
    if (!res.ok) {
      const msg = (body as { error?: string } | null)?.error;
      throw new Error(msg ?? `API returned status ${res.status}`);
    }
    if (!isCourseMatch(body)) throw new Error("API response doesn't match the CourseMatch schema");
    return body;
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error(`API timed out after ${API_TIMEOUT_MS / 1000}s`);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

// â”€â”€â”€ Public functions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
/**
 * Get a result plus where it came from ("mock", "cache", "live", "fixture").
 * Pass { fresh: true } to skip the cache and ask the API again.
 */
export async function getMatchWithSource(
  uwId: string,
  foreignId: string,
  options: { fresh?: boolean } = {}
): Promise<MatchResult> {
  const key = matchKey(uwId, foreignId);

  if (MODE === "mock") {
    await new Promise((r) => setTimeout(r, MOCK_DELAY_MS));
    return { match: buildMock(uwId, foreignId), source: "mock" };
  }

  if (MODE === "demo") {
    const fixture = getFixture(key);
    if (fixture) return { match: fixture, source: "fixture" };
  }

  if (!options.fresh) {
    const cached = memoryCache.get(key) ?? readStored(key);
    if (cached) {
      memoryCache.set(key, cached);
      return { match: cached, source: "cache" };
    }
  }

  try {
    // If the same comparison is already running (e.g. a double click), wait for it.
    let request = inFlight.get(key);
    if (!request) {
      request = callApi(uwId, foreignId);
      inFlight.set(key, request);
    }
    const match = await request;
    memoryCache.set(key, match);
    writeStored(key, match);
    return { match, source: "live" };
  } catch (err) {
    console.error(`[getMatch] ${key} failed:`, err);
    const fixture = getFixture(key);
    if (fixture) {
      console.warn(`[getMatch] Using saved fixture for ${key}`);
      return { match: fixture, source: "fixture" };
    }
    throw new Error(FRIENDLY_ERROR);
  } finally {
    inFlight.delete(key);
  }
}

/** Get a result. This is what the main page and report page call. */
export async function getMatch(
  uwId: string,
  foreignId: string,
  options: { fresh?: boolean } = {}
): Promise<CourseMatch> {
  return (await getMatchWithSource(uwId, foreignId, options)).match;
}
