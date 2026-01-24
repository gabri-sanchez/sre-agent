import { captureServiceError } from "./sentry";

// Custom error classes for better stack traces
class PaymentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PaymentError";
  }
}

class AuthenticationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthenticationError";
  }
}

class APITimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "APITimeoutError";
  }
}

class UIRenderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UIRenderError";
  }
}

export function triggerPaymentError(extra?: {
  amount?: number;
  userId?: string;
  transactionId?: string;
}) {
  const error = new PaymentError(
    "Payment gateway timeout: Unable to process transaction. The payment provider did not respond within the expected timeframe."
  );

  captureServiceError("payments", "critical", error, {
    amount: extra?.amount ?? 299.99,
    userId: extra?.userId ?? "user_anonymous",
    transactionId: extra?.transactionId ?? `txn_${Date.now()}`,
    gateway: "stripe",
    failureReason: "timeout",
  });

  return error;
}

export function triggerAuthError(extra?: {
  email?: string;
  attemptCount?: number;
}) {
  const error = new AuthenticationError(
    "Authentication failed: Invalid credentials or session expired. Please try logging in again."
  );

  captureServiceError("auth", "high", error, {
    email: extra?.email ?? "user@example.com",
    attemptCount: extra?.attemptCount ?? 3,
    authMethod: "email_password",
    failureReason: "invalid_credentials",
  });

  return error;
}

export function triggerAPITimeoutError(extra?: {
  endpoint?: string;
  timeout?: number;
}) {
  const error = new APITimeoutError(
    `API request timeout: The request to ${extra?.endpoint ?? "/api/products"} exceeded the maximum allowed time of ${extra?.timeout ?? 30}s.`
  );

  captureServiceError("api", "medium", error, {
    endpoint: extra?.endpoint ?? "/api/products",
    timeout: extra?.timeout ?? 30000,
    method: "GET",
    failureReason: "timeout",
  });

  return error;
}

export function triggerUIRenderError(extra?: {
  component?: string;
  props?: Record<string, unknown>;
}) {
  const error = new UIRenderError(
    `React render error: Failed to render ${extra?.component ?? "ProductCard"} component. Received undefined data where object was expected.`
  );

  captureServiceError("ui", "low", error, {
    component: extra?.component ?? "ProductCard",
    props: extra?.props ?? { productId: undefined },
    reactVersion: "18.3.1",
    failureReason: "undefined_prop",
  });

  return error;
}
