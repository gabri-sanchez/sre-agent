"use client";

import Link from "next/link";
import { ArrowLeft, CreditCard, AlertTriangle } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { CheckoutForm } from "@/components/checkout-form";

export default function CheckoutPage() {
  const { items, totalPrice } = useCart();

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center py-24">
          <CreditCard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Nothing to checkout
          </h1>
          <p className="text-gray-500 mb-8">
            Add some products to your cart first
          </p>
          <Link
            href="/products"
            className="text-primary-600 hover:text-primary-700 font-medium"
          >
            Browse Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Link
        href="/cart"
        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Cart
      </Link>

      <div className="grid lg:grid-cols-2 gap-12">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>

          {/* Warning about demo error */}
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-amber-800 font-medium">
                  Demo Notice: Payment will fail
                </p>
                <p className="text-sm text-amber-700 mt-1">
                  Clicking &quot;Complete Purchase&quot; will trigger a{" "}
                  <span className="font-semibold text-red-600">
                    Critical Payment Error
                  </span>{" "}
                  that will be sent to Sentry and may trigger an on-call alert.
                </p>
              </div>
            </div>
          </div>

          <CheckoutForm />
        </div>

        <div>
          <div className="bg-gray-50 rounded-xl p-6 sticky top-24">
            <h2 className="text-lg font-semibold mb-4">Order Summary</h2>

            <div className="space-y-4 mb-6">
              {items.map((item) => (
                <div
                  key={item.product.id}
                  className="flex items-center gap-4"
                >
                  <div className="w-16 h-16 bg-gray-200 rounded-lg" />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">
                      {item.product.name}
                    </p>
                    <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                  </div>
                  <p className="font-medium">
                    ${(item.product.price * item.quantity).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>

            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>${totalPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Shipping</span>
                <span>Free</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Tax</span>
                <span>${(totalPrice * 0.08).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-semibold pt-2 border-t">
                <span>Total</span>
                <span>${(totalPrice * 1.08).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
