import type { Severity } from "../types";

export const SEVERITY_LEVELS: readonly Severity[] = [
  "critical",
  "high",
  "medium",
  "low",
] as const;

export const SEVERITY_PRIORITY: Record<Severity, number> = {
  critical: 100,
  high: 75,
  medium: 50,
  low: 25,
};

export const SEVERITY_COLORS: Record<Severity, string> = {
  critical: "#dc2626", // red-600
  high: "#ea580c", // orange-600
  medium: "#ca8a04", // yellow-600
  low: "#2563eb", // blue-600
};
