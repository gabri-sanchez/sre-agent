import { config } from "./index";

export interface ServiceHealthEndpoint {
  service: string;
  endpoint: string;
  description: string;
}

const SERVICE_HEALTH_ENDPOINTS: Record<string, ServiceHealthEndpoint> = {
  payments: {
    service: "payments",
    endpoint: "/api/health/payments",
    description: "Payment Gateway Health",
  },
  auth: {
    service: "auth",
    endpoint: "/api/health/auth",
    description: "Authentication Service Health",
  },
  api: {
    service: "api",
    endpoint: "/api/health/api",
    description: "Core API Health",
  },
  ui: {
    service: "ui",
    endpoint: "/api/health/ui",
    description: "UI Service Health",
  },
};

/**
 * Get the full health check URL for a service
 */
export function getHealthEndpointUrl(service: string): string | null {
  const endpoint = SERVICE_HEALTH_ENDPOINTS[service.toLowerCase()];
  if (!endpoint) return null;
  return `${config.demoApp.url}${endpoint.endpoint}`;
}

/**
 * Get health endpoint details for a service
 */
export function getHealthEndpointForService(
  service: string
): ServiceHealthEndpoint | null {
  return SERVICE_HEALTH_ENDPOINTS[service.toLowerCase()] || null;
}

/**
 * Get all health endpoints formatted for the diagnostic prompt
 */
export function getHealthEndpointsForPrompt(service?: string): string {
  const baseUrl = config.demoApp.url;

  if (service) {
    const endpoint = SERVICE_HEALTH_ENDPOINTS[service.toLowerCase()];
    if (endpoint) {
      return `- ${endpoint.description}: ${baseUrl}${endpoint.endpoint}`;
    }
  }

  // Return all endpoints if no specific service or service not found
  return Object.values(SERVICE_HEALTH_ENDPOINTS)
    .map((e) => `- ${e.description}: ${baseUrl}${e.endpoint}`)
    .join("\n");
}

export { SERVICE_HEALTH_ENDPOINTS };
