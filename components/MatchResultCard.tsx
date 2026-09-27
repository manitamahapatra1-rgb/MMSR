import type { CourseMatch } from "@/types/course";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TopicPill } from "@/components/TopicPill";
import { AlertTriangle, FileDown } from "lucide-react";

function scoreTier(percentage: number): {
  label: string;
  className: string;
} {
  if (percentage >= 75) {
    return { label: "Strong match", className: "bg-emerald-600 text-white" };
  }
  if (percentage >= 50) {
    return { label: "Partial match", className: "bg-amber-500 text-white" };
  }
  return { label: "Weak match", className: "bg-red-600 text-white" };
}

interface MatchResultCardProps {
  result: CourseMatch;
  onGeneratePdf?: () => void;
}

export function MatchResultCard({
  result,
  onGeneratePdf,
}: MatchResultCardProps) {
  const tier = scoreTier(result.matchPercentage);

  return (
    <Card className="border-slate-200">
      <CardHeader className="flex flex-row items-start justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <p className="text-sm text-slate-500">
            {result.uwCourse.courseCode} vs. {result.foreignCourse.courseCode}
          </p>
          <h3 className="mt-1 text-lg font-semibold text-slate-900">
            {result.uwCourse.title}
          </h3>
        </div>
        <div className="flex flex-col items-end gap-2">
          <Badge className={`${tier.className} text-base font-semibold`}>
            {result.matchPercentage}% — {tier.label}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6 pt-6">
        <section>
          <h4 className="mb-3 text-sm font-semibold text-slate-700">
            Topic coverage
          </h4>
          <div className="flex flex-wrap gap-2">
            {result.topicCoverage.map((tc) => (
              <TopicPill
                key={tc.topic}
                topic={tc.topic}
                coverage={tc.coverage}
                evidence={tc.evidence}
              />
            ))}
          </div>
        </section>

        {result.extraTopics.length > 0 && (
          <section>
            <h4 className="mb-3 text-sm font-semibold text-slate-700">
              Additional topics covered abroad
            </h4>
            <div className="flex flex-wrap gap-2">
              {result.extraTopics.map((topic) => (
                <span
                  key={topic}
                  className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm text-slate-700"
                >
                  {topic}
                </span>
              ))}
            </div>
          </section>
        )}

        {result.caveats.length > 0 && (
          <section className="rounded-lg border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-amber-900">
              <AlertTriangle className="h-4 w-4" />
              Things to flag for your advisor
            </div>
            <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-amber-900">
              {result.caveats.map((caveat) => (
                <li key={caveat}>{caveat}</li>
              ))}
            </ul>
          </section>
        )}

        <section>
          <h4 className="mb-2 text-sm font-semibold text-slate-700">
            Advisor justification
          </h4>
          <p className="text-sm leading-relaxed text-slate-700">
            {result.advisorJustification}
          </p>
        </section>

        <div className="flex justify-end border-t border-slate-100 pt-4">
          <Button onClick={onGeneratePdf} className="gap-2">
            <FileDown className="h-4 w-4" />
            Generate PDF
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
