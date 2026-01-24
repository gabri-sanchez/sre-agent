"use client";

import { useEffect, useState } from "react";
import { ProductCard } from "@/components/product-card";
import { products, type Product } from "@/lib/mock-data";
import { triggerAPITimeoutError } from "@/lib/error-generators";
import { Loader2, AlertTriangle } from "lucide-react";

export default function ProductsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [loadedProducts, setLoadedProducts] = useState<Product[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [simulateTimeout, setSimulateTimeout] = useState(false);

  useEffect(() => {
    const loadProducts = async () => {
      setIsLoading(true);
      setError(null);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      if (simulateTimeout) {
        // Trigger API timeout error
        const apiError = triggerAPITimeoutError({
          endpoint: "/api/products",
          timeout: 30,
        });
        setError(apiError.message);
        setIsLoading(false);
        return;
      }

      setLoadedProducts(products);
      setIsLoading(false);
    };

    loadProducts();
  }, [simulateTimeout]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">All Products</h1>

        {/* Toggle to simulate timeout */}
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={simulateTimeout}
            onChange={(e) => setSimulateTimeout(e.target.checked)}
            className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
          />
          <span className="text-sm text-gray-600">
            Simulate API Timeout (Medium Error)
          </span>
        </label>
      </div>

      {isLoading && (
        <div className="flex flex-col items-center justify-center py-24">
          <Loader2 className="w-12 h-12 text-primary-600 animate-spin mb-4" />
          <p className="text-gray-500">Loading products...</p>
        </div>
      )}

      {error && (
        <div className="flex flex-col items-center justify-center py-24">
          <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center max-w-md">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-red-700 mb-2">
              Failed to Load Products
            </h2>
            <p className="text-red-600 text-sm mb-4">{error}</p>
            <button
              onClick={() => setSimulateTimeout(false)}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {!isLoading && !error && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {loadedProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
