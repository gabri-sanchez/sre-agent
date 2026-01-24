import type { Severity } from "./error-event";
import type { Engineer } from "./engineer";

export type RoutingAction = "CALL" | "MONITOR" | "LOG";

export interface AnalysisResult {
  initialSeverity: Severity;
  hypothesis: string;
  suggestedDiagnostics: string[];
}

export interface DiagnosticResult {
  tool: string;
  input: string;
  output: string;
  success: boolean;
  timestamp: Date;
}

export interface RoutingDecision {
  action: RoutingAction;
  severity: Severity;
  summary: string;
  rootCause: string;
  talkingPoints: string[];
  diagnosticEvidence: string[];
  engineer?: Engineer;
}

export interface CallRecord {
  id: string;
  twilioCallSid: string;
  errorEventId: string;
  engineer: Engineer;
  initiatedAt: Date;
  answeredAt?: Date;
  acknowledgedAt?: Date;
  acknowledgmentKey?: string;
  status:
    | "initiated"
    | "ringing"
    | "answered"
    | "acknowledged"
    | "escalated"
    | "failed";
  escalatedTo?: Engineer;
}
