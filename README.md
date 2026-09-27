# MMSR — Study Abroad Transfer Credit Matcher

**BuildFest Hackathon Project**

An AI tool that lets UW–Madison students compare their UW courses against courses at study-abroad partner schools, automatically scoring topic overlap and generating an advisor-ready summary — replacing the current manual process of digging through dozens of partner-school catalog websites by hand.

## The Problem

A UW student wanting to study abroad has to manually check every partner university, individually visit each school's website, and dig through often-hard-to-find course catalogs to figure out which foreign courses might transfer for credit. There's no way to compare course content side-by-side, and getting formal transfer approval requires an advisor to manually judge whether the material actually overlaps.

## The Solution

- **Course selection:** UW course × partner school course pairs
- **Matching:** a structured LLM call compares a UW course's topics against a foreign course's, returning per-topic coverage (covered / partial / missing), extra topics, caveats, and a one-paragraph advisor justification
- **Output:** a match percentage with a colored badge, plus a printable/exportable advisor-ready report

## Tech Stack

- **Framework:** Next.js (App Router) + React + TypeScript
- **UI:** Tailwind CSS + shadcn/ui
- **AI:** Claude / GPT-4o — single structured-JSON-output call per comparison
- **Data:** flat JSON files matching a shared schema (`types/course.ts`) — no database

## Shared Schema

```typescript
interface CourseInfo {
  id: string;
  school: string;
  courseCode: string;
  title: string;
  description: string;
  topics: string[];
  credits: number;
  level: "intro" | "intermediate" | "advanced";
  prerequisites: string[];
  sourceUrl: string;
}

interface CourseMatch {
  uwCourse: CourseInfo;
  foreignCourse: CourseInfo;
  topicCoverage: TopicCoverage[];
  matchPercentage: number;
  extraTopics: string[];
  caveats: string[];
  advisorJustification: string;
}
```

## Project Structure

| Path | Owner |
|---|---|
| `app/page.tsx`, `components/*` | Person 1 — Frontend |
| `app/api/compare/route.ts`, `lib/prompt.ts` | Person 2 — AI comparison pipeline |
| `lib/score.ts`, `scripts/testScores.ts`, `app/report/page.tsx` | Person 3 — Scoring, testing, report page |
| `lib/courses.ts`, `lib/getMatch.ts`, `data/fixtures/*.json` | Person 4 — Data layer, reliability, integration |
| `data/pairs/*.json` | Course pair data, per person |
| `types/course.ts` | Shared schema (frozen) |

## Team Roles

- **Person 1 — Frontend:** dual-pane UI, course selectors, match result cards, loading/error states, PDF trigger button
- **Person 2 — AI pipeline:** `/api/compare` route, prompt design, structured JSON output, reliability tuning
- **Person 3 — Scoring & report:** match percentage calculation, score-stability testing, the printable advisor report page
- **Person 4 — Integration & QA:** data loading, `getMatch` (mock → live API → cached fallback), merges PRs, owns end-to-end testing and the demo recording

## Getting Started

```bash
git clone https://github.com/manitamahapatra1-rgb/MMSR
cd MMSR
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

> **Note:** Clone to a plain local path (e.g. `C:\dev`), not a OneDrive-synced folder — syncing conflicts have caused build issues.

## Environment Variables

Create `.env.local` (never committed — already in `.gitignore`):
