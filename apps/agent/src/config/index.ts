import { z } from "zod";

const envSchema = z.object({
  // Server
  PORT: z.string().default("3001"),
  BASE_URL: z.string().default("http://localhost:3001"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),

  // Demo App
  DEMO_APP_URL: z.string().default("http://localhost:3000"),

  // Anthropic
  ANTHROPIC_API_KEY: z.string(),

  // Daytona
  DAYTONA_API_KEY: z.string().optional(),

  // Sentry
  SENTRY_WEBHOOK_SECRET: z.string(),

  // Vapi
  VAPI_API_KEY: z.string(),
  VAPI_PHONE_NUMBER_ID: z.string(),
  VAPI_WEBHOOK_SECRET: z.string().optional(),

  // Diagnostic Context (optional)
  DATABASE_URL: z.string().optional(),
  REDIS_URL: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment variables:", parsed.error.flatten().fieldErrors);
  throw new Error("Invalid environment variables");
}

export const config = {
  server: {
    port: parseInt(parsed.data.PORT, 10),
    baseUrl: parsed.data.BASE_URL,
    nodeEnv: parsed.data.NODE_ENV,
  },
  demoApp: {
    url: parsed.data.DEMO_APP_URL,
  },
  anthropic: {
    apiKey: parsed.data.ANTHROPIC_API_KEY,
  },
  daytona: {
    apiKey: parsed.data.DAYTONA_API_KEY,
  },
  sentry: {
    webhookSecret: parsed.data.SENTRY_WEBHOOK_SECRET,
  },
  vapi: {
    apiKey: parsed.data.VAPI_API_KEY,
    phoneNumberId: parsed.data.VAPI_PHONE_NUMBER_ID,
    webhookSecret: parsed.data.VAPI_WEBHOOK_SECRET,
  },
  diagnostics: {
    databaseUrl: parsed.data.DATABASE_URL,
    redisUrl: parsed.data.REDIS_URL,
  },
};

export type Config = typeof config;
