"use client";

import Link from "next/link";
import { ShoppingCart, User, Store, Settings } from "lucide-react";
import { useCart } from "@/lib/cart-context";

export function Navbar() {
  const { totalItems } = useCart();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <Store className="w-8 h-8 text-primary-600" />
            <span className="text-xl font-bold text-gray-900">TechStore</span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              href="/products"
              className="text-gray-600 hover:text-gray-900 font-medium"
            >
              Products
            </Link>
            <Link
              href="/cart"
              className="text-gray-600 hover:text-gray-900 font-medium"
            >
              Cart
            </Link>
          </div>

          {/* Right side icons */}
          <div className="flex items-center space-x-4">
            <Link
              href="/admin"
              className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
              title="Admin Panel"
            >
              <Settings className="w-5 h-5" />
            </Link>

            <Link
              href="/login"
              className="p-2 text-gray-600 hover:text-gray-900 rounded-full hover:bg-gray-100"
            >
              <User className="w-6 h-6" />
            </Link>

            <Link
              href="/cart"
              className="relative p-2 text-gray-600 hover:text-gray-900 rounded-full hover:bg-gray-100"
            >
              <ShoppingCart className="w-6 h-6" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
