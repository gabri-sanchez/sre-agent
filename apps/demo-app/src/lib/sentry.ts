import * as Sentry from "@sentry/nextjs";
import type { Service, Severity } from "@sre-agent/shared";

export function captureServiceError(
  service: Service,
  severity: Severity,
  error: Error,
  extra?: Record<string, unknown>
) {
  Sentry.withScope((scope) => {
    scope.setTag("service", service);
    scope.setTag("severity", severity);
    scope.setLevel(severityToSentryLevel(severity));

    if (extra) {
      Object.entries(extra).forEach(([key, value]) => {
        scope.setExtra(key, value);
      });
    }

    Sentry.captureException(error);
  });
}

function severityToSentryLevel(severity: Severity): Sentry.SeverityLevel {
  switch (severity) {
    case "critical":
      return "fatal";
    case "high":
      return "error";
    case "medium":
      return "warning";
    case "low":
      return "info";
  }
}

export function setUserContext(userId: string, email?: string) {
  Sentry.setUser({
    id: userId,
    email,
  });
}

export function clearUserContext() {
  Sentry.setUser(null);
}
