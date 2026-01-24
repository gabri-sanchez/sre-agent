import Twilio from "twilio";
import { config } from "../config";
import type { Engineer, CallRecord, RoutingDecision } from "@sre-agent/shared";

class TwilioCaller {
  private client: Twilio.Twilio;
  private callRecords: Map<string, CallRecord> = new Map();
  private decisionStore: Map<string, RoutingDecision> = new Map();

  constructor() {
    this.client = Twilio(config.twilio.accountSid, config.twilio.authToken);
  }

  /**
   * Initiate an outbound call to an engineer
   */
  async initiateCall(
    engineer: Engineer,
    decision: RoutingDecision,
    errorEventId: string
  ): Promise<CallRecord> {
    const recordId = `call_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    const callRecord: CallRecord = {
      id: recordId,
      twilioCallSid: "",
      errorEventId,
      engineer,
      initiatedAt: new Date(),
      status: "initiated",
    };

    // Store the decision for later retrieval
    this.decisionStore.set(recordId, decision);

    try {
      const call = await this.client.calls.create({
        to: engineer.phone,
        from: config.twilio.phoneNumber,
        url: `${config.server.baseUrl}/twilio/voice?recordId=${recordId}`,
        method: "POST",
        statusCallback: `${config.server.baseUrl}/twilio/status`,
        statusCallbackEvent: ["initiated", "ringing", "answered", "completed"],
        statusCallbackMethod: "POST",
        timeout: 30,
      });

      callRecord.twilioCallSid = call.sid;
      this.callRecords.set(recordId, callRecord);

      console.log(
        `Call initiated: ${call.sid} to ${engineer.name} (${engineer.phone})`
      );
      return callRecord;
    } catch (error) {
      callRecord.status = "failed";
      console.error("Failed to initiate call:", error);
      throw error;
    }
  }

  /**
   * Get a call record by ID
   */
  getCallRecord(id: string): CallRecord | undefined {
    return this.callRecords.get(id);
  }

  /**
   * Get the decision associated with a call record
   */
  getDecision(recordId: string): RoutingDecision | undefined {
    return this.decisionStore.get(recordId);
  }

  /**
   * Update call record status
   */
  updateCallRecord(id: string, update: Partial<CallRecord>): void {
    const record = this.callRecords.get(id);
    if (record) {
      Object.assign(record, update);
      this.callRecords.set(id, record);
    }
  }

  /**
   * Get all active call records
   */
  getActiveCallRecords(): CallRecord[] {
    return Array.from(this.callRecords.values()).filter(
      (r) => r.status !== "acknowledged" && r.status !== "failed"
    );
  }
}

// Export singleton instance
export const twilioCaller = new TwilioCaller();
