"use client";

import { useState } from "react";
import { CreditCard, Loader2 } from "lucide-react";
import { triggerPaymentError } from "@/lib/error-generators";
import { useCart } from "@/lib/cart-context";

export function CheckoutForm() {
  const { totalPrice, items } = useCart();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setError(null);

    // Simulate payment processing delay
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Trigger payment error for demo
    const paymentError = triggerPaymentError({
      amount: totalPrice,
      transactionId: `txn_${Date.now()}`,
    });

    setIsProcessing(false);
    setError(paymentError.message);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Card Number
        </label>
        <input
          type="text"
          placeholder="4242 4242 4242 4242"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          defaultValue="4242 4242 4242 4242"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Expiry Date
          </label>
          <input
            type="text"
            placeholder="MM/YY"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            defaultValue="12/25"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            CVC
          </label>
          <input
            type="text"
            placeholder="123"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            defaultValue="123"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Name on Card
        </label>
        <input
          type="text"
          placeholder="John Doe"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          defaultValue="John Doe"
        />
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <div className="border-t border-gray-200 pt-4">
        <div className="flex justify-between text-lg font-semibold mb-4">
          <span>Total</span>
          <span>${totalPrice.toFixed(2)}</span>
        </div>

        <button
          type="submit"
          disabled={isProcessing || items.length === 0}
          className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <CreditCard className="w-5 h-5" />
              Complete Purchase
            </>
          )}
        </button>
      </div>
    </form>
  );
}
