"use client";

import Image from "next/image";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useCart, type CartItem as CartItemType } from "@/lib/cart-context";

interface CartItemProps {
  item: CartItemType;
}

export function CartItem({ item }: CartItemProps) {
  const { updateQuantity, removeItem } = useCart();
  const { product, quantity } = item;

  return (
    <div className="flex items-center gap-4 py-4 border-b border-gray-100">
      <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
        <Image
          src={product.image}
          alt={product.name}
          fill
          className="object-cover"
        />
      </div>

      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-gray-900 truncate">{product.name}</h3>
        <p className="text-sm text-gray-500">${product.price.toFixed(2)}</p>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => updateQuantity(product.id, quantity - 1)}
          className="p-1 rounded-md hover:bg-gray-100 text-gray-500"
        >
          <Minus className="w-4 h-4" />
        </button>

        <span className="w-8 text-center font-medium">{quantity}</span>

        <button
          onClick={() => updateQuantity(product.id, quantity + 1)}
          className="p-1 rounded-md hover:bg-gray-100 text-gray-500"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <div className="text-right">
        <p className="font-semibold text-gray-900">
          ${(product.price * quantity).toFixed(2)}
        </p>
      </div>

      <button
        onClick={() => removeItem(product.id)}
        className="p-2 text-red-500 hover:bg-red-50 rounded-md"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}
