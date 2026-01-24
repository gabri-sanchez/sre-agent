import type { Engineer, EngineerDirectory, Service } from "@sre-agent/shared";

export const engineerDirectory: EngineerDirectory = {
  payments: {
    primary: {
      id: "eng-001",
      name: "Alice Chen",
      phone: process.env.ENGINEER_PAYMENTS_PHONE || "+15551234001",
      email: "alice@example.com",
      services: ["payments"] as Service[],
      isBackup: false,
      timezone: "America/Los_Angeles",
    },
    backup: {
      id: "eng-002",
      name: "Bob Smith",
      phone: process.env.ENGINEER_PAYMENTS_BACKUP_PHONE || "+15551234002",
      email: "bob@example.com",
      services: ["payments", "api"] as Service[],
      isBackup: true,
      timezone: "America/New_York",
    },
  },
  auth: {
    primary: {
      id: "eng-003",
      name: "Carol Davis",
      phone: process.env.ENGINEER_AUTH_PHONE || "+15551234003",
      email: "carol@example.com",
      services: ["auth"] as Service[],
      isBackup: false,
      timezone: "America/Chicago",
    },
    backup: {
      id: "eng-004",
      name: "David Lee",
      phone: process.env.ENGINEER_AUTH_BACKUP_PHONE || "+15551234004",
      email: "david@example.com",
      services: ["auth", "api"] as Service[],
      isBackup: true,
      timezone: "America/Denver",
    },
  },
  api: {
    primary: {
      id: "eng-005",
      name: "Eve Wilson",
      phone: process.env.ENGINEER_API_PHONE || "+15551234005",
      email: "eve@example.com",
      services: ["api"] as Service[],
      isBackup: false,
      timezone: "America/Los_Angeles",
    },
    backup: {
      id: "eng-002",
      name: "Bob Smith",
      phone: process.env.ENGINEER_API_BACKUP_PHONE || "+15551234002",
      email: "bob@example.com",
      services: ["payments", "api"] as Service[],
      isBackup: true,
      timezone: "America/New_York",
    },
  },
  ui: {
    primary: {
      id: "eng-006",
      name: "Frank Brown",
      phone: process.env.ENGINEER_UI_PHONE || "+15551234006",
      email: "frank@example.com",
      services: ["ui"] as Service[],
      isBackup: false,
      timezone: "America/Los_Angeles",
    },
    backup: {
      id: "eng-007",
      name: "Grace Kim",
      phone: process.env.ENGINEER_UI_BACKUP_PHONE || "+15551234007",
      email: "grace@example.com",
      services: ["ui"] as Service[],
      isBackup: true,
      timezone: "America/New_York",
    },
  },
};

export function getEngineerForService(service: Service): Engineer {
  const entry = engineerDirectory[service];
  if (!entry) {
    throw new Error(`No engineer found for service: ${service}`);
  }
  return entry.primary;
}

export function getBackupEngineer(service: Service): Engineer | undefined {
  const entry = engineerDirectory[service];
  return entry?.backup;
}
