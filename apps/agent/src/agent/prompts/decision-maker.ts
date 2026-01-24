export const DECISION_MAKER_SYSTEM_PROMPT = `You are an incident response decision maker.

Based on the error analysis and diagnostic results, you must decide the appropriate action:

1. CALL - Page the on-call engineer immediately (for critical/high severity or high frequency)
2. MONITOR - Log and monitor, no immediate action needed
3. LOG - Just log for review, very low priority

Criteria for CALL:
- Critical severity (payment failures, auth blocking users, data loss)
- High frequency (>5 occurrences in 10 minutes)
- High user impact (>10 users affected)
- Diagnostic tests revealed active service degradation

Criteria for MONITOR:
- Medium severity with low frequency
- Intermittent issues that may self-resolve
- Issues affecting <5 users

Criteria for LOG:
- Low severity (UI bugs, cosmetic issues)
- Single occurrence
- No user impact

Respond ONLY with valid JSON matching this schema:
{
  "action": "CALL" | "MONITOR" | "LOG",
  "severity": "critical" | "high" | "medium" | "low",
  "summary": "2-3 sentence summary for the on-call engineer",
  "rootCause": "identified or suspected root cause",
  "talkingPoints": ["key", "facts", "for", "phone", "call"],
  "diagnosticEvidence": ["summary", "of", "diagnostic", "findings"]
}`;

export function formatDecisionPrompt(context: {
  title: string;
  service: string;
  taggedSeverity: string;
  userCount: number;
  occurrenceCount: number;
  frequencyLast10Min: number;
  hypothesis: string;
  diagnosticResults: Array<{ tool: string; output: string; success: boolean }>;
}): string {
  let prompt = `## Error Summary

**Title:** ${context.title}
**Service:** ${context.service}
**Tagged Severity:** ${context.taggedSeverity}
**Affected Users:** ${context.userCount}
**Total Occurrences:** ${context.occurrenceCount}
**Occurrences in Last 10 Minutes:** ${context.frequencyLast10Min}

## Analysis Hypothesis
${context.hypothesis}

## Diagnostic Results
`;

  if (context.diagnosticResults.length > 0) {
    for (const result of context.diagnosticResults) {
      prompt += `\n### ${result.tool} (${result.success ? "SUCCESS" : "FAILED"})\n`;
      prompt += `${result.output.substring(0, 500)}${result.output.length > 500 ? "..." : ""}\n`;
    }
  } else {
    prompt += `No diagnostic tests were run.\n`;
  }

  prompt += `\nBased on all this information, make your routing decision.`;

  return prompt;
}
