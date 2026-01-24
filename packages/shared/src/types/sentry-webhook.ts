export interface SentryWebhookPayload {
  action: "created" | "resolved" | "assigned" | "archived" | "unresolved";
  installation: {
    uuid: string;
  };
  data: {
    issue: SentryIssue;
    event?: SentryEvent;
  };
  actor: {
    type: "user" | "application" | "sentry";
    id?: string;
    name: string;
  };
}

export interface SentryIssue {
  id: string;
  shortId: string;
  title: string;
  culprit: string;
  permalink: string;
  logger: string | null;
  level: "fatal" | "error" | "warning" | "info" | "debug";
  status: "unresolved" | "resolved" | "ignored";
  statusDetails: Record<string, unknown>;
  isPublic: boolean;
  platform: string;
  project: {
    id: string;
    name: string;
    slug: string;
    platform: string;
  };
  type: string;
  metadata: {
    value: string;
    type: string;
    filename?: string;
    function?: string;
  };
  numComments: number;
  userCount: number;
  count: string;
  firstSeen: string;
  lastSeen: string;
  tags: Array<{
    key: string;
    value: string;
    name: string;
  }>;
}

export interface SentryEvent {
  event_id: string;
  context?: Record<string, unknown>;
  contexts?: {
    browser?: { name: string; version: string };
    os?: { name: string; version: string };
  };
  exception?: {
    values: Array<{
      type: string;
      value: string;
      stacktrace?: {
        frames: Array<{
          filename: string;
          function: string;
          lineno: number;
          colno: number;
        }>;
      };
    }>;
  };
  user?: {
    id?: string;
    email?: string;
    username?: string;
    ip_address?: string;
  };
  tags: Array<[string, string]>;
}

export interface SentryMetricAlertPayload {
  action: "critical" | "warning" | "resolved";
  installation: {
    uuid: string;
  };
  data: {
    description_text: string;
    description_title: string;
    web_url: string;
    metric_alert: {
      id: number;
      alert_rule: {
        id: number;
        name: string;
        aggregate: string;
        query: string;
        dataset: string;
        environment: string | null;
        time_window: number;
        threshold_type: number;
        triggers: Array<{
          id: number;
          label: string;
          threshold_type: number;
          alert_threshold: number;
          actions: Array<{
            id: number;
            type: string;
            target_type: string;
          }>;
        }>;
      };
      status: number;
      date_started: string;
      date_closed: string | null;
    };
  };
  actor: {
    type: "application";
    id: string;
    name: string;
  };
}
