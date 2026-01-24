import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";
import { createHmac, timingSafeEqual } from "crypto";
import { config } from "../config";
import type { SentryWebhookPayload } from "@sre-agent/shared";

type SentryVariables = {
  rawBody: string;
  parsedBody: SentryWebhookPayload;
};

export const verifySentrySignature = createMiddleware<{
  Variables: SentryVariables;
}>(async (c, next) => {
  const signature = c.req.header("sentry-hook-signature");
  const timestamp = c.req.header("sentry-hook-timestamp");
  const resource = c.req.header("sentry-hook-resource");

  if (!signature) {
    throw new HTTPException(401, { message: "Missing Sentry signature" });
  }

  // Get raw body for signature verification
  const rawBody = await c.req.text();

  // Verify signature using HMAC-SHA256
  const expectedSignature = createHmac("sha256", config.sentry.webhookSecret)
    .update(rawBody, "utf8")
    .digest("hex");

  try {
    const isValid = timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );

    if (!isValid) {
      console.error("Sentry signature verification failed", {
        received: signature.substring(0, 10) + "...",
        timestamp,
        resource,
      });
      throw new HTTPException(401, { message: "Invalid Sentry signature" });
    }
  } catch (error) {
    if (error instanceof HTTPException) throw error;
    // Handle length mismatch or other errors
    throw new HTTPException(401, { message: "Invalid Sentry signature" });
  }

  // Optionally verify timestamp to prevent replay attacks
  if (timestamp) {
    const webhookTime = parseInt(timestamp, 10) * 1000;
    const now = Date.now();
    const fiveMinutes = 5 * 60 * 1000;

    if (Math.abs(now - webhookTime) > fiveMinutes) {
      console.warn("Webhook timestamp outside acceptable range", {
        webhookTime: new Date(webhookTime).toISOString(),
        now: new Date(now).toISOString(),
      });
      // In production, you might want to reject old webhooks
      // throw new HTTPException(401, { message: "Webhook timestamp too old" });
    }
  }

  // Store parsed body for route handler
  c.set("rawBody", rawBody);
  c.set("parsedBody", JSON.parse(rawBody));

  await next();
});
