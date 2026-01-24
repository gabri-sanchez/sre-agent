import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/navbar";
import { CartProvider } from "@/lib/cart-context";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "TechStore - Demo E-commerce",
  description: "A demo e-commerce store for showcasing Sentry error monitoring",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <CartProvider>
          <Navbar />
          <main className="min-h-screen pt-16">{children}</main>
        </CartProvider>
      </body>
    </html>
  );
}
