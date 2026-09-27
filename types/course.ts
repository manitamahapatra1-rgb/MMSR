export interface CourseInfo {
  id: string;
  school: string;
  courseCode: string;
  title: string;
  description: string;
  topics: string[]; // 5–10
  credits: number;
  level: "intro" | "intermediate" | "advanced";
  prerequisites: string[];
  sourceUrl: string;
}

export type Coverage = "covered" | "partial" | "missing";

export interface TopicCoverage {
  topic: string; // a UW topic
  coverage: Coverage;
  evidence: string;
}

export interface CourseMatch {
  uwCourse: CourseInfo;
  foreignCourse: CourseInfo;
  topicCoverage: TopicCoverage[];
  matchPercentage: number; // computed in code
  extraTopics: string[];
  caveats: string[];
  advisorJustification: string;
}
