import type {
  SentryWebhookPayload,
  ErrorContext,
  Service,
  Severity,
} from "@sre-agent/shared";
import { frequencyTracker } from "./frequency-tracker";

export async function enrichErrorContext(
  payload: SentryWebhookPayload
): Promise<ErrorContext> {
  const { issue, event } = payload.data;

  // Extract service and severity from tags
  const serviceTags = issue.tags.filter((t) => t.key === "service");
  const severityTags = issue.tags.filter((t) => t.key === "severity");

  const service = (serviceTags[0]?.value as Service) || inferService(issue.title);
  const severity = (severityTags[0]?.value as Severity) || inferSeverity(issue.level);

  // Extract stack trace
  let stackTrace = "";
  if (event?.exception?.values) {
    stackTrace = event.exception.values
      .map((e) => {
        let trace = `${e.type}: ${e.value}`;
        if (e.stacktrace?.frames) {
          trace +=
            "\n" +
            e.stacktrace.frames
              .slice(-10) // Last 10 frames
              .map(
                (f) =>
                  `  at ${f.function || "anonymous"} (${f.filename}:${f.lineno}:${f.colno})`
              )
              .join("\n");
        }
        return trace;
      })
      .join("\n\n");
  }

  // Track frequency
  const errorType = issue.metadata.type || issue.type;
  const frequency = frequencyTracker.record(service, errorType, issue.id);

  const context: ErrorContext = {
    id: `ctx_${Date.now()}`,
    sentryEventId: event?.event_id || "",
    sentryIssueId: issue.id,
    title: issue.title,
    message: issue.metadata.value || issue.title,
    service,
    severity,
    level: issue.level,
    stackTrace,
    userCount: issue.userCount,
    occurrenceCount: parseInt(issue.count, 10),
    frequencyLast10Min: frequency.count,
    permalink: issue.permalink,
    tags: Object.fromEntries(issue.tags.map((t) => [t.key, t.value])),
    timestamp: new Date(issue.lastSeen),
    affectedUser: event?.user
      ? {
          id: event.user.id,
          email: event.user.email,
        }
      : undefined,
  };

  return context;
}

function inferService(title: string): Service {
  const lowerTitle = title.toLowerCase();
  if (
    lowerTitle.includes("payment") ||
    lowerTitle.includes("stripe") ||
    lowerTitle.includes("transaction")
  ) {
    return "payments";
  }
  if (
    lowerTitle.includes("auth") ||
    lowerTitle.includes("login") ||
    lowerTitle.includes("session")
  ) {
    return "auth";
  }
  if (
    lowerTitle.includes("api") ||
    lowerTitle.includes("timeout") ||
    lowerTitle.includes("request")
  ) {
    return "api";
  }
  return "ui";
}

function inferSeverity(level: string): Severity {
  switch (level) {
    case "fatal":
      return "critical";
    case "error":
      return "high";
    case "warning":
      return "medium";
    default:
      return "low";
  }
}
