import { ChatAnthropic } from "@langchain/anthropic";
import { config } from "../../config";
import type { DiagnosticStateType } from "../state";
import type { AnalysisResult } from "@sre-agent/shared";
import {
  ANALYST_SYSTEM_PROMPT,
  formatErrorForAnalysis,
} from "../prompts/analyst";

const llm = new ChatAnthropic({
  model: "claude-sonnet-4-20250514",
  apiKey: config.anthropic.apiKey,
  maxTokens: 1024,
});

export async function analyzeErrorNode(
  state: DiagnosticStateType
): Promise<Partial<DiagnosticStateType>> {
  console.log("=== ANALYZE NODE ===");
  console.log(`Analyzing error: ${state.errorContext.title}`);

  const userMessage = formatErrorForAnalysis({
    title: state.errorContext.title,
    message: state.errorContext.message,
    service: state.errorContext.service,
    severity: state.errorContext.severity,
    level: state.errorContext.level,
    stackTrace: state.errorContext.stackTrace,
    userCount: state.errorContext.userCount,
    occurrenceCount: state.errorContext.occurrenceCount,
    frequencyLast10Min: state.errorContext.frequencyLast10Min,
  });

  const response = await llm.invoke([
    { role: "system", content: ANALYST_SYSTEM_PROMPT },
    { role: "user", content: userMessage },
  ]);

  // Parse the JSON response
  let analysisResult: AnalysisResult;

  try {
    const content =
      typeof response.content === "string"
        ? response.content
        : JSON.stringify(response.content);

    // Extract JSON from the response (handle markdown code blocks)
    const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) ||
      content.match(/```\s*([\s\S]*?)\s*```/) || [null, content];

    const jsonStr = jsonMatch[1] || content;
    analysisResult = JSON.parse(jsonStr.trim());
  } catch (error) {
    console.error("Failed to parse analysis result:", error);
    // Fallback to sensible defaults based on error context
    analysisResult = {
      initialSeverity: state.errorContext.severity,
      hypothesis: `Error in ${state.errorContext.service} service: ${state.errorContext.title}`,
      suggestedDiagnostics: [],
    };
  }

  console.log(`Analysis result: severity=${analysisResult.initialSeverity}`);
  console.log(`Hypothesis: ${analysisResult.hypothesis}`);

  return {
    analysisResult,
  };
}
