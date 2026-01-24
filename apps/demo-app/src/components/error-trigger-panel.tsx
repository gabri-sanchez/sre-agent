"use client";

import { useState } from "react";
import {
  AlertTriangle,
  CreditCard,
  Shield,
  Server,
  Layout,
  Loader2,
} from "lucide-react";
import {
  triggerPaymentError,
  triggerAuthError,
  triggerAPITimeoutError,
  triggerUIRenderError,
} from "@/lib/error-generators";

interface ErrorTriggerProps {
  type: "payment" | "auth" | "api" | "ui";
  onTrigger: () => Promise<void>;
}

function ErrorButton({ type, onTrigger }: ErrorTriggerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [triggered, setTriggered] = useState(false);

  const config = {
    payment: {
      icon: CreditCard,
      label: "Payment Failure",
      severity: "Critical",
      color: "bg-red-600 hover:bg-red-700",
      severityColor: "text-red-600 bg-red-50",
    },
    auth: {
      icon: Shield,
      label: "Auth Error",
      severity: "High",
      color: "bg-orange-600 hover:bg-orange-700",
      severityColor: "text-orange-600 bg-orange-50",
    },
    api: {
      icon: Server,
      label: "API Timeout",
      severity: "Medium",
      color: "bg-yellow-600 hover:bg-yellow-700",
      severityColor: "text-yellow-600 bg-yellow-50",
    },
    ui: {
      icon: Layout,
      label: "UI Render Error",
      severity: "Low",
      color: "bg-blue-600 hover:bg-blue-700",
      severityColor: "text-blue-600 bg-blue-50",
    },
  };

  const { icon: Icon, label, severity, color, severityColor } = config[type];

  const handleClick = async () => {
    setIsLoading(true);
    try {
      await onTrigger();
      setTriggered(true);
      setTimeout(() => setTriggered(false), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${severityColor}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{label}</h3>
            <span className={`text-xs font-medium px-2 py-0.5 rounded ${severityColor}`}>
              {severity}
            </span>
          </div>
        </div>
      </div>

      <button
        onClick={handleClick}
        disabled={isLoading}
        className={`w-full flex items-center justify-center gap-2 px-4 py-3 text-white font-medium rounded-lg transition-colors ${color} disabled:opacity-50`}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Triggering...
          </>
        ) : triggered ? (
          <>
            <AlertTriangle className="w-4 h-4" />
            Error Sent to Sentry!
          </>
        ) : (
          <>
            <AlertTriangle className="w-4 h-4" />
            Trigger Error
          </>
        )}
      </button>
    </div>
  );
}

export function ErrorTriggerPanel() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-amber-600 bg-amber-50 p-4 rounded-lg">
        <AlertTriangle className="w-5 h-5" />
        <p className="text-sm">
          These buttons will trigger real errors that are sent to Sentry.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ErrorButton
          type="payment"
          onTrigger={async () => {
            await new Promise((r) => setTimeout(r, 500));
            triggerPaymentError();
          }}
        />
        <ErrorButton
          type="auth"
          onTrigger={async () => {
            await new Promise((r) => setTimeout(r, 500));
            triggerAuthError();
          }}
        />
        <ErrorButton
          type="api"
          onTrigger={async () => {
            await new Promise((r) => setTimeout(r, 500));
            triggerAPITimeoutError();
          }}
        />
        <ErrorButton
          type="ui"
          onTrigger={async () => {
            await new Promise((r) => setTimeout(r, 500));
            triggerUIRenderError();
          }}
        />
      </div>
    </div>
  );
}
