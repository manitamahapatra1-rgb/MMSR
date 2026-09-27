// scripts/saveFixtures.ts 
// Saves a real API result for each course pair into data/fixtures/demo.json,
// so the recorded demo never depends on a live AI call.
//
// 1. Start the app in another terminal:   npm run dev
// 2. Save every pair:                      npx tsx scripts/saveFixtures.ts
//    Redo one pair you didn't like:        npx tsx scripts/saveFixtures.ts pair2
// 3. Open data/fixtures/demo.json, read each result, and commit it once they all look good.

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { coursePairs, matchKey } from "../lib/courses";
import { isCourseMatch } from "../lib/getMatch";

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";
const FILE = "data/fixtures/demo.json";

async function main() {
  const only = process.argv.slice(2);
  const pairs = only.length ? coursePairs.filter((p) => only.includes(p.name)) : coursePairs;
  if (pairs.length === 0) {
    console.error(`No matching pairs. Valid names: ${coursePairs.map((p) => p.name).join(", ")}`);
    process.exit(1);
  }

  const saved: Record<string, unknown> = existsSync(FILE) ? JSON.parse(readFileSync(FILE, "utf8")) : {};

  for (const pair of pairs) {
    const key = matchKey(pair.uwCourse.id, pair.foreignCourse.id);
    process.stdout.write(`${pair.name}  ${pair.uwCourse.courseCode} vs ${pair.foreignCourse.courseCode} … `);
    try {
      const res = await fetch(`${BASE_URL}/api/compare`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uwCourseId: pair.uwCourse.id, foreignCourseId: pair.foreignCourse.id }),
      });
      const body: unknown = await res.json();
      if (!res.ok || !isCourseMatch(body)) {
        console.log(`FAILED (status ${res.status}) — kept the old fixture if there was one`);
        continue;
      }
      saved[key] = body;
      const missing = body.topicCoverage.filter((t) => t.coverage === "missing").length;
      console.log(`saved — ${body.matchPercentage}% match, ${missing} missing topics`);
    } catch (err) {
      console.log(`FAILED (${(err as Error).message}) — is "npm run dev" running?`);
    }
  }

  writeFileSync(FILE, JSON.stringify(saved, null, 2) + "\n");
  console.log(`\nWrote ${Object.keys(saved).length} fixture(s) to ${FILE}`);
}

main();
