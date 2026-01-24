import { Hono } from "hono";
import { twilioCaller } from "../services/twilio-caller";
import { getBackupEngineer } from "../config/engineers";
import {
  generateCallScript,
  generateAcknowledgmentScript,
  generateEscalationScript,
} from "../services/call-script-generator";
import {
  buildAlertTwiml,
  buildAcknowledgmentTwiml,
  buildEscalationTwiml,
  buildNoBackupTwiml,
  buildInvalidInputTwiml,
} from "../utils/twiml-builder";
import type { Service } from "@sre-agent/shared";

const app = new Hono();

// TwiML endpoint - called by Twilio when call is answered
app.post("/voice", async (c) => {
  const recordId = c.req.query("recordId");

  if (!recordId) {
    return c.text("Missing record ID", 400);
  }

  const record = twilioCaller.getCallRecord(recordId);
  if (!record) {
    console.error(`Call record not found: ${recordId}`);
    return c.text("Call record not found", 404);
  }

  const decision = twilioCaller.getDecision(recordId);
  if (!decision) {
    console.error(`Decision not found for record: ${recordId}`);
    return c.text("Decision not found", 404);
  }

  // Update status
  twilioCaller.updateCallRecord(recordId, {
    answeredAt: new Date(),
    status: "answered",
  });

  // Generate the call script
  const script = generateCallScript(decision);
  const twimlResponse = buildAlertTwiml(script, recordId);

  c.header("Content-Type", "application/xml");
  return c.body(twimlResponse);
});

// Handle keypress input
app.post("/gather", async (c) => {
  const recordId = c.req.query("recordId");
  const formData = await c.req.parseBody();
  const digits = formData["Digits"] as string;

  if (!recordId) {
    return c.text("Missing record ID", 400);
  }

  const record = twilioCaller.getCallRecord(recordId);
  if (!record) {
    return c.text("Call record not found", 404);
  }

  const decision = twilioCaller.getDecision(recordId);
  let twimlResponse: string;

  switch (digits) {
    case "1":
      // Acknowledge
      twilioCaller.updateCallRecord(recordId, {
        acknowledgedAt: new Date(),
        acknowledgmentKey: "1",
        status: "acknowledged",
      });
      console.log(`Incident acknowledged by ${record.engineer.name}`);

      const ackScript = generateAcknowledgmentScript();
      twimlResponse = buildAcknowledgmentTwiml(ackScript);
      break;

    case "2":
      // Escalate
      const service = record.engineer.services[0] as Service;
      const backup = getBackupEngineer(service);

      if (backup) {
        twilioCaller.updateCallRecord(recordId, {
          status: "escalated",
          escalatedTo: backup,
        });
        console.log(
          `Escalating to backup engineer: ${backup.name} (${backup.phone})`
        );

        const escalationScript = generateEscalationScript(backup.name);
        twimlResponse = buildEscalationTwiml(escalationScript, backup.phone);
      } else {
        twimlResponse = buildNoBackupTwiml();
      }
      break;

    case "9":
      // Repeat message
      if (decision) {
        const script = generateCallScript(decision);
        twimlResponse = buildAlertTwiml(script, recordId);
      } else {
        twimlResponse = buildInvalidInputTwiml(recordId);
      }
      break;

    default:
      // Invalid input
      twimlResponse = buildInvalidInputTwiml(recordId);
  }

  c.header("Content-Type", "application/xml");
  return c.body(twimlResponse);
});

// Call status callback
app.post("/status", async (c) => {
  const formData = await c.req.parseBody();
  const callSid = formData["CallSid"] as string;
  const callStatus = formData["CallStatus"] as string;

  console.log(`Call ${callSid} status: ${callStatus}`);

  // Find and update the call record by SID
  // This is a simplified implementation - in production you'd want an index by SID

  return c.text("OK");
});

// Escalation endpoint
app.post("/escalate", async (c) => {
  const recordId = c.req.query("recordId");

  if (!recordId) {
    return c.text("Missing record ID", 400);
  }

  const record = twilioCaller.getCallRecord(recordId);
  if (!record) {
    return c.text("Call record not found", 404);
  }

  const service = record.engineer.services[0] as Service;
  const backup = getBackupEngineer(service);

  if (!backup) {
    c.header("Content-Type", "application/xml");
    return c.body(buildNoBackupTwiml());
  }

  twilioCaller.updateCallRecord(recordId, {
    status: "escalated",
    escalatedTo: backup,
  });

  console.log(`Auto-escalating to backup: ${backup.name} (${backup.phone})`);

  const escalationScript = generateEscalationScript(backup.name);
  c.header("Content-Type", "application/xml");
  return c.body(buildEscalationTwiml(escalationScript, backup.phone));
});

export default app;
