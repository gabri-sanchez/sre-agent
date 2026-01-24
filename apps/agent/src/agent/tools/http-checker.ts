import { tool } from "@langchain/core/tools";
import { z } from "zod";

interface HttpCheckResult {
  status: number;
  latency: number;
  error?: string;
}

async function checkHttpEndpoint(
  url: string,
  method: string = "GET"
): Promise<HttpCheckResult> {
  const startTime = Date.now();

  try {
    const response = await fetch(url, {
      method,
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    const latency = Date.now() - startTime;

    return {
      status: response.status,
      latency,
    };
  } catch (error) {
    const latency = Date.now() - startTime;
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    return {
      status: 0,
      latency,
      error: errorMessage,
    };
  }
}

export const httpCheckerTool = tool(
  async ({ url, method }) => {
    console.log(`Checking HTTP endpoint: ${method} ${url}`);

    const result = await checkHttpEndpoint(url, method);

    if (result.error) {
      return `FAILED: ${url}\nError: ${result.error}\nLatency: ${result.latency}ms`;
    }

    const statusCategory =
      result.status >= 200 && result.status < 300
        ? "OK"
        : result.status >= 400 && result.status < 500
          ? "CLIENT_ERROR"
          : result.status >= 500
            ? "SERVER_ERROR"
            : "UNKNOWN";

    return `${statusCategory}: ${url}\nStatus: ${result.status}\nLatency: ${result.latency}ms`;
  },
  {
    name: "check_http_endpoint",
    description:
      "Check if an HTTP endpoint is responding and measure latency. Use for health checks of external services.",
    schema: z.object({
      url: z.string().describe("URL to check"),
      method: z
        .enum(["GET", "HEAD", "POST"])
        .default("GET")
        .describe("HTTP method to use"),
    }),
  }
);
