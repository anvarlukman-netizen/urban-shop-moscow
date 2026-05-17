import { tg } from '../hooks/useTelegram';
import type { Product, Order, Review } from '../types';

const BASE_URL = import.meta.env.VITE_API_URL || '/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'x-telegram-init-data': tg?.initData ?? '',
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Network error' }));
    throw new Error(err.error || 'Request failed');
  }

  return res.json();
}

// Products
export const api = {
  getProducts: (params: Record<string, string>) => {
    const qs = new URLSearchParams(params).toString();
    return request<Product[]>(`/products?${qs}`);
  },

  getProduct: (id: number) =>
    request<{ product: Product; related: Product[] }>(`/products/${id}`),

  getBrands: () => request<string[]>('/products/brands'),

  // Orders
  createOrder: (data: object) =>
    request<{ success: boolean; orderId: number }>('/orders', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getMyOrders: () => request<Order[]>('/orders/my'),

  // Favourites
  getFavourites: () => request<Product[]>('/favourites'),

  toggleFavourite: (productId: number) =>
    request<{ action: 'added' | 'removed' }>(`/favourites/${productId}`, {
      method: 'POST',
    }),

  // Reviews
  getReviews: () => request<Review[]>('/reviews'),

  createReview: (data: { customerName: string; rating: number; text: string }) =>
    request<Review>('/reviews', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};
