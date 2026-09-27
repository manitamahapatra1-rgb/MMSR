"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { getMatch } from "@/lib/getMatch";
import { matchBadgeColor } from "@/lib/score";
import type { CourseMatch, Coverage } from "@/types/course";

/**
 * Advisor-facing report, read from ?uw=<id>&foreign=<id>.
 * Uses getMatch (Person 4's function) so it automatically benefits
 * from the mock -> real API -> cached fixture fallback chain — this
 * page never needs to know which source the data came from.
 *
 * Print CSS notes:
 *  - .no-print is hidden when printing (nav/buttons)
 *  - the topic table won't split a row across a page break
 *  - Cmd/Ctrl+P or the browser's "Save as PDF" produces the deliverable
 */

const COVERAGE_LABEL: Record<Coverage, string> = {
  covered: "Covered",
  partial: "Partially Covered",
  missing: "Not Covered",
};

export default function ReportPage() {
  const searchParams = useSearchParams();
  const uwCourseId = searchParams.get("uw");
  const foreignCourseId = searchParams.get("foreign");

  const [match, setMatch] = useState<CourseMatch | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uwCourseId || !foreignCourseId) {
      setError("Missing course selection. Go back and choose two courses to compare.");
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    getMatch(uwCourseId, foreignCourseId)
      .then((result) => {
        if (!cancelled) setMatch(result);
      })
      .catch(() => {
        if (!cancelled) setError("Couldn't load this comparison. Try again from the main page.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [uwCourseId, foreignCourseId]);

  return (
    <div className="report-page">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .report-page { padding: 0; }
          .topic-row { break-inside: avoid; }
          .section { break-inside: avoid; }
        }
        .report-page {
          max-width: 800px;
          margin: 0 auto;
          padding: 2rem;
          font-family: system-ui, sans-serif;
          color: #1a1a1a;
        }
        .section { margin-bottom: 1.75rem; }
        .topic-row { display: grid; grid-template-columns: 1fr auto 2fr; gap: 1rem; padding: 0.5rem 0; border-bottom: 1px solid #e5e5e5; }
        .badge { display: inline-block; padding: 0.2rem 0.6rem; border-radius: 999px; font-size: 0.85rem; font-weight: 600; }
        .badge-green { background: #dcfce7; color: #166534; }
        .badge-yellow { background: #fef9c3; color: #854d0e; }
        .badge-red { background: #fee2e2; color: #991b1b; }
        .disclaimer { font-size: 0.85rem; color: #666; border-top: 1px solid #ddd; padding-top: 1rem; margin-top: 2rem; }
      `}</style>

      <button className="no-print" onClick={() => window.print()}>
        Print / Save as PDF
      </button>

      {loading && <p>Loading comparison…</p>}
      {error && <p role="alert">{error}</p>}

      {match && (
        <>
          <header className="section">
            <h1>Transfer Credit Comparison</h1>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.5rem" }}>
              <div>
                <strong>{match.uwCourse.courseCode}</strong> — {match.uwCourse.title}
                <div style={{ fontSize: "0.9rem", color: "#555" }}>UW–Madison · {match.uwCourse.credits} credits</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <strong>{match.foreignCourse.courseCode}</strong> — {match.foreignCourse.title}
                <div style={{ fontSize: "0.9rem", color: "#555" }}>
                  {match.foreignCourse.school} · {match.foreignCourse.credits} credits
                </div>
              </div>
            </div>
          </header>

          <section className="section">
            <h2>
              Match Score:{" "}
              <span className={`badge badge-${matchBadgeColor(match.matchPercentage)}`}>
                {match.matchPercentage}%
              </span>
            </h2>
          </section>

          <section className="section">
            <h3>Topic-by-Topic Coverage</h3>
            {match.topicCoverage.map((t, i) => (
              <div className="topic-row" key={i}>
                <span>{t.topic}</span>
                <span className={`badge badge-${t.coverage === "covered" ? "green" : t.coverage === "partial" ? "yellow" : "red"}`}>
                  {COVERAGE_LABEL[t.coverage]}
                </span>
                <span style={{ fontSize: "0.9rem", color: "#444" }}>{t.evidence}</span>
              </div>
            ))}
          </section>

          {match.extraTopics.length > 0 && (
            <section className="section">
              <h3>Additional Topics Covered Abroad</h3>
              <ul>
                {match.extraTopics.map((topic, i) => (
                  <li key={i}>{topic}</li>
                ))}
              </ul>
            </section>
          )}

          {match.caveats.length > 0 && (
            <section className="section">
              <h3>Caveats</h3>
              <ul>
                {match.caveats.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </section>
          )}

          <section className="section">
            <h3>Advisor Justification</h3>
            <p>{match.advisorJustification}</p>
          </section>

          <section className="section">
            <h3>Sources</h3>
            <p>
              <a href={match.uwCourse.sourceUrl}>{match.uwCourse.school} catalog entry</a>
              {" · "}
              <a href={match.foreignCourse.sourceUrl}>{match.foreignCourse.school} catalog entry</a>
            </p>
          </section>

          <p className="disclaimer">
            This report is a preparation aid generated by an AI comparison tool. It is not an
            official transfer credit determination. Final approval requires review by a UW–Madison
            academic advisor and/or the International Academic Programs office.
          </p>
        </>
      )}
    </div>
  );
}
