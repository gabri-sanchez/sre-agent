/**
 * Vapi function definitions for the SRE alert assistant
 */

export interface VapiFunction {
  name: string;
  description: string;
  parameters: {
    type: "object";
    properties: Record<string, {
      type: string;
      description: string;
      enum?: string[];
    }>;
    required?: string[];
  };
}

export const acknowledgeIncidentFunction: VapiFunction = {
  name: "acknowledge_incident",
  description: "Called when the engineer acknowledges they will handle the incident. Use this when they say things like 'I got it', 'I'll handle it', 'acknowledged', 'on it', etc.",
  parameters: {
    type: "object",
    properties: {
      note: {
        type: "string",
        description: "Optional note from the engineer about how they plan to address the issue",
      },
    },
  },
};

export const escalateToBackupFunction: VapiFunction = {
  name: "escalate_to_backup",
  description: "Called when the engineer wants to escalate to the backup on-call engineer. Use this when they say things like 'escalate', 'pass it on', 'get the backup', 'I can't handle this', etc.",
  parameters: {
    type: "object",
    properties: {
      reason: {
        type: "string",
        description: "Reason for escalation (e.g., 'unavailable', 'out of expertise', 'need additional help')",
      },
    },
  },
};

export const getMoreDetailsFunction: VapiFunction = {
  name: "get_more_details",
  description: "Called when the engineer wants more diagnostic details about the incident. Use this when they ask questions like 'what else do you know?', 'give me more details', 'what diagnostics did you run?', etc.",
  parameters: {
    type: "object",
    properties: {
      aspect: {
        type: "string",
        description: "Specific aspect they want details about",
        enum: ["diagnostics", "impact", "timeline", "all"],
      },
    },
  },
};

export const vapiFunctions: VapiFunction[] = [
  acknowledgeIncidentFunction,
  escalateToBackupFunction,
  getMoreDetailsFunction,
];
