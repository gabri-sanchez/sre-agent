import { Hono } from "hono";
import crypto from "crypto";
import { vapiCaller } from "../services/vapi-caller";
import { getBackupEngineer } from "../config/engineers";
import { config } from "../config";
import type { Service } from "@sre-agent/shared";

type Variables = {
  rawBody: string;
  parsedBody: VapiWebhookPayload;
};

const app = new Hono<{ Variables: Variables }>();

/**
 * Verify Vapi webhook signature
 */
function verifyVapiSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const computed = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");

  try {
    return crypto.timingSafeEqual(
      Buffer.from(computed),
      Buffer.from(signature)
    );
  } catch {
    return false;
  }
}

/**
 * Middleware to verify Vapi webhook signatures
 */
app.use("/webhook", async (c, next) => {
  // Skip verification if no secret is configured
  if (!config.vapi.webhookSecret) {
    await next();
    return;
  }

  const signature = c.req.header("x-vapi-signature");
  if (!signature) {
    console.warn("[Vapi Webhook] Missing signature header");
    return c.json({ error: "Missing signature" }, 401);
  }

  const rawBody = await c.req.text();
  c.set("rawBody", rawBody);

  if (!verifyVapiSignature(rawBody, signature, config.vapi.webhookSecret)) {
    console.warn("[Vapi Webhook] Invalid signature");
    return c.json({ error: "Invalid signature" }, 401);
  }

  // Parse the body and store it for the handler
  try {
    c.set("parsedBody", JSON.parse(rawBody));
  } catch {
    return c.json({ error: "Invalid JSON" }, 400);
  }

  await next();
});

interface VapiWebhookPayload {
  message: {
    type: string;
    call?: {
      id: string;
      status?: string;
      endedReason?: string;
    };
    functionCall?: {
      name: string;
      parameters: Record<string, unknown>;
    };
    transcript?: string;
    artifact?: {
      transcript?: string;
    };
  };
}

interface FunctionCallResult {
  result: string;
}

/**
 * Main webhook endpoint for all Vapi events
 */
app.post("/webhook", async (c) => {
  // Use parsed body from middleware if available (when signature verification is enabled)
  // Otherwise parse directly
  const payload: VapiWebhookPayload =
    c.get("parsedBody") ?? (await c.req.json());
  const { message } = payload;
  const messageType = message.type;

  console.log(`[Vapi Webhook] Event type: ${messageType}`);

  const callId = message.call?.id;
  if (!callId) {
    console.log("[Vapi Webhook] No call ID in payload");
    return c.json({ status: "ok" });
  }

  const record = vapiCaller.getCallRecordByVapiId(callId);
  const recordId = vapiCaller.getRecordIdByVapiId(callId);

  switch (messageType) {
    case "status-update": {
      const status = message.call?.status;
      console.log(`[Vapi Webhook] Call ${callId} status: ${status}`);

      if (record && recordId) {
        if (status === "queued" || status === "ringing") {
          vapiCaller.updateCallRecord(recordId, { status: "ringing" });
        } else if (status === "in-progress") {
          vapiCaller.updateCallRecord(recordId, {
            status: "answered",
            answeredAt: new Date(),
          });
        }
      }
      break;
    }

    case "function-call": {
      const functionCall = message.functionCall;
      if (!functionCall) {
        return c.json({ result: "No function call data" });
      }

      console.log(`[Vapi Webhook] Function call: ${functionCall.name}`);
      console.log(`[Vapi Webhook] Parameters:`, functionCall.parameters);

      const result = await handleFunctionCall(
        functionCall.name,
        functionCall.parameters,
        callId
      );

      return c.json(result);
    }

    case "transcript": {
      // Real-time transcript updates
      if (message.transcript) {
        console.log(`[Vapi Webhook] Transcript: ${message.transcript}`);
      }
      break;
    }

    case "end-of-call-report": {
      console.log(`[Vapi Webhook] Call ended: ${callId}`);
      const endedReason = message.call?.endedReason;
      const fullTranscript = message.artifact?.transcript;

      if (record && recordId) {
        vapiCaller.updateCallRecord(recordId, {
          endedReason,
          fullTranscript,
        });

        // Auto-escalate if call wasn't acknowledged
        if (
          record.status !== "acknowledged" &&
          record.status !== "escalated"
        ) {
          console.log(
            `[Vapi Webhook] Call ended without acknowledgment, auto-escalating`
          );
          await handleAutoEscalation(recordId);
        }
      }
      break;
    }

    default:
      console.log(`[Vapi Webhook] Unhandled event type: ${messageType}`);
  }

  return c.json({ status: "ok" });
});

