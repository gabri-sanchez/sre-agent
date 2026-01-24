"use client";

import { useState, useEffect } from "react";
import {
  Activity,
  CreditCard,
  Shield,
  Server,
  Layout,
  RefreshCw,
  Loader2,
} from "lucide-react";

interface ServiceHealth {
  payments: boolean;
  auth: boolean;
  api: boolean;
  ui: boolean;
}

const SERVICE_CONFIG = {
  payments: {
    icon: CreditCard,
    label: "Payment Gateway",
    endpoint: "/api/health/payments",
  },
  auth: {
    icon: Shield,
    label: "Authentication",
    endpoint: "/api/health/auth",
  },
  api: {
    icon: Server,
    label: "Core API",
    endpoint: "/api/health/api",
  },
  ui: {
    icon: Layout,
    label: "UI Service",
    endpoint: "/api/health/ui",
  },
} as const;

type ServiceKey = keyof typeof SERVICE_CONFIG;

function HealthToggle({
  service,
  healthy,
  onToggle,
  isLoading,
}: {
  service: ServiceKey;
  healthy: boolean;
  onToggle: (service: ServiceKey, healthy: boolean) => void;
  isLoading: boolean;
}) {
  const config = SERVICE_CONFIG[service];
  const Icon = config.icon;

  return (
    <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200">
      <div className="flex items-center gap-3">
        <div
          className={`p-2 rounded-lg ${healthy ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"}`}
        >
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-medium text-gray-900">{config.label}</h3>
          <code className="text-xs text-gray-500">{config.endpoint}</code>
        </div>
      </div>

      <button
        onClick={() => onToggle(service, !healthy)}
        disabled={isLoading}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
          healthy
            ? "bg-green-500 focus:ring-green-500"
            : "bg-red-500 focus:ring-red-500"
        } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            healthy ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );
}

export function HealthTogglePanel() {
  const [health, setHealth] = useState<ServiceHealth>({
    payments: true,
    auth: true,
    api: true,
    ui: true,
  });
  const [loading, setLoading] = useState<ServiceKey | "all" | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch initial health state
  useEffect(() => {
    fetchHealthState();
  }, []);

  const fetchHealthState = async () => {
    try {
      const response = await fetch("/api/health/control");
      if (response.ok) {
        const data = await response.json();
        setHealth(data.services);
      }
    } catch {
      console.error("Failed to fetch health state");
    }
  };

  const handleToggle = async (service: ServiceKey, healthy: boolean) => {
    setLoading(service);
    setError(null);

    try {
      const response = await fetch("/api/health/control", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ service, healthy }),
      });

      if (response.ok) {
        const data = await response.json();
        setHealth(data.allServices);
      } else {
        setError("Failed to update service health");
      }
    } catch {
      setError("Network error updating service health");
    } finally {
      setLoading(null);
    }
  };

  const handleResetAll = async () => {
    setLoading("all");
    setError(null);

    try {
      const response = await fetch("/api/health/control", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reset: true }),
      });

      if (response.ok) {
        const data = await response.json();
        setHealth(data.services);
      } else {
        setError("Failed to reset services");
      }
    } catch {
      setError("Network error resetting services");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-gray-600" />
          <span className="font-medium text-gray-900">Service Health</span>
        </div>
        <button
          onClick={handleResetAll}
          disabled={loading === "all"}
          className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
        >
          {loading === "all" ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          Reset All
        </button>
      </div>

      {error && (
        <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {(Object.keys(SERVICE_CONFIG) as ServiceKey[]).map((service) => (
          <HealthToggle
            key={service}
            service={service}
            healthy={health[service]}
            onToggle={handleToggle}
            isLoading={loading === service}
          />
        ))}
      </div>

      <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
        <strong>Tip:</strong> Toggle a service to DOWN, then trigger an error
        for that service. The SRE agent will detect the failed health check and
        escalate accordingly.
      </div>
    </div>
  );
}
