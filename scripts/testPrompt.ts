// @ts-ignore

import { config } from "dotenv";
config({ path: ".env.local" });


import { getComparisonPrompt, parseComparisonResponse } from "../lib/prompt";
import pair2Data from "../data/pairs/pair2.json";
import { GoogleGenerativeAI } from "@google/generative-ai";

const pair2 = pair2Data as any;

async function main() {
  const prompt = getComparisonPrompt(pair2.uwCourse, pair2.foreignCourse);
  console.log("=== PROMPT ===");
  console.log(prompt);

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not defined in .env.local");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({
  model: "gemini-3.8-flash",
  generationConfig: { temperature: 0.2 },
});

  console.log("\nCalling Gemini API...");
  const result = await model.generateContent(prompt);
  const raw = result.response.text();

  console.log("\n=== RAW RESPONSE ===");
  console.log(raw);

  const parsed = parseComparisonResponse(raw);
  console.log("\n=== PARSED RESULT ===");
  console.log(JSON.stringify(parsed, null, 2));
}

main().catch(console.error);