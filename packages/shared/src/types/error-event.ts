export type Severity = "critical" | "high" | "medium" | "low";
export type Service = "payments" | "auth" | "api" | "ui";

export interface ErrorContext {
  id: string;
  sentryEventId: string;
  sentryIssueId: string;
  title: string;
  message: string;
  service: Service;
  severity: Severity;
  level: string;
  stackTrace: string;
  userCount: number;
  occurrenceCount: number;
  frequencyLast10Min: number;
  permalink: string;
  tags: Record<string, string>;
  timestamp: Date;
  affectedUser?: {
    id?: string;
    email?: string;
  };
}
