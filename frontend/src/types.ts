export interface Product {
  id: number;
  name: string;
  brand: string;
  category: 'sneakers' | 'clothing' | 'bags';
  gender: 'male' | 'female' | 'unisex';
  price: number;
  description: string;
  images: string[];
  sizes: (string | number)[];
  stockBySize: Record<string, number>;
  isNew: boolean;
  isHot: boolean;
  inStock: boolean;
  totalStock?: number;
  createdAt: string;
}

export interface CartItem {
  product: Product;
  size: string | number;
  quantity: number;
}

export interface Order {
  id: number;
  customerName: string;
  phone: string;
  deliveryType: 'pickup' | 'delivery';
  address: string;
  paymentMethod: 'card' | 'cash';
  comment: string;
  items: OrderItem[];
  totalAmount: number;
  status: 'new' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: string;
}

export interface OrderItem {
  productId: number;
  productName: string;
  brand: string;
  size: string | number;
  quantity: number;
  price: number;
  image: string;
}

export type Category = 'all' | 'sneakers' | 'clothing' | 'bags';
export type Gender = 'all' | 'male' | 'female';
export type SortOption = 'new' | 'hot' | 'price_asc' | 'price_desc';
