/**
 * Runs every course pair through /api/compare several times and prints
 * the resulting match percentages side by side, so you can see:
 *   1. Whether scores are STABLE (same pair, similar score each run)
 *   2. Whether the MISMATCH pair actually scores low
 *
 * Share this output with Person 2 — if a pair is unstable, it's almost
 * always the prompt being ambiguous, not the scoring math.
 *
 * Usage:
 *   1. Make sure `npm run dev` is running in another terminal
 *   2. npx tsx scripts/testScores.ts
 *   (or `npx ts-node scripts/testScores.ts` if tsx isn't installed)
 *
 * ASSUMPTIONS — adjust these two things to match Person 2 & Person 4's
 * actual code if different:
 *   - API endpoint: POST http://localhost:3000/api/compare
 *     body: { uwCourseId: string, foreignCourseId: string }
 *   - Pair files: data/pairs/pair1.json ... pair4.json, each shaped
 *     { uwCourseId: string, foreignCourseId: string, label?: string }
 */

import fs from "fs";
import path from "path";

const API_URL = "http://localhost:3000/api/compare";
const RUNS_PER_PAIR = 3;
const PAIRS_DIR = path.join(process.cwd(), "data", "pairs");

interface PairFile {
  uwCourseId: string;
  foreignCourseId: string;
  label?: string;
}

interface CompareResponse {
  matchPercentage: number;
  [key: string]: unknown;
}

function loadPairs(): PairFile[] {
  const files = fs
    .readdirSync(PAIRS_DIR)
    .filter((f) => f.endsWith(".json"))
    .sort();

  return files.map((f) => {
    const raw = fs.readFileSync(path.join(PAIRS_DIR, f), "utf-8");
    const pair = JSON.parse(raw) as PairFile;
    return { ...pair, label: pair.label ?? f.replace(".json", "") };
  });
}

async function runCompare(pair: PairFile): Promise<number | null> {
  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        uwCourseId: pair.uwCourseId,
        foreignCourseId: pair.foreignCourseId,
      }),
    });

    if (!res.ok) {
      console.error(`  ✗ HTTP ${res.status} for ${pair.label}`);
      return null;
    }

    const data = (await res.json()) as CompareResponse;
    return data.matchPercentage;
  } catch (err) {
    console.error(`  ✗ Request failed for ${pair.label}:`, err);
    return null;
  }
}

function stdev(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance =
    values.reduce((a, b) => a + (b - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

async function main() {
  const pairs = loadPairs();
  console.log(`Loaded ${pairs.length} pairs. Running ${RUNS_PER_PAIR} times each...\n`);

  const results: { label: string; scores: number[] }[] = [];

  for (const pair of pairs) {
    console.log(`Testing ${pair.label} (${pair.uwCourseId} vs ${pair.foreignCourseId})`);
    const scores: number[] = [];

    for (let i = 0; i < RUNS_PER_PAIR; i++) {
      const score = await runCompare(pair);
      if (score !== null) {
        scores.push(score);
        console.log(`  Run ${i + 1}: ${score}%`);
      }
    }

    results.push({ label: pair.label!, scores });
    console.log("");
  }

  // Summary table
  console.log("=== SUMMARY ===\n");
  console.log(
    "Pair".padEnd(20) + "Scores".padEnd(24) + "Avg".padEnd(8) + "StdDev".padEnd(8) + "Flag"
  );

  for (const r of results) {
    const avg =
      r.scores.length > 0
        ? Math.round(r.scores.reduce((a, b) => a + b, 0) / r.scores.length)
        : NaN;
    const sd = stdev(r.scores);
    // Flag anything that swings more than 10 points across runs —
    // that's the threshold worth showing Person 2 to tighten the prompt.
    const flag = sd > 10 ? "⚠ UNSTABLE" : "";

    console.log(
      r.label.padEnd(20) +
        r.scores.join(", ").padEnd(24) +
        `${avg}%`.padEnd(8) +
        sd.toFixed(1).padEnd(8) +
        flag
    );
  }

  console.log(
    "\nCheck: does your known mismatch pair score noticeably lower than the others?"
  );
}

main();
