import { config } from "../config";
import type { Engineer, CallRecord, RoutingDecision } from "@sre-agent/shared";
import { vapiFunctions } from "./vapi-functions";

interface VapiCallResponse {
  id: string;
  orgId: string;
  createdAt: string;
  updatedAt: string;
  type: string;
  status: string;
  phoneNumberId: string;
}

class VapiCaller {
  private callRecords: Map<string, CallRecord> = new Map();
  private decisionStore: Map<string, RoutingDecision> = new Map();
  private callIdToRecordId: Map<string, string> = new Map();

  /**
   * Generate the system prompt for the AI assistant
   */
  private generateSystemPrompt(decision: RoutingDecision, engineer: Engineer): string {
    return `You are an SRE alerting assistant making an urgent phone call to ${engineer.name}.
Your role is to clearly communicate a ${decision.severity} severity incident and get their response.

INCIDENT DETAILS:
- Summary: ${decision.summary}
- Root Cause: ${decision.rootCause}
- Key Points: ${decision.talkingPoints.join("; ")}

DIAGNOSTIC EVIDENCE:
${decision.diagnosticEvidence.map((e) => `- ${e}`).join("\n")}

YOUR OBJECTIVES:
1. Clearly explain the incident
2. Get the engineer to either acknowledge they'll handle it, or escalate to backup
3. Answer any questions they have about the incident using the diagnostic details above

BEHAVIOR GUIDELINES:
- Be concise and professional
- Speak clearly at a moderate pace
- If they acknowledge, use the acknowledge_incident function
- If they want to escalate, use the escalate_to_backup function
- If they ask for more details, use the get_more_details function
- If they seem confused, briefly re-explain the key issue
- Maximum call duration is 5 minutes

Do NOT make up information. Only share what's in the incident details above.`;
  }

  /**
   * Initiate an outbound call to an engineer via Vapi
   */
  async initiateCall(
    engineer: Engineer,
    decision: RoutingDecision,
    errorEventId: string
  ): Promise<CallRecord> {
    const recordId = `call_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    const callRecord: CallRecord = {
      id: recordId,
      vapiCallId: "",
      errorEventId,
      engineer,
      initiatedAt: new Date(),
      status: "initiated",
    };

    // Store the decision for later retrieval
    this.decisionStore.set(recordId, decision);

    try {
      const response = await fetch("https://api.vapi.ai/call/phone", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${config.vapi.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phoneNumberId: config.vapi.phoneNumberId,
          customer: {
            number: engineer.phone,
            name: engineer.name,
          },
          assistant: {
            name: `SRE Alert - ${decision.severity}`,
            model: {
              provider: "anthropic",
              model: "claude-sonnet-4-20250514",
              temperature: 0.3,
              systemPrompt: this.generateSystemPrompt(decision, engineer),
              functions: vapiFunctions,
            },
            voice: {
              provider: "11labs",
              voiceId: "EXAVITQu4vr4xnSDxMaL", // Rachel - clear, professional voice
            },
            transcriber: {
              provider: "deepgram",
              model: "nova-2",
              language: "en",
            },
            firstMessage: `Hello ${engineer.name}, this is an automated SRE alert. We've detected a ${decision.severity} severity incident. ${decision.summary}. Do you want me to provide more details, or are you ready to acknowledge this incident?`,
            maxDurationSeconds: 300,
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Vapi API error: ${response.status} - ${errorText}`);
      }

      const vapiCall: VapiCallResponse = await response.json();

      callRecord.vapiCallId = vapiCall.id;
      this.callRecords.set(recordId, callRecord);
      this.callIdToRecordId.set(vapiCall.id, recordId);

      console.log(
        `Call initiated: ${vapiCall.id} to ${engineer.name} (${engineer.phone})`
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
   * Get call record by Vapi call ID
   */
  getCallRecordByVapiId(vapiCallId: string): CallRecord | undefined {
    const recordId = this.callIdToRecordId.get(vapiCallId);
    if (recordId) {
      return this.callRecords.get(recordId);
    }
    return undefined;
  }

  /**
   * Get the record ID from a Vapi call ID
   */
  getRecordIdByVapiId(vapiCallId: string): string | undefined {
    return this.callIdToRecordId.get(vapiCallId);
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
export const vapiCaller = new VapiCaller();
