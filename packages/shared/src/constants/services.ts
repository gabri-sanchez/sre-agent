import type { Service } from "../types";

export const SERVICES: readonly Service[] = [
  "payments",
  "auth",
  "api",
  "ui",
] as const;

export const SERVICE_METADATA: Record<
  Service,
  { displayName: string; icon: string; color: string }
> = {
  payments: {
    displayName: "Payments",
    icon: "credit-card",
    color: "#10b981", // emerald-500
  },
  auth: {
    displayName: "Authentication",
    icon: "shield",
    color: "#8b5cf6", // violet-500
  },
  api: {
    displayName: "API",
    icon: "server",
    color: "#3b82f6", // blue-500
  },
  ui: {
    displayName: "UI",
    icon: "layout",
    color: "#f59e0b", // amber-500
  },
};
