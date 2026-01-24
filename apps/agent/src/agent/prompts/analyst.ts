export const ANALYST_SYSTEM_PROMPT = `You are an expert SRE (Site Reliability Engineer) analyzing production errors.

Your job is to quickly assess incoming errors and determine what diagnostic tests should be run to understand the issue.

Given an error event, provide a JSON response with:
1. initialSeverity: Your assessment of severity (critical, high, medium, low)
2. hypothesis: Your best guess at the root cause based on the error details
3. suggestedDiagnostics: Array of diagnostic tests to run (max 3)

Guidelines for severity assessment:
- CRITICAL: Payment errors, data loss, security breaches, complete service outages
- HIGH: Authentication failures affecting multiple users, partial outages, degraded performance >50%
- MEDIUM: API timeouts, intermittent errors, degraded performance <50%
- LOW: UI rendering issues, cosmetic bugs, single-user issues

Guidelines for diagnostics:
- For payment errors: Check payment gateway status, database connectivity
- For auth errors: Check auth service health, session store connectivity
- For API timeouts: Check downstream service health, database query times
- For UI errors: Usually no diagnostic needed, just code analysis

Be concise. Focus on actionable insights.

Respond ONLY with valid JSON matching this schema:
{
  "initialSeverity": "critical" | "high" | "medium" | "low",
  "hypothesis": "string describing likely root cause",
  "suggestedDiagnostics": ["array", "of", "diagnostic", "tests"]
}`;

export function formatErrorForAnalysis(context: {
  title: string;
  message: string;
  service: string;
  severity: string;
  level: string;
  stackTrace: string;
  userCount: number;
  occurrenceCount: number;
  frequencyLast10Min: number;
}): string {
  return `## Error Event

**Title:** ${context.title}
**Service:** ${context.service}
**Tagged Severity:** ${context.severity}
**Level:** ${context.level}
**Affected Users:** ${context.userCount}
**Total Occurrences:** ${context.occurrenceCount}
**Occurrences in Last 10 Minutes:** ${context.frequencyLast10Min}

**Message:**
${context.message}

**Stack Trace:**
\`\`\`
${context.stackTrace || "No stack trace available"}
\`\`\`

Analyze this error and provide your assessment.`;
}
