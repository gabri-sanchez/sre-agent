import type {
  ErrorContext,
  AnalysisResult,
  DiagnosticResult,
  RoutingDecision,
} from "@sre-agent/shared";
import { Annotation } from "@langchain/langgraph";

// LangGraph state annotation
export const DiagnosticState = Annotation.Root({
  errorContext: Annotation<ErrorContext>,
  analysisResult: Annotation<AnalysisResult | undefined>,
  diagnosticResults: Annotation<DiagnosticResult[]>({
    value: (current, update) => [...current, ...update],
    default: () => [],
  }),
  finalDecision: Annotation<RoutingDecision | undefined>,
  iterationCount: Annotation<number>({
    value: (_, update) => update,
    default: () => 0,
  }),
  shouldContinueDiagnosing: Annotation<boolean>({
    value: (_, update) => update,
    default: () => true,
  }),
});

export type DiagnosticStateType = typeof DiagnosticState.State;
