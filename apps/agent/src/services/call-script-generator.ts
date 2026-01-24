import type { RoutingDecision } from "@sre-agent/shared";

/**
 * Generate a natural language call script from the agent's decision
 */
export function generateCallScript(decision: RoutingDecision): string {
  const parts: string[] = [];

  // Opening
  parts.push(`Alert: ${decision.severity} severity incident detected.`);

  // Summary
  if (decision.summary) {
    parts.push(decision.summary);
  }

  // Root cause if known
  if (decision.rootCause) {
    parts.push(`Likely cause: ${decision.rootCause}`);
  }

  // Talking points
  if (decision.talkingPoints && decision.talkingPoints.length > 0) {
    parts.push(...decision.talkingPoints);
  }

  // Diagnostic evidence
  if (decision.diagnosticEvidence && decision.diagnosticEvidence.length > 0) {
    parts.push(
      `Diagnostic findings: ${decision.diagnosticEvidence.slice(0, 2).join(". ")}`
    );
  }

  // Call to action
  parts.push("Press 1 to acknowledge this incident.");
  parts.push("Press 2 to escalate to backup engineer.");
  parts.push("Press 9 to repeat this message.");

  return parts.join(" ");
}

/**
 * Generate a shorter acknowledgment message
 */
export function generateAcknowledgmentScript(): string {
  return "Thank you. The incident has been acknowledged. A summary will be sent to your email. Goodbye.";
}

/**
 * Generate escalation message
 */
export function generateEscalationScript(backupName?: string): string {
  if (backupName) {
    return `Escalating to backup on-call engineer, ${backupName}. Please hold.`;
  }
  return "Escalating to backup on-call engineer. Please hold.";
}

/**
 * Generate no-input message
 */
export function generateNoInputScript(): string {
  return "No input received. Escalating to backup engineer.";
}
