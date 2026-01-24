import { ChatAnthropic } from "@langchain/anthropic";
import { config } from "../../config";
import type { DiagnosticStateType } from "../state";
import type { RoutingDecision, RoutingAction, Severity } from "@sre-agent/shared";
import {
  DECISION_MAKER_SYSTEM_PROMPT,
  formatDecisionPrompt,
} from "../prompts/decision-maker";

const llm = new ChatAnthropic({
  model: "claude-sonnet-4-20250514",
  apiKey: config.anthropic.apiKey,
  maxTokens: 1024,
});

export async function makeDecisionNode(
  state: DiagnosticStateType
): Promise<Partial<DiagnosticStateType>> {
  console.log("=== DECIDE NODE ===");

  const userMessage = formatDecisionPrompt({
    title: state.errorContext.title,
    service: state.errorContext.service,
    taggedSeverity: state.errorContext.severity,
    userCount: state.errorContext.userCount,
    occurrenceCount: state.errorContext.occurrenceCount,
    frequencyLast10Min: state.errorContext.frequencyLast10Min,
    hypothesis: state.analysisResult?.hypothesis || "Unknown",
    diagnosticResults: state.diagnosticResults.map((r) => ({
      tool: r.tool,
      output: r.output,
      success: r.success,
    })),
  });

  const response = await llm.invoke([
    { role: "system", content: DECISION_MAKER_SYSTEM_PROMPT },
    { role: "user", content: userMessage },
  ]);

  // Parse the JSON response
  let decision: RoutingDecision;

  try {
    const content =
      typeof response.content === "string"
        ? response.content
        : JSON.stringify(response.content);

    // Extract JSON from the response (handle markdown code blocks)
    const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) ||
      content.match(/```\s*([\s\S]*?)\s*```/) || [null, content];

    const jsonStr = jsonMatch[1] || content;
    const parsed = JSON.parse(jsonStr.trim());

    decision = {
      action: parsed.action as RoutingAction,
      severity: parsed.severity as Severity,
      summary: parsed.summary,
      rootCause: parsed.rootCause,
      talkingPoints: parsed.talkingPoints || [],
      diagnosticEvidence: parsed.diagnosticEvidence || [],
    };
  } catch (error) {
    console.error("Failed to parse decision result:", error);
    // Fallback to rule-based decision
    decision = makeRuleBasedDecision(state);
  }

  console.log(`Decision: ${decision.action} (${decision.severity})`);
  console.log(`Summary: ${decision.summary}`);

  return {
    finalDecision: decision,
  };
}

/**
 * Fallback rule-based decision if LLM parsing fails
 */
function makeRuleBasedDecision(state: DiagnosticStateType): RoutingDecision {
  const { errorContext, analysisResult, diagnosticResults } = state;

  // Determine action based on severity and frequency
  let action: RoutingAction = "LOG";
  let severity: Severity = errorContext.severity;

  if (severity === "critical") {
    action = "CALL";
  } else if (severity === "high" && errorContext.frequencyLast10Min >= 5) {
    action = "CALL";
  } else if (severity === "high") {
    action = "MONITOR";
  } else if (errorContext.frequencyLast10Min >= 5) {
    action = "CALL";
    severity = "high"; // Upgrade severity due to frequency
  } else if (severity === "medium") {
    action = "MONITOR";
  }

  return {
    action,
    severity,
    summary: `${errorContext.service} error: ${errorContext.title}. ${errorContext.userCount} users affected.`,
    rootCause: analysisResult?.hypothesis || "Unknown - analysis failed",
    talkingPoints: [
      `${errorContext.occurrenceCount} total occurrences`,
      `${errorContext.frequencyLast10Min} in the last 10 minutes`,
      diagnosticResults.length > 0
        ? `${diagnosticResults.filter((r) => r.success).length}/${diagnosticResults.length} diagnostic tests passed`
        : "No diagnostic tests run",
    ],
    diagnosticEvidence: diagnosticResults.map(
      (r) => `${r.tool}: ${r.success ? "OK" : "FAILED"}`
    ),
  };
}
