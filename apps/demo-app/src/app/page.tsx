import Link from "next/link";
import { ArrowRight, Shield, Zap, Phone } from "lucide-react";
import { ProductCard } from "@/components/product-card";
import { products } from "@/lib/mock-data";

export default function HomePage() {
  const featuredProducts = products.slice(0, 4);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-600 to-primary-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Welcome to TechStore
            </h1>
            <p className="text-xl md:text-2xl text-primary-100 mb-8 max-w-2xl mx-auto">
              Demo e-commerce store showcasing intelligent on-call incident response
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/products"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-primary-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
              >
                Browse Products
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/admin"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-primary-700 text-white font-semibold rounded-lg hover:bg-primary-900 transition-colors border border-primary-500"
              >
                Error Controls
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">1. Error Occurs</h3>
              <p className="text-gray-600">
                Trigger errors through the e-commerce flow or admin panel. Errors
                are captured by Sentry with service and severity tags.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">2. Agent Analyzes</h3>
              <p className="text-gray-600">
                Our LangGraph agent receives the error, runs diagnostic tests,
                and determines severity based on impact and frequency.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Phone className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">3. Engineer Called</h3>
              <p className="text-gray-600">
                Critical errors trigger a phone call to the on-call engineer with
                AI-generated context and diagnostic findings.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold">Featured Products</h2>
            <Link
              href="/products"
              className="text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
            >
              View All
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
