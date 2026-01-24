import { StateGraph, END } from "@langchain/langgraph";
import { DiagnosticState, type DiagnosticStateType } from "./state";
import { analyzeErrorNode } from "./nodes/analyze";
import { diagnoseWithToolsNode } from "./nodes/diagnose";
import { makeDecisionNode } from "./nodes/decide";
import type { ErrorContext, RoutingDecision } from "@sre-agent/shared";

// Conditional edge function to determine if we should continue diagnosing
function shouldContinueDiagnosing(
  state: DiagnosticStateType
): "diagnose" | "decide" {
  if (state.shouldContinueDiagnosing && state.iterationCount < 3) {
    return "diagnose";
  }
  return "decide";
}

// Build the graph
const graphBuilder = new StateGraph(DiagnosticState)
  .addNode("analyze", analyzeErrorNode)
  .addNode("diagnose", diagnoseWithToolsNode)
  .addNode("decide", makeDecisionNode)
  .addEdge("__start__", "analyze")
  .addEdge("analyze", "diagnose")
  .addConditionalEdges("diagnose", shouldContinueDiagnosing, {
    diagnose: "diagnose",
    decide: "decide",
  })
  .addEdge("decide", END);

// Compile the graph
const graph = graphBuilder.compile();

export interface AgentResult {
  finalDecision: RoutingDecision;
  diagnosticResults: DiagnosticStateType["diagnosticResults"];
  analysisResult: DiagnosticStateType["analysisResult"];
}

/**
 * Run the diagnostic agent on an error context
 */
export async function runDiagnosticAgent(
  errorContext: ErrorContext
): Promise<AgentResult> {
  console.log("========================================");
  console.log("Starting Diagnostic Agent");
  console.log(`Error: ${errorContext.title}`);
  console.log(`Service: ${errorContext.service}`);
  console.log(`Severity: ${errorContext.severity}`);
  console.log("========================================");

  const result = await graph.invoke({
    errorContext,
  });

  console.log("========================================");
  console.log("Agent Complete");
  console.log(`Decision: ${result.finalDecision?.action}`);
  console.log("========================================");

  if (!result.finalDecision) {
    throw new Error("Agent did not produce a final decision");
  }

  return {
    finalDecision: result.finalDecision,
    diagnosticResults: result.diagnosticResults,
    analysisResult: result.analysisResult,
  };
}

export { graph };
