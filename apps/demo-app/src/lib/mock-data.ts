export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  inStock: boolean;
}

export const products: Product[] = [
  {
    id: "prod_001",
    name: "Wireless Headphones Pro",
    description:
      "Premium noise-cancelling wireless headphones with 30-hour battery life",
    price: 299.99,
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop",
    category: "Electronics",
    inStock: true,
  },
  {
    id: "prod_002",
    name: "Smart Watch Series X",
    description:
      "Advanced fitness tracking, heart rate monitoring, and notifications",
    price: 449.99,
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop",
    category: "Electronics",
    inStock: true,
  },
  {
    id: "prod_003",
    name: "Laptop Stand Aluminum",
    description: "Ergonomic aluminum laptop stand with adjustable height",
    price: 79.99,
    image: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400&h=400&fit=crop",
    category: "Accessories",
    inStock: true,
  },
  {
    id: "prod_004",
    name: "Mechanical Keyboard RGB",
    description: "Compact mechanical keyboard with customizable RGB lighting",
    price: 159.99,
    image: "https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?w=400&h=400&fit=crop",
    category: "Electronics",
    inStock: true,
  },
  {
    id: "prod_005",
    name: "USB-C Hub 7-in-1",
    description: "Multi-port USB-C hub with HDMI, USB-A, and card reader",
    price: 59.99,
    image: "https://images.unsplash.com/photo-1625723044792-44de16ccb4e9?w=400&h=400&fit=crop",
    category: "Accessories",
    inStock: true,
  },
  {
    id: "prod_006",
    name: "Wireless Mouse Ergonomic",
    description: "Ergonomic wireless mouse with precision tracking",
    price: 89.99,
    image: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400&h=400&fit=crop",
    category: "Accessories",
    inStock: false,
  },
  {
    id: "prod_007",
    name: "4K Monitor 27-inch",
    description: "Ultra HD 4K monitor with HDR support and 144Hz refresh rate",
    price: 599.99,
    image: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=400&h=400&fit=crop",
    category: "Electronics",
    inStock: true,
  },
  {
    id: "prod_008",
    name: "Webcam HD Pro",
    description: "1080p HD webcam with auto-focus and noise-cancelling mic",
    price: 129.99,
    image: "https://images.unsplash.com/photo-1587826080692-f439cd0b70da?w=400&h=400&fit=crop",
    category: "Electronics",
    inStock: true,
  },
];

export function getProduct(id: string): Product | undefined {
  return products.find((p) => p.id === id);
}

export interface User {
  id: string;
  email: string;
  name: string;
}

export const mockUsers: User[] = [
  { id: "user_001", email: "alice@example.com", name: "Alice Johnson" },
  { id: "user_002", email: "bob@example.com", name: "Bob Smith" },
  { id: "user_003", email: "carol@example.com", name: "Carol Williams" },
];
