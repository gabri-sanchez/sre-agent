import { ChatAnthropic } from "@langchain/anthropic";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { config } from "../../config";
import { getHealthEndpointsForPrompt } from "../../config/services";
import type { DiagnosticStateType } from "../state";
import type { DiagnosticResult } from "@sre-agent/shared";
import {
  DIAGNOSTICIAN_SYSTEM_PROMPT,
  formatDiagnosticPrompt,
} from "../prompts/diagnostician";
import { DIAGNOSTIC_TOOLS } from "../tools";

const llm = new ChatAnthropic({
  model: "claude-sonnet-4-20250514",
  apiKey: config.anthropic.apiKey,
  maxTokens: 2048,
}).bindTools(DIAGNOSTIC_TOOLS);

const toolNode = new ToolNode(DIAGNOSTIC_TOOLS);

export async function diagnoseWithToolsNode(
  state: DiagnosticStateType
): Promise<Partial<DiagnosticStateType>> {
  console.log("=== DIAGNOSE NODE ===");
  console.log(`Iteration: ${state.iterationCount + 1}`);

  // If no analysis result or max iterations reached, skip
  if (!state.analysisResult || state.iterationCount >= 3) {
    console.log("Skipping diagnostics - max iterations or no analysis");
    return {
      iterationCount: state.iterationCount + 1,
      shouldContinueDiagnosing: false,
    };
  }

  // Format previous results
  const previousResults = state.diagnosticResults.map((r) => ({
    tool: r.tool,
    output: r.output,
    success: r.success,
  }));

  // Get health endpoints for the affected service
  const healthEndpoints = getHealthEndpointsForPrompt(state.errorContext.service);

  const userMessage = formatDiagnosticPrompt({
    title: state.errorContext.title,
    service: state.errorContext.service,
    hypothesis: state.analysisResult.hypothesis,
    suggestedDiagnostics: state.analysisResult.suggestedDiagnostics,
    previousResults,
    iterationCount: state.iterationCount,
    healthEndpoints,
  });

  // Get LLM response with potential tool calls
  const response = await llm.invoke([
    { role: "system", content: DIAGNOSTICIAN_SYSTEM_PROMPT },
    { role: "user", content: userMessage },
  ]);

  const newResults: DiagnosticResult[] = [];

  // Check for tool calls
  if (response.tool_calls && response.tool_calls.length > 0) {
    console.log(`Executing ${response.tool_calls.length} tool calls`);

    for (const toolCall of response.tool_calls) {
      console.log(`Tool: ${toolCall.name}`);

      try {
        // Execute the tool
        const toolResult = await toolNode.invoke({
          messages: [response],
        });

        const output =
          toolResult.messages?.[0]?.content ||
          "Tool executed but returned no output";

        newResults.push({
          tool: toolCall.name,
          input: JSON.stringify(toolCall.args),
          output: typeof output === "string" ? output : JSON.stringify(output),
          success: true,
          timestamp: new Date(),
        });
      } catch (error) {
        console.error(`Tool ${toolCall.name} failed:`, error);
        newResults.push({
          tool: toolCall.name,
          input: JSON.stringify(toolCall.args),
          output: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
          success: false,
          timestamp: new Date(),
        });
      }
    }
  }

  // Determine if we should continue diagnosing
  const totalIterations = state.iterationCount + 1;
  const shouldContinue =
    totalIterations < 3 &&
    newResults.length > 0 &&
    state.analysisResult.suggestedDiagnostics.length >
      state.diagnosticResults.length + newResults.length;

  console.log(`Diagnostics complete. Should continue: ${shouldContinue}`);

  return {
    diagnosticResults: newResults,
    iterationCount: totalIterations,
    shouldContinueDiagnosing: shouldContinue,
  };
}
