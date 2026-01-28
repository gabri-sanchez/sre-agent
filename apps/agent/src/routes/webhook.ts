import { Hono } from "hono";
import { verifySentrySignature } from "../middleware/sentry-signature";
import { enrichErrorContext } from "../services/context-enricher";
import { runDiagnosticAgent } from "../agent/graph";
import { vapiCaller } from "../services/vapi-caller";
import { getEngineerForService } from "../config/engineers";
import { generateReport } from "../services/report-generator";
import { saveReport } from "../services/report-store";
import { config } from "../config";
import type { SentryWebhookPayload } from "@sre-agent/shared";

type Variables = {
  rawBody: string;
  parsedBody: SentryWebhookPayload;
};

const app = new Hono<{ Variables: Variables }>();

// Sentry webhook endpoint
app.post("/sentry", verifySentrySignature, async (c) => {
  const payload = c.get("parsedBody");
  const resource = c.req.header("sentry-hook-resource");
  let effectivePayload = payload;

  console.log("Received Sentry webhook");
  const action = payload.action as
    | SentryWebhookPayload["action"]
    | "test"
    | "reopened"
    | "regressed";

  console.log(`Action: ${action}`);

  // Handle test notifications from Sentry integration settings
  if (action === "test") {
    console.log("Test notification received - webhook is working!");
    return c.json({ status: "ok", message: "Test notification received successfully" });
  }

  // If this is an event-only webhook (ex: metric alerts), synthesize an issue shape
  if (!payload.data?.issue && payload.data?.event) {
    const synthesizedIssue = buildIssueFromEvent(
      payload.data.event as NonNullable<SentryWebhookPayload["data"]["event"]> &
        Record<string, unknown>
    );
    effectivePayload = {
      ...payload,
      data: {
        ...payload.data,
        issue: synthesizedIssue,
      },
    };
    console.log("Event-only webhook received; synthesized issue", {
      action,
      resource,
      issueId: synthesizedIssue.id,
      eventId: payload.data.event.event_id,
    });
  } else if (!payload.data?.issue) {
    console.log("Unsupported webhook payload received", { action, resource });
    return c.json({ status: "ignored", reason: "unsupported_payload", action, resource });
  }

  console.log(`Issue: ${effectivePayload.data.issue.title}`);

  // Process issue actions that indicate a new or re-opened error state
  const actionableActions = new Set([
    "created",
    "unresolved",
    "reopened",
    "regressed",
    "triggered",
  ]);
  if (!actionableActions.has(action)) {
    console.log(`Ignoring action: ${action}`);
    return c.json({ status: "ignored", reason: `action=${action}` });
  }

  try {
    // Enrich the error context
    console.log("[1/4] Enriching error context...");
    const errorContext = await enrichErrorContext(effectivePayload);
    console.log(`[2/4] Error context enriched: ${errorContext.service} / ${errorContext.severity}`);

    // Run the diagnostic agent
    console.log("[3/4] Running diagnostic agent...");
    const agentResult = await runDiagnosticAgent(errorContext);
    const { finalDecision, diagnosticResults, analysisResult } = agentResult;

    console.log(`[4/4] Agent decision: ${finalDecision.action}`);

    // Generate and store the HTML report
    console.log("────────────────────────────────────────────────────────────");
    console.log("Generating diagnostic report...");
    console.log(`  Error: ${errorContext.title}`);
    console.log(`  Service: ${errorContext.service}`);
    console.log(`  Severity: ${finalDecision.severity}`);
    console.log(`  Decision: ${finalDecision.action}`);
    console.log(`  Diagnostics run: ${diagnosticResults.length}`);
    console.log(`  Talking points: ${finalDecision.talkingPoints.length}`);
    const reportHtml = generateReport({
      errorContext,
      analysisResult,
      diagnosticResults,
      finalDecision,
    });
    saveReport(errorContext.id, reportHtml);
    const reportUrl = `${config.server.baseUrl}/reports/${errorContext.id}`;
    console.log(`Report saved: ${errorContext.id}`);
    console.log(`Report URL: ${reportUrl}`);
    console.log("────────────────────────────────────────────────────────────");

    // Take action based on decision
    if (finalDecision.action === "CALL") {
      const engineer = getEngineerForService(errorContext.service);
      console.log(`Initiating call to ${engineer.name} (${engineer.phone})`);

      const callRecord = await vapiCaller.initiateCall(
        engineer,
        finalDecision,
        errorContext.id
      );

      return c.json({
        status: "call_initiated",
        decision: finalDecision,
        callRecord: {
          id: callRecord.id,
          engineer: engineer.name,
          status: callRecord.status,
        },
        reportUrl,
      });
    }

    // For MONITOR or LOG, just return the decision
    return c.json({
      status: finalDecision.action.toLowerCase(),
      decision: finalDecision,
      reportUrl,
    });
  } catch (error) {
    console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.error("Error processing webhook:");
    if (error instanceof Error) {
      console.error("Message:", error.message);
      console.error("Stack:", error.stack);
    } else {
      console.error("Unknown error:", error);
    }
    console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    // Return error but with 200 to prevent Sentry retries
    return c.json({
      status: "error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Health check for the webhook endpoint
app.get("/sentry", (c) => {
  return c.json({
    status: "ok",
    message: "Sentry webhook endpoint is active",
    method: "POST /webhook/sentry",
  });
});

// Test endpoint to generate a sample report without going through Sentry
app.post("/test-report", async (c) => {
  console.log("========================================");
  console.log("Generating test report...");
  console.log("========================================");

  const testErrorContext = {
    id: `test-${Date.now()}`,
    sentryEventId: "abc123def456",
    sentryIssueId: "ISSUE-123",
    title: "Payment Gateway Timeout",
    message: "Connection to payment.provider.com timed out after 30000ms",
    service: "payments" as const,
    severity: "critical" as const,
    level: "error",
    stackTrace: `Error: Payment Gateway Timeout
    at processPayment (src/services/payments.ts:45:11)
    at checkout (src/routes/checkout.ts:123:5)
    at async handleRequest (src/server.ts:89:3)`,
    userCount: 150,
    occurrenceCount: 342,
    frequencyLast10Min: 47,
    permalink: "https://sentry.io/issues/123",
    tags: { environment: "production" },
    timestamp: new Date(),
  };

  const testAnalysisResult = {
    initialSeverity: "critical" as const,
    hypothesis: "The payment service is experiencing connectivity issues with the upstream payment gateway. This could be due to network problems, rate limiting, or an outage at the payment provider.",
    suggestedDiagnostics: [
      "Check payment gateway connectivity",
      "Verify API credentials are valid",
      "Check for rate limiting responses",
      "Review recent deployments",
    ],
  };

  const testDiagnosticResults = [
    {
      tool: "check_http_endpoint",
      input: "http://localhost:3000/api/health/payments",
      output: "FAILED: Service Unavailable\nStatus: 503\nLatency: 45ms",
      success: false,
      timestamp: new Date(Date.now() - 5000),
    },
    {
      tool: "execute_python",
      input: "check_payment_gateway_connectivity()",
      output: "Connection refused to payment.provider.com:443\nTimeout after 10s",
      success: true,
      timestamp: new Date(Date.now() - 3000),
    },
    {
      tool: "query_logs",
      input: "service:payments level:error",
      output: "Found 47 errors in last 10 minutes\nMost common: PaymentGatewayTimeout (89%)",
      success: true,
      timestamp: new Date(Date.now() - 1000),
    },
  ];

  const testFinalDecision = {
    action: "CALL" as const,
    severity: "critical" as const,
    summary: "Payment gateway is experiencing a complete outage affecting all transactions",
    rootCause: "Payment gateway connection timeout due to upstream provider issues. The external payment processor appears to be experiencing an outage.",
    talkingPoints: [
      "Payment gateway returning 503 errors for all requests",
      "150 users affected in last 10 minutes",
      "Revenue impact estimated at $500/minute based on average transaction volume",
      "Upstream provider status page shows degraded performance",
    ],
    diagnosticEvidence: [
      "Health endpoint returning 503",
      "Connection timeouts to payment.provider.com",
      "47 errors logged in last 10 minutes",
    ],
  };

  const reportHtml = generateReport({
    errorContext: testErrorContext,
    analysisResult: testAnalysisResult,
    diagnosticResults: testDiagnosticResults,
    finalDecision: testFinalDecision,
  });

  saveReport(testErrorContext.id, reportHtml);
  const reportUrl = `${config.server.baseUrl}/reports/${testErrorContext.id}`;

  console.log("────────────────────────────────────────────────────────────");
  console.log("Test report generated!");
  console.log(`  Error: ${testErrorContext.title}`);
  console.log(`  Service: ${testErrorContext.service}`);
  console.log(`  Severity: ${testFinalDecision.severity}`);
  console.log(`  Decision: ${testFinalDecision.action}`);
  console.log(`Report URL: ${reportUrl}`);
  console.log("────────────────────────────────────────────────────────────");

  return c.json({
    status: "test_report_generated",
    reportUrl,
    reportId: testErrorContext.id,
  });
});

export default app;

function buildIssueFromEvent(
  event: NonNullable<SentryWebhookPayload["data"]["event"]> & Record<string, unknown>
): SentryWebhookPayload["data"]["issue"] {
  const metadata = event?.metadata as Record<string, unknown> | undefined;
  const issueId = event?.issue_id
    ? String(event.issue_id)
    : `evt_${event?.event_id || Date.now()}`;
  const title = String(event?.title || event?.message || "Sentry event alert");
  const level = (event?.level as SentryWebhookPayload["data"]["issue"]["level"]) || "error";
  const tagsInput = Array.isArray(event?.tags) ? event.tags : [];
  const tags = tagsInput.map((tag) => {
    if (Array.isArray(tag)) {
      const [key, value] = tag;
      return { key: String(key), value: String(value), name: String(key) };
    }
    const key = String((tag as { key?: string }).key || "tag");
    const value = String((tag as { value?: string }).value || "");
    return { key, value, name: key };
  });
  const lastSeen =
    typeof event?.datetime === "string"
      ? event.datetime
      : typeof event?.timestamp === "string"
        ? event.timestamp
        : new Date().toISOString();
  const platform = String(event?.platform || "unknown");
  const permalink = String(event?.web_url || event?.url || event?.issue_url || "");

  return {
    id: issueId,
    shortId: `ISSUE-${issueId}`,
    title,
    culprit: String(event?.culprit || title),
    permalink,
    logger: (event?.logger as string | null) ?? null,
    level,
    status: "unresolved",
    statusDetails: {},
    isPublic: false,
    platform,
    project: {
      id: String(event?.project ?? "unknown"),
      name: String(event?.project ?? "unknown"),
      slug: String(event?.project ?? "unknown"),
      platform,
    },
    type: String(event?.type || "error"),
    metadata: {
      value: String(metadata?.value || event?.message || title),
      type: String(metadata?.type || event?.type || "error"),
      filename: metadata?.filename as string | undefined,
      function: metadata?.function as string | undefined,
    },
    numComments: 0,
    userCount: typeof event?.userCount === "number" ? event.userCount : 0,
    count: typeof event?.count === "string" ? event.count : "1",
    firstSeen: lastSeen,
    lastSeen,
    tags,
  };
}
