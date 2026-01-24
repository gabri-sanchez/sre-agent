import { serve } from "@hono/node-server";
import app from "./app";
import { config } from "./config";

const port = config.server.port;

console.log(`
╔═══════════════════════════════════════════════════════════╗
║                    SRE Agent Backend                       ║
╠═══════════════════════════════════════════════════════════╣
║  Environment: ${config.server.nodeEnv.padEnd(40)}║
║  Port: ${port.toString().padEnd(47)}║
║  Base URL: ${config.server.baseUrl.padEnd(43)}║
╚═══════════════════════════════════════════════════════════╝
`);

console.log("Endpoints:");
console.log(`  GET  /health         - Health check`);
console.log(`  POST /webhook/sentry - Sentry webhook receiver`);
console.log(`  POST /twilio/voice   - Twilio voice TwiML`);
console.log(`  POST /twilio/gather  - Twilio gather response`);
console.log(`  POST /twilio/status  - Twilio status callback`);
console.log(`  GET  /reports/:id    - View diagnostic report`);
console.log("");

serve({
  fetch: app.fetch,
  port,
});

console.log(`Server running at http://localhost:${port}`);

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down...");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("SIGINT received, shutting down...");
  process.exit(0);
});
