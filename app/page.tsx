"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { CourseInfo, CourseMatch } from "@/types/course";
import uwCoursesData from "@/data/uwCourses.json";
import partnerCoursesData from "@/data/partnerCourses.json";
import { CourseSelector } from "@/components/CourseSelector";
import { MatchResultCard } from "@/components/MatchResultCard";
import { LoadingResult, ErrorResult } from "@/components/ResultStates";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getMatch } from "@/lib/getMatch";
import { ArrowRight } from "lucide-react";

const uwCourses = uwCoursesData as CourseInfo[];
const partnerCourses = partnerCoursesData as CourseInfo[];

type Status = "idle" | "loading" | "success" | "error";

export default function Home() {
  const router = useRouter();

  const [uwCourseId, setUwCourseId] = useState<string>();
  const [partnerSchool, setPartnerSchool] = useState<string>();
  const [foreignCourseId, setForeignCourseId] = useState<string>();

  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<CourseMatch | null>(null);

  const partnerSchools = useMemo(
    () => Array.from(new Set(partnerCourses.map((c) => c.school))),
    []
  );

  const filteredForeignCourses = useMemo(
    () => partnerCourses.filter((c) => c.school === partnerSchool),
    [partnerSchool]
  );

  const canCompare = Boolean(uwCourseId && foreignCourseId);

  async function handleCompare() {
    if (!uwCourseId || !foreignCourseId) return;
    setStatus("loading");
    try {
      const match = await getMatch(uwCourseId, foreignCourseId);
      setResult(match);
      setStatus("success");
    } catch (err) {
      setStatus("error");
    }
  }

  function handleGeneratePdf() {
    if (!uwCourseId || !foreignCourseId) return;
    router.push(`/report?uw=${uwCourseId}&foreign=${foreignCourseId}`);
  }

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-6 py-10">
      <header className="mb-8">
        <p className="text-sm font-medium text-red-700">UW–Madison</p>
        <h1 className="mt-1 text-2xl font-semibold text-slate-900">
          Study Abroad Transfer Credit Matcher
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">
          Compare a UW course against a course at a partner school and get an
          advisor-ready match summary in seconds instead of hours.
        </p>
      </header>

      <div className="grid gap-6 sm:grid-cols-2">
        <CourseSelector
          label="UW–Madison course"
          courses={uwCourses}
          selectedId={uwCourseId}
          onSelect={setUwCourseId}
        />

        <div className="space-y-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Partner school
            </p>
            <Select
              value={partnerSchool}
              onValueChange={(school) => {
                setPartnerSchool(school);
                setForeignCourseId(undefined);
              }}
            >
              <SelectTrigger className="mt-1 w-full">
                <SelectValue placeholder="Choose a school" />
              </SelectTrigger>
              <SelectContent>
                {partnerSchools.map((school) => (
                  <SelectItem key={school} value={school}>
                    {school}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <CourseSelector
            label="Partner course"
            courses={filteredForeignCourses}
            selectedId={foreignCourseId}
            onSelect={setForeignCourseId}
            placeholder={
              partnerSchool ? "Choose a course" : "Choose a school first"
            }
          />
        </div>
      </div>

      <div className="mt-6 flex justify-center">
        <Button
          size="lg"
          disabled={!canCompare || status === "loading"}
          onClick={handleCompare}
          className="gap-2"
        >
          {status === "loading" ? "Comparing…" : "Compare courses"}
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="mt-10">
        {status === "loading" && <LoadingResult />}
        {status === "error" && <ErrorResult onRetry={handleCompare} />}
        {status === "success" && result && (
          <MatchResultCard result={result} onGeneratePdf={handleGeneratePdf} />
        )}
      </div>
    </main>
  );
}
