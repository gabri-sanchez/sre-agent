import { Settings } from "lucide-react";
import { ErrorTriggerPanel } from "@/components/error-trigger-panel";
import { HealthTogglePanel } from "@/components/health-toggle-panel";

export default function AdminPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-center gap-3 mb-8">
        <Settings className="w-8 h-8 text-primary-600" />
        <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
      </div>

      <div className="space-y-8">
        {/* Service Health Section */}
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Service Health Controls
          </h2>
          <p className="text-gray-600 mb-6">
            Toggle service health status to simulate outages. When a service is
            marked as DOWN, its health endpoint will return 503. The SRE agent
            uses these endpoints to verify service status during diagnostics.
          </p>
          <HealthTogglePanel />
        </section>

        {/* Error Trigger Section */}
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Error Triggers
          </h2>
          <p className="text-gray-600 mb-6">
            Use these controls to manually trigger different types of errors.
            Each error will be captured by Sentry with appropriate service and
            severity tags, potentially triggering the on-call agent workflow.
          </p>
          <ErrorTriggerPanel />
        </section>

        {/* Error Type Descriptions */}
        <section className="bg-gray-50 rounded-xl p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Error Types
          </h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-red-600">
                Payment Failure (Critical)
              </h3>
              <p className="text-sm text-gray-600">
                Simulates a payment gateway timeout. This triggers an immediate
                call to the payments on-call engineer as it directly impacts
                revenue.
              </p>
            </div>
            <div>
              <h3 className="font-medium text-orange-600">
                Auth Error (High)
              </h3>
              <p className="text-sm text-gray-600">
                Simulates an authentication failure. This may trigger a call if
                multiple users are affected or if frequency threshold is
                exceeded.
              </p>
            </div>
            <div>
              <h3 className="font-medium text-yellow-600">
                API Timeout (Medium)
              </h3>
              <p className="text-sm text-gray-600">
                Simulates an API request timeout. This is logged and monitored
                but typically doesn&apos;t trigger an immediate call unless
                frequency is high.
              </p>
            </div>
            <div>
              <h3 className="font-medium text-blue-600">
                UI Render Error (Low)
              </h3>
              <p className="text-sm text-gray-600">
                Simulates a React component rendering error. This is logged for
                review but doesn&apos;t trigger on-call alerts.
              </p>
            </div>
          </div>
        </section>

        {/* On-Call Agent Info */}
        <section className="bg-primary-50 rounded-xl p-6">
          <h2 className="text-xl font-semibold text-primary-900 mb-4">
            On-Call Agent Workflow
          </h2>
          <ol className="list-decimal list-inside space-y-2 text-primary-800">
            <li>
              Error is captured by Sentry with service and severity tags
            </li>
            <li>Sentry sends a webhook to the agent backend</li>
            <li>
              LangGraph agent analyzes the error and runs diagnostic tests
            </li>
            <li>
              Agent determines routing based on severity and diagnostic results
            </li>
            <li>
              If action is CALL, Twilio initiates a call to the on-call engineer
            </li>
            <li>
              Engineer receives context and can acknowledge via keypress
            </li>
          </ol>
        </section>
      </div>
    </div>
  );
}