/**
 * Handle function calls from the Vapi assistant
 */
async function handleFunctionCall(
  functionName: string,
  parameters: Record<string, unknown>,
  vapiCallId: string
): Promise<FunctionCallResult> {
  const recordId = vapiCaller.getRecordIdByVapiId(vapiCallId);
  if (!recordId) {
    return { result: "Call record not found" };
  }

  const record = vapiCaller.getCallRecord(recordId);
  const decision = vapiCaller.getDecision(recordId);

  if (!record) {
    return { result: "Call record not found" };
  }

  switch (functionName) {
    case "acknowledge_incident": {
      const note = parameters.note as string | undefined;

      vapiCaller.updateCallRecord(recordId, {
        acknowledgedAt: new Date(),
        acknowledgmentNote: note,
        status: "acknowledged",
      });

      console.log(
        `[Vapi] Incident acknowledged by ${record.engineer.name}${note ? `: ${note}` : ""}`
      );

      return {
        result: `Thank you ${record.engineer.name}. The incident has been acknowledged and assigned to you. A summary has been sent to your email. You can hang up now.`,
      };
    }

    case "escalate_to_backup": {
      const reason = parameters.reason as string | undefined;
      const service = record.engineer.services[0] as Service;
      const backup = getBackupEngineer(service);

      if (backup) {
        vapiCaller.updateCallRecord(recordId, {
          status: "escalated",
          escalatedTo: backup,
          escalationReason: reason,
        });

        console.log(
          `[Vapi] Escalating to backup engineer: ${backup.name} (${backup.phone})`
        );

        // Initiate call to backup engineer
        if (decision) {
          vapiCaller.initiateCall(backup, decision, record.errorEventId);
        }

        return {
          result: `Understood. I'm escalating this to ${backup.name}, the backup on-call engineer. They will receive a call shortly. Thank you for letting me know. You can hang up now.`,
        };
      } else {
        return {
          result:
            "I'm sorry, there is no backup engineer available for this service. Please acknowledge the incident or contact your team lead directly.",
        };
      }
    }

    case "get_more_details": {
      const aspect = parameters.aspect as string | undefined;

      if (!decision) {
        return { result: "I don't have additional details available." };
      }

      let details: string;

      switch (aspect) {
        case "diagnostics":
          details = `Here are the diagnostic findings: ${decision.diagnosticEvidence.join(". ")}`;
          break;
        case "impact":
          details = `The key impacts are: ${decision.talkingPoints.join(". ")}`;
          break;
        case "timeline":
          details = `The incident was detected and analyzed automatically. Root cause analysis suggests: ${decision.rootCause}`;
          break;
        default:
          details = `Summary: ${decision.summary}. Root cause: ${decision.rootCause}. Diagnostic evidence: ${decision.diagnosticEvidence.slice(0, 2).join(". ")}. Key points: ${decision.talkingPoints.slice(0, 2).join(". ")}`;
      }

      return { result: details };
    }

    default:
      return { result: `Unknown function: ${functionName}` };
  }
}

/**
 * Handle auto-escalation when a call ends without acknowledgment
 */
async function handleAutoEscalation(recordId: string): Promise<void> {
  const record = vapiCaller.getCallRecord(recordId);
  const decision = vapiCaller.getDecision(recordId);

  if (!record || !decision) {
    console.error(`[Vapi] Cannot auto-escalate: record or decision not found`);
    return;
  }

  const service = record.engineer.services[0] as Service;
  const backup = getBackupEngineer(service);

  if (backup) {
    vapiCaller.updateCallRecord(recordId, {
      status: "escalated",
      escalatedTo: backup,
      escalationReason: "No response from primary on-call",
    });

    console.log(
      `[Vapi] Auto-escalating to backup: ${backup.name} (${backup.phone})`
    );

    await vapiCaller.initiateCall(backup, decision, record.errorEventId);
  } else {
    console.log(`[Vapi] No backup engineer available for auto-escalation`);
    vapiCaller.updateCallRecord(recordId, {
      status: "failed",
      escalationReason: "No backup engineer available",
    });
  }
}

export default app;
