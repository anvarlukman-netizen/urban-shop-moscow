import { sqliteTable, integer, text, real } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const products = sqliteTable('products', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  brand: text('brand').notNull(),
  category: text('category').notNull(),
  gender: text('gender').notNull(),
  price: integer('price').notNull(),
  description: text('description').default(''),
  images: text('images').default('[]'),          // JSON string
  sizes: text('sizes').default('[]'),             // JSON string
  stockBySize: text('stock_by_size').default('{}'), // JSON string
  isNew: integer('is_new', { mode: 'boolean' }).default(false),
  isHot: integer('is_hot', { mode: 'boolean' }).default(false),
  inStock: integer('in_stock', { mode: 'boolean' }).default(true),
  createdAt: text('created_at').default(sql`(datetime('now'))`),
});

export const orders = sqliteTable('orders', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  telegramId: text('telegram_id').notNull(),
  telegramUsername: text('telegram_username').default(''),
  customerName: text('customer_name').notNull(),
  phone: text('phone').notNull(),
  deliveryType: text('delivery_type').notNull(),
  address: text('address').default(''),
  paymentMethod: text('payment_method').notNull(),
  items: text('items').notNull(),                // JSON string
  totalAmount: integer('total_amount').notNull(),
  status: text('status').default('new'),
  comment: text('comment').default(''),
  createdAt: text('created_at').default(sql`(datetime('now'))`),
});

export const favourites = sqliteTable('favourites', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  telegramId: text('telegram_id').notNull(),
  productId: integer('product_id').notNull(),
  createdAt: text('created_at').default(sql`(datetime('now'))`),
});

// ---------- Helpers to parse/serialize JSON fields ----------
export interface ProductRow {
  id: number;
  name: string;
  brand: string;
  category: string;
  gender: string;
  price: number;
  description: string | null;
  images: string[];
  sizes: (string | number)[];
  stockBySize: Record<string, number>;
  isNew: boolean | null;
  isHot: boolean | null;
  inStock: boolean | null;
  createdAt: string | null;
}

export function parseProduct(row: typeof products.$inferSelect): ProductRow {
  return {
    ...row,
    images: JSON.parse(row.images ?? '[]'),
    sizes: JSON.parse(row.sizes ?? '[]'),
    stockBySize: JSON.parse(row.stockBySize ?? '{}'),
  };
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

export interface ParsedOrder {
  id: number;
  telegramId: string;
  telegramUsername: string | null;
  customerName: string;
  phone: string;
  deliveryType: string;
  address: string | null;
  paymentMethod: string;
  items: OrderItem[];
  totalAmount: number;
  status: string | null;
  comment: string | null;
  createdAt: string | null;
}

export function parseOrder(row: typeof orders.$inferSelect): ParsedOrder {
  return { ...row, items: JSON.parse(row.items) };
}

export const reviews = sqliteTable('reviews', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  telegramId: text('telegram_id').notNull(),
  telegramUsername: text('telegram_username').default(''),
  customerName: text('customer_name').notNull(),
  rating: integer('rating').notNull(),       // 1–5
  text: text('text').notNull(),
  createdAt: text('created_at').default(sql`(datetime('now'))`),
});

export interface ReviewRow {
  id: number;
  telegramId: string;
  telegramUsername: string | null;
  customerName: string;
  rating: number;
  text: string;
  createdAt: string | null;
}

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
export type Order = typeof orders.$inferSelect;
