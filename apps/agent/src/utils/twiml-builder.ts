import { twiml } from "twilio";
import { config } from "../config";

/**
 * Build TwiML for the initial alert call
 */
export function buildAlertTwiml(script: string, recordId: string): string {
  const response = new twiml.VoiceResponse();

  // Say the alert message
  response.say({ voice: "alice", language: "en-US" }, script);

  // Gather keypress input
  const gather = response.gather({
    action: `${config.server.baseUrl}/twilio/gather?recordId=${recordId}`,
    method: "POST",
    numDigits: 1,
    timeout: 15,
    finishOnKey: "",
  });
  gather.say({ voice: "alice" }, "Please press a key now.");

  // Fallback if no input
  response.say({ voice: "alice" }, "No input received. Escalating to backup.");
  response.redirect(
    { method: "POST" },
    `${config.server.baseUrl}/twilio/escalate?recordId=${recordId}`
  );

  return response.toString();
}

/**
 * Build TwiML for acknowledgment
 */
export function buildAcknowledgmentTwiml(message: string): string {
  const response = new twiml.VoiceResponse();
  response.say({ voice: "alice", language: "en-US" }, message);
  response.hangup();
  return response.toString();
}

/**
 * Build TwiML for escalation
 */
export function buildEscalationTwiml(
  message: string,
  backupPhone: string
): string {
  const response = new twiml.VoiceResponse();
  response.say({ voice: "alice", language: "en-US" }, message);
  const dial = response.dial({ callerId: config.twilio.phoneNumber });
  dial.number(backupPhone);
  return response.toString();
}

/**
 * Build TwiML for no backup available
 */
export function buildNoBackupTwiml(): string {
  const response = new twiml.VoiceResponse();
  response.say(
    { voice: "alice", language: "en-US" },
    "No backup engineer available. Please check your email for incident details. Goodbye."
  );
  response.hangup();
  return response.toString();
}

/**
 * Build TwiML for invalid input
 */
export function buildInvalidInputTwiml(recordId: string): string {
  const response = new twiml.VoiceResponse();
  response.say(
    { voice: "alice", language: "en-US" },
    "Invalid input. Press 1 to acknowledge, 2 to escalate, or 9 to repeat."
  );
  response.redirect(
    { method: "POST" },
    `${config.server.baseUrl}/twilio/voice?recordId=${recordId}`
  );
  return response.toString();
}
