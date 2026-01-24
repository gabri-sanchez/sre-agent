import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
  replaysSessionSampleRate: 1.0,
  replaysOnErrorSampleRate: 1.0,
  integrations: (integrations) => {
    const filtered = integrations.filter(
      (integration) => integration.name !== "Dedupe"
    );

    if (!filtered.some((integration) => integration.name === "Replay")) {
      filtered.push(Sentry.replayIntegration());
    }

    return filtered;
  },
  beforeSend(event) {
    const exception = event.exception?.values?.[0];
    console.log("[sentry][client] sending event", {
      id: event.event_id,
      level: event.level,
      type: exception?.type,
      message: exception?.value,
    });
    return event;
  },
  debug: false,
});
