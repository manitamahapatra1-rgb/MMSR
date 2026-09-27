
import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  getCourseById,
} from "../../../lib/courses";
import {
  getComparisonPrompt,
  parseComparisonResponse,
} from "../../../lib/prompt";
import { calculateScore } from "../../../lib/score";
import type {
  CourseInfo,
  CourseMatch,
  TopicCoverage,
} from "../../../types/course";

interface CompareRequestBody {
  uwCourseId: string;
  foreignCourseId: string;
}

interface ParsedComparison {
  topicCoverage: TopicCoverage[];
  extraTopics: CourseMatch["extraTopics"];
  caveats: CourseMatch["caveats"];
  advisorJustification: CourseMatch["advisorJustification"];
}

function findCourse(id: string): CourseInfo | null {
  try {
    return getCourseById(id) ?? null;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  try {
    let body: CompareRequestBody;

    try {
      body = (await request.json()) as CompareRequestBody;
    } catch {
      return NextResponse.json(
        { error: "Request body must be valid JSON." },
        { status: 400 },
      );
    }

    const { uwCourseId, foreignCourseId } = body;

    if (
      typeof uwCourseId !== "string" ||
      typeof foreignCourseId !== "string" ||
      !uwCourseId.trim() ||
      !foreignCourseId.trim()
    ) {
      return NextResponse.json(
        {
          error:
            "Both uwCourseId and foreignCourseId are required non-empty strings.",
        },
        { status: 400 },
      );
    }

    const uwCourse = findCourse(uwCourseId);
    if (!uwCourse) {
      return NextResponse.json(
        { error: `UW course not found: ${uwCourseId}` },
        { status: 400 },
      );
    }

    const foreignCourse = findCourse(foreignCourseId);
    if (!foreignCourse) {
      return NextResponse.json(
        { error: `Foreign course not found: ${foreignCourseId}` },
        { status: 400 },
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Gemini API key is not configured." },
        { status: 500 },
      );
    }

    const prompt = getComparisonPrompt(uwCourse, foreignCourse);
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-3.8-flash",
      generationConfig: {
        temperature: 0.2,
      },
    });

    const generateResponseText = async (): Promise<string> => {
      const result = await model.generateContent(prompt);
      return result.response.text();
    };

    let parsedComparison: ParsedComparison;

    try {
      const rawResponse = await generateResponseText();
      parsedComparison = parseComparisonResponse(
        rawResponse,
      ) as ParsedComparison;
    } catch {
      try {
        const retryRawResponse = await generateResponseText();
        parsedComparison = parseComparisonResponse(
          retryRawResponse,
        ) as ParsedComparison;
     } catch (error) {
  console.error("COMPARE/RETRY ERROR:", error);
  return NextResponse.json(
    { error: "Unable to parse the Gemini comparison response after two attempts." },
    { status: 500 },
  );
}
    }

    const matchPercentage = calculateScore(parsedComparison.topicCoverage);

    const response: CourseMatch = {
      uwCourse,
      foreignCourse,
      topicCoverage: parsedComparison.topicCoverage,
      matchPercentage,
      extraTopics: parsedComparison.extraTopics,
      caveats: parsedComparison.caveats,
      advisorJustification: parsedComparison.advisorJustification,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
  console.error("COMPARE ROUTE ERROR:", error);
  return NextResponse.json(
    { error: "An unexpected error occurred while comparing courses." },
    { status: 500 },
  );
}
}