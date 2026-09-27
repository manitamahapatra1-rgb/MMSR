"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { getMatchWithSource, type MatchSource } from "@/lib/getMatch";
import type { CourseMatch, CourseInfo } from "@/types/course";

function CourseCard({ course, label }: { course: CourseInfo; label: string }) {
  return (
    <div className="rounded-lg border p-4">
      <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
      <h3 className="text-lg font-semibold">
        {course.courseCode} — {course.title}
      </h3>
      <p className="text-sm text-gray-600">{course.school}</p>
      <p className="mt-2 text-sm">{course.description}</p>
      <p className="mt-2 text-xs text-gray-500">
        {course.credits} credits · {course.level}
        {course.prerequisites.length > 0 && ` · Prereqs: ${course.prerequisites.join(", ")}`}
      </p>
      <a
        href={course.sourceUrl}
        target="_blank"
        rel="noreferrer"
        className="mt-2 inline-block text-xs text-blue-600 underline"
      >
        Source
      </a>
    </div>
  );
}

type Coverage = "covered" | "partial" | "missing";

interface TopicCoverageItem {
  topic: string;
  coverage: Coverage;
  evidence: string;
}

const COVERAGE_ICON: Record<Coverage, string> = {
  covered: "✅",
  partial: "⚠️",
  missing: "❌",
};

function isTopicCoverageItem(x: unknown): x is TopicCoverageItem {
  const o = x as Record<string, unknown> | null;
  return (
    !!o &&
    typeof o === "object" &&
    typeof o.topic === "string" &&
    (o.coverage === "covered" || o.coverage === "partial" || o.coverage === "missing") &&
    typeof o.evidence === "string"
  );
}

function TopicCoverageRow({ item }: { item: unknown }) {
  if (isTopicCoverageItem(item)) {
    return (
      <li className="mb-2">
        <span>{COVERAGE_ICON[item.coverage]} </span>
        <span className="font-medium">{item.topic}</span>
        <p className="ml-6 text-xs text-gray-500">{item.evidence}</p>
      </li>
    );
  }
  // Fallback for any shape we don't recognize, so a schema change never crashes the page.
  return <li>{typeof item === "string" ? item : JSON.stringify(item)}</li>;
}

function SimpleListItem({ item }: { item: unknown }) {
  return <li>{typeof item === "string" ? item : JSON.stringify(item)}</li>;
}

function ReportContent() {
  const params = useSearchParams();
  const uwCourseId = params.get("uwCourseId");
  const foreignCourseId = params.get("foreignCourseId");

  const [match, setMatch] = useState<CourseMatch | null>(null);
  const [source, setSource] = useState<MatchSource | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uwCourseId || !foreignCourseId) {
      setError("Missing uwCourseId or foreignCourseId in the URL.");
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);

    getMatchWithSource(uwCourseId, foreignCourseId)
      .then((result) => {
        if (cancelled) return;
        setMatch(result.match);
        setSource(result.source);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Something went wrong.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [uwCourseId, foreignCourseId]);

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Comparing courses…</div>;
  }

  if (error) {
    return (
      <div className="p-8 text-center text-red-600">
        <p>{error}</p>
      </div>
    );
  }

  if (!match) {
    return <div className="p-8 text-center text-gray-500">No result.</div>;
  }

  return (
    <div className="mx-auto max-w-3xl p-8 print:p-0">
      <div className="mb-6 flex items-center justify-between print:hidden">
        <h1 className="text-2xl font-bold">Transfer Credit Summary</h1>
        <button
          onClick={() => window.print()}
          className="rounded bg-black px-4 py-2 text-sm text-white"
        >
          Download / Print PDF
        </button>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <CourseCard course={match.uwCourse} label="UW–Madison course" />
        <CourseCard course={match.foreignCourse} label="Partner school course" />
      </div>

      <div className="mb-6 rounded-lg border p-4">
        <p className="text-sm text-gray-500">Match score</p>
        <p className="text-4xl font-bold">{match.matchPercentage}%</p>
      </div>

      {match.topicCoverage.length > 0 && (
        <div className="mb-6">
          <h2 className="mb-2 font-semibold">Topic coverage</h2>
          <ul className="list-none space-y-1 pl-0 text-sm">
            {match.topicCoverage.map((item, i) => (
              <TopicCoverageRow key={i} item={item} />
            ))}
          </ul>
        </div>
      )}

      {match.extraTopics.length > 0 && (
        <div className="mb-6">
          <h2 className="mb-2 font-semibold">Extra topics not in UW course</h2>
          <ul className="list-disc space-y-1 pl-5 text-sm">
            {match.extraTopics.map((item, i) => (
              <SimpleListItem key={i} item={item} />
            ))}
          </ul>
        </div>
      )}

      {match.caveats.length > 0 && (
        <div className="mb-6">
          <h2 className="mb-2 font-semibold">Caveats</h2>
          <ul className="list-disc space-y-1 pl-5 text-sm">
            {match.caveats.map((item, i) => (
              <SimpleListItem key={i} item={item} />
            ))}
          </ul>
        </div>
      )}

      <div className="mb-6 rounded-lg border p-4">
        <h2 className="mb-2 font-semibold">Advisor justification</h2>
        <p className="text-sm">{match.advisorJustification}</p>
      </div>

      {source && (
        <p className="text-xs text-gray-400 print:hidden">Result source: {source}</p>
      )}
    </div>
  );
}

export default function ReportPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-500">Loading…</div>}>
      <ReportContent />
    </Suspense>
  );
}
