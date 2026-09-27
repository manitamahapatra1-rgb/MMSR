import type { CourseInfo, TopicCoverage } from "@/types/course";

export interface ComparisonResponse {
  topicCoverage: TopicCoverage[];
  extraTopics: string[];
  caveats: string[];
  advisorJustification: string;
}

const COVERAGE_VALUES = new Set<TopicCoverage["coverage"]>([
  "covered",
  "partial",
  "missing",
]);

export function getComparisonPrompt(
  uwCourse: CourseInfo,
  foreignCourse: CourseInfo,
): string {
  const exampleResponse: ComparisonResponse = {
    topicCoverage: [
      {
        topic: "operating-system process management",
        coverage: "covered",
        evidence:
          "The description says students study process creation, scheduling, and synchronization.",
      },
      {
        topic: "virtual memory",
        coverage: "partial",
        evidence:
          "The topic list includes paging, but the description does not mention page replacement.",
      },
      {
        topic: "file systems",
        coverage: "missing",
        evidence:
          "Neither the description nor the topic list mentions file systems.",
      },
    ],
    extraTopics: ["containerization", "real-time operating systems"],
    caveats: [
      "The foreign course is 3 credits while the UW course is 4 credits.",
      "The foreign course requires an operating-systems prerequisite not listed for the UW course.",
    ],
    advisorJustification:
      "The foreign course provides strong coverage of process management and some coverage of virtual memory, but it omits file systems and adds a substantial prerequisite. Because it carries fewer credits and does not cover a core UW topic, I would not approve it as a direct equivalent; it may be suitable for elective transfer credit after reviewing the syllabus.",
  };

  return `You are an academic transfer-credit reviewer. Compare the UW course with the foreign course and return strict JSON only.

For every topic in the UW course's topics array, include exactly one topicCoverage item. Set coverage to exactly "covered", "partial", or "missing". Judge topic coverage using only the foreign course's description and topics. The evidence value must be a short quote or close paraphrase grounded in text that actually appears in the foreign course's description or topics. Never invent, infer, or cite evidence that is absent from those two fields. For a missing topic, explicitly say that the foreign description and topic list do not mention it.

List extraTopics that the foreign course covers but that are not in the UW topic list. Ground these in the foreign course's description or topics. List relevant caveats, such as credit mismatch, missing prerequisites, or level mismatch, using the course metadata where appropriate. Write advisorJustification as one useful paragraph that explains whether an academic advisor should approve or deny direct transfer equivalency, while distinguishing elective-credit possibilities when relevant.

Reply with one JSON object and no markdown fences, preamble, or explanation outside the JSON. The JSON must have exactly this shape:
{
  "topicCoverage": [
    { "topic": "string", "coverage": "covered | partial | missing", "evidence": "string" }
  ],
  "extraTopics": ["string"],
  "caveats": ["string"],
  "advisorJustification": "string"
}
Do not include matchPercentage; it is calculated separately in code.

Worked example (the example data is unrelated to the courses below):
UW course: ${JSON.stringify(
    {
      courseCode: "CSE 451",
      title: "Operating Systems",
      description:
        "Introduction to operating-system principles, including processes, memory, and file systems.",
      topics: [
        "operating-system process management",
        "virtual memory",
        "file systems",
      ],
      credits: 4,
      level: "advanced",
      prerequisites: ["CSE 351"],
    },
    null,
    2,
  )}
Foreign course: ${JSON.stringify(
    {
      courseCode: "CS-340",
      title: "Systems Software",
      description:
        "Students study process creation, scheduling, and synchronization, with an introduction to paging. The course also uses containers and discusses real-time operating systems.",
      topics: [
        "process scheduling",
        "synchronization",
        "paging",
        "containerization",
        "real-time operating systems",
      ],
      credits: 3,
      level: "advanced",
      prerequisites: ["CS-240"],
    },
    null,
    2,
  )}
Example JSON response:
${JSON.stringify(exampleResponse, null, 2)}

Actual UW course:
${JSON.stringify(uwCourse, null, 2)}

Actual foreign course:
${JSON.stringify(foreignCourse, null, 2)}
`;
}

function validationError(field: string, detail: string): Error {
  return new Error(`Invalid comparison response: ${field} ${detail}`);
}

function stripCodeFences(raw: string): string {
  return raw
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

export function parseComparisonResponse(
  raw: string,
): ComparisonResponse {
  const cleaned = stripCodeFences(raw);
  let parsed: unknown;

  try {
    parsed = JSON.parse(cleaned);
  } catch (error) {
    const detail = error instanceof Error ? error.message : "invalid JSON";
    throw new Error(`Invalid comparison response JSON: ${detail}`);
  }

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw validationError("response", "must be a JSON object");
  }

  const response = parsed as Record<string, unknown>;

  if (!Array.isArray(response.topicCoverage)) {
    throw validationError("topicCoverage", "must be an array");
  }

  response.topicCoverage.forEach((item, index) => {
    if (typeof item !== "object" || item === null || Array.isArray(item)) {
      throw validationError(`topicCoverage[${index}]`, "must be an object");
    }

    const coverageItem = item as Record<string, unknown>;

    if (typeof coverageItem.topic !== "string") {
      throw validationError(
        `topicCoverage[${index}].topic`,
        "is missing or must be a string",
      );
    }

    if (
      typeof coverageItem.coverage !== "string" ||
      !COVERAGE_VALUES.has(
        coverageItem.coverage as TopicCoverage["coverage"],
      )
    ) {
      throw validationError(
        `topicCoverage[${index}].coverage`,
        'is missing or must be exactly "covered", "partial", or "missing"',
      );
    }

    if (typeof coverageItem.evidence !== "string") {
      throw validationError(
        `topicCoverage[${index}].evidence`,
        "is missing or must be a string",
      );
    }
  });

  for (const field of ["extraTopics", "caveats"] as const) {
    if (!Array.isArray(response[field])) {
      throw validationError(field, "must be an array of strings");
    }

    response[field].forEach((value, index) => {
      if (typeof value !== "string") {
        throw validationError(`${field}[${index}]`, "must be a string");
      }
    });
  }

  if (
    typeof response.advisorJustification !== "string" ||
    response.advisorJustification.trim().length === 0
  ) {
    throw validationError(
      "advisorJustification",
      "is missing or must be a non-empty string",
    );
  }

  return {
    topicCoverage: response.topicCoverage as TopicCoverage[],
    extraTopics: response.extraTopics as string[],
    caveats: response.caveats as string[],
    advisorJustification: response.advisorJustification,
  };
}
