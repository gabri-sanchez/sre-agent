import { Hono } from "hono";
import { verifySentrySignature } from "../middleware/sentry-signature";
import { enrichErrorContext } from "../services/context-enricher";
import { runDiagnosticAgent } from "../agent/graph";
import { twilioCaller } from "../services/twilio-caller";
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

  console.log("Received Sentry webhook");
  console.log(`Action: ${payload.action}`);

  // Handle test notifications from Sentry integration settings
  if (payload.action === "test" || !payload.data?.issue) {
    console.log("Test notification received - webhook is working!");
    return c.json({ status: "ok", message: "Test notification received successfully" });
  }

  console.log(`Issue: ${payload.data.issue.title}`);

  // Only process new issues
  if (payload.action !== "created") {
    console.log(`Ignoring action: ${payload.action}`);
    return c.json({ status: "ignored", reason: `action=${payload.action}` });
  }

  try {
    // Enrich the error context
    console.log("[1/4] Enriching error context...");
    const errorContext = await enrichErrorContext(payload);
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

      const callRecord = await twilioCaller.initiateCall(
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

export default app;
