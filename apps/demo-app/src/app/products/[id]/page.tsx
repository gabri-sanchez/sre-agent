"use client";

import { use } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ShoppingCart, AlertTriangle } from "lucide-react";
import { getProduct } from "@/lib/mock-data";
import { useCart } from "@/lib/cart-context";
import { triggerUIRenderError } from "@/lib/error-generators";

interface Props {
  params: Promise<{ id: string }>;
}

export default function ProductDetailPage({ params }: Props) {
  const { id } = use(params);
  const product = getProduct(id);
  const { addItem } = useCart();

  // Simulate UI render error for a specific "broken" product
  if (id === "broken_product") {
    const error = triggerUIRenderError({
      component: "ProductDetailPage",
      props: { productId: id },
    });

    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-red-700 mb-2">
            Render Error
          </h2>
          <p className="text-red-600 text-sm mb-4">{error.message}</p>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 text-red-600 hover:text-red-700"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Products
          </Link>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center py-24">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Product Not Found
          </h1>
          <Link
            href="/products"
            className="text-primary-600 hover:text-primary-700 font-medium"
          >
            Browse all products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Link
        href="/products"
        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Products
      </Link>

      <div className="grid md:grid-cols-2 gap-12">
        <div className="relative aspect-square rounded-xl overflow-hidden bg-gray-100">
          <Image
            src={product.image}
            alt={product.name}
            fill
            className="object-cover"
            priority
          />
        </div>

        <div>
          <div className="mb-4">
            <span className="text-sm text-primary-600 font-medium">
              {product.category}
            </span>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            {product.name}
          </h1>

          <p className="text-gray-600 text-lg mb-6">{product.description}</p>

          <div className="flex items-center gap-4 mb-8">
            <span className="text-3xl font-bold text-gray-900">
              ${product.price.toFixed(2)}
            </span>
            {product.inStock ? (
              <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full">
                In Stock
              </span>
            ) : (
              <span className="px-3 py-1 bg-red-100 text-red-700 text-sm font-medium rounded-full">
                Out of Stock
              </span>
            )}
          </div>

          <button
            onClick={() => addItem(product)}
            disabled={!product.inStock}
            className="w-full md:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            <ShoppingCart className="w-5 h-5" />
            Add to Cart
          </button>

          {/* Link to trigger UI error */}
          <div className="mt-8 pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-500 mb-2">Demo: Trigger UI Error</p>
            <Link
              href="/products/broken_product"
              className="text-sm text-red-600 hover:text-red-700"
            >
              View Broken Product Page (Low Severity)
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
