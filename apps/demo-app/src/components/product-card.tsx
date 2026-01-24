"use client";

import Image from "next/image";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import type { Product } from "@/lib/mock-data";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart();

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
      <Link href={`/products/${product.id}`}>
        <div className="relative h-48 bg-gray-100">
          <Image
            src={product.image}
            alt={product.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          {!product.inStock && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="text-white font-semibold">Out of Stock</span>
            </div>
          )}
        </div>
      </Link>

      <div className="p-4">
        <Link href={`/products/${product.id}`}>
          <h3 className="font-semibold text-gray-900 hover:text-primary-600 transition-colors">
            {product.name}
          </h3>
        </Link>
        <p className="text-sm text-gray-500 mt-1 line-clamp-2">
          {product.description}
        </p>

        <div className="flex items-center justify-between mt-4">
          <span className="text-lg font-bold text-gray-900">
            ${product.price.toFixed(2)}
          </span>

          <button
            onClick={() => addItem(product)}
            disabled={!product.inStock}
            className="flex items-center space-x-1 px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            <ShoppingCart className="w-4 h-4" />
            <span className="text-sm font-medium">Add</span>
          </button>
        </div>
      </div>
    </div>
  );
}
