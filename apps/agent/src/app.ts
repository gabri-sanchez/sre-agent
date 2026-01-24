import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import webhookRoutes from "./routes/webhook";
import twilioRoutes from "./routes/twilio";
import healthRoutes from "./routes/health";
import reportRoutes from "./routes/reports";

const app = new Hono();

// Middleware
app.use("*", logger());
app.use("*", cors());

// Routes
app.route("/webhook", webhookRoutes);
app.route("/twilio", twilioRoutes);
app.route("/reports", reportRoutes);
app.route("/", healthRoutes);

// 404 handler
app.notFound((c) => {
  return c.json({ error: "Not Found" }, 404);
});

// Error handler
app.onError((err, c) => {
  console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.error("Unhandled error:", err.message);
  console.error("Path:", c.req.path);
  console.error("Method:", c.req.method);
  if (err.stack) {
    console.error("Stack trace:");
    console.error(err.stack);
  }
  console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  return c.json({ error: "Internal Server Error", message: err.message }, 500);
});

export default app;
