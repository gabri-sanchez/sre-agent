import { Hono } from "hono";

const app = new Hono();

app.get("/health", (c) => {
  return c.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    service: "sre-agent",
  });
});

app.get("/", (c) => {
  return c.json({
    name: "SRE Agent Backend",
    version: "0.0.1",
    endpoints: {
      health: "/health",
      webhook: "/webhook/sentry",
      twilio: "/twilio/*",
    },
  });
});

export default app;
