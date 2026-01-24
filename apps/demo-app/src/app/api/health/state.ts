// In-memory state for service health status
// This is shared across all API routes in the same process

const serviceHealthState: Record<string, boolean> = {
  payments: true,
  auth: true,
  api: true,
  ui: true,
};

export function getServiceHealth(service: string): boolean {
  return serviceHealthState[service] ?? true;
}

export function setServiceHealth(service: string, healthy: boolean): void {
  serviceHealthState[service] = healthy;
}

export function getAllServiceHealth(): Record<string, boolean> {
  return { ...serviceHealthState };
}

export function resetAllServiceHealth(): void {
  serviceHealthState.payments = true;
  serviceHealthState.auth = true;
  serviceHealthState.api = true;
  serviceHealthState.ui = true;
}
