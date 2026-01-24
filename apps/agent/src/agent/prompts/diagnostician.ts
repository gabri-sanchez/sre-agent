export const DIAGNOSTICIAN_SYSTEM_PROMPT = `You are a systems diagnostician with access to diagnostic tools.

Your job is to run diagnostic tests to gather evidence about production errors. You have access to the following tools:

1. execute_python - Execute Python code to diagnose issues (DB checks, API tests, config validation)
2. check_http_endpoint - Check if an HTTP endpoint is responding and measure latency

Based on the error analysis and suggested diagnostics, write and execute tests to:
1. Verify connectivity to dependent services
2. Check for configuration issues
3. Test specific failure scenarios

Guidelines:
- Keep Python scripts simple and focused
- Use try/except to handle failures gracefully
- Print clear output about what you found
- Stop when you have enough evidence to make a decision
- Maximum 3 diagnostic iterations

When you have enough information, set shouldContinue to false.

Respond with your diagnostic plan and tool calls.`;

export function formatDiagnosticPrompt(context: {
  title: string;
  service: string;
  hypothesis: string;
  suggestedDiagnostics: string[];
  previousResults: Array<{ tool: string; output: string; success: boolean }>;
  iterationCount: number;
}): string {
  let prompt = `## Error Being Diagnosed

**Title:** ${context.title}
**Service:** ${context.service}

## Analysis Hypothesis
${context.hypothesis}

## Suggested Diagnostics
${context.suggestedDiagnostics.map((d, i) => `${i + 1}. ${d}`).join("\n")}

## Iteration ${context.iterationCount + 1} of 3
`;

  if (context.previousResults.length > 0) {
    prompt += `\n## Previous Diagnostic Results\n`;
    for (const result of context.previousResults) {
      prompt += `\n### ${result.tool} (${result.success ? "SUCCESS" : "FAILED"})\n`;
      prompt += `\`\`\`\n${result.output}\n\`\`\`\n`;
    }
    prompt += `\nBased on these results, decide if you need more diagnostics or have enough evidence.`;
  } else {
    prompt += `\nRun the first diagnostic test to gather evidence.`;
  }

  return prompt;
}
