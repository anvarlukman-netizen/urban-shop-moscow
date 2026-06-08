import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { db } from '../db';
import { orders, parseOrder, OrderItem } from '../db/schema';
import { notifyManagerNewOrder } from '../bot/notifications';
import { eq } from 'drizzle-orm';

const router = Router();

const orderSchema = z.object({
  customerName: z.string().min(2),
  phone: z.string().min(1),
  deliveryType: z.enum(['pickup', 'delivery']),
  address: z.string().optional().default(''),
  paymentMethod: z.enum(['card', 'cash']),
  comment: z.string().optional().default(''),
  items: z.array(z.object({
    productId: z.number(),
    productName: z.string(),
    brand: z.string(),
    size: z.union([z.string(), z.number()]),
    quantity: z.number().min(1),
    price: z.number(),
    image: z.string(),
  })).min(1),
  totalAmount: z.number().positive(),
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const user = req.telegramUser;
    const data = orderSchema.parse(req.body);

    const [order] = await db.insert(orders).values({
      telegramId: String(user?.id ?? 0),
      telegramUsername: user?.username ?? '',
      customerName: data.customerName,
      phone: data.phone,
      deliveryType: data.deliveryType,
      address: data.address,
      paymentMethod: data.paymentMethod,
      comment: data.comment,
      items: JSON.stringify(data.items),
      totalAmount: data.totalAmount,
      status: 'new',
    }).returning();

    notifyManagerNewOrder(parseOrder(order)).catch(console.error);
    res.json({ success: true, orderId: order.id });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: err.errors });
    }
    console.error(err);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

router.get('/my', async (req: Request, res: Response) => {
  try {
    const telegramId = String(req.telegramUser?.id ?? 0);
    const rows = await db.select().from(orders).where(eq(orders.telegramId, telegramId));
    res.json(rows.map(parseOrder));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

export default router;
