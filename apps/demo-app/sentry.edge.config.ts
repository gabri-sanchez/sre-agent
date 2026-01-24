import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
  integrations: (integrations) =>
    integrations.filter((integration) => integration.name !== "Dedupe"),
  beforeSend(event) {
    const exception = event.exception?.values?.[0];
    console.log("[sentry][edge] sending event", {
      id: event.event_id,
      level: event.level,
      type: exception?.type,
      message: exception?.value,
    });
    return event;
  },
  debug: false,
});
