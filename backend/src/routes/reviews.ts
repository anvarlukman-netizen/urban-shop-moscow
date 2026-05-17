import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { db } from '../db';
import { reviews } from '../db/schema';
import { desc, eq } from 'drizzle-orm';

const router = Router();

const reviewSchema = z.object({
  customerName: z.string().min(2),
  rating: z.number().int().min(1).max(5),
  text: z.string().min(5).max(1000),
});

router.get('/', async (_req: Request, res: Response) => {
  try {
    const rows = await db.select().from(reviews).orderBy(desc(reviews.createdAt));
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const user = req.telegramUser;
    const data = reviewSchema.parse(req.body);

    const existing = await db.select().from(reviews)
      .where(eq(reviews.telegramId, String(user?.id ?? 0)));

    if (existing.length > 0) {
      return res.status(400).json({ error: 'Вы уже оставили отзыв' });
    }

    const [row] = await db.insert(reviews).values({
      telegramId: String(user?.id ?? 0),
      telegramUsername: user?.username ?? '',
      customerName: data.customerName,
      rating: data.rating,
      text: data.text,
    }).returning();

    res.json(row);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: err.errors });
    }
    console.error(err);
    res.status(500).json({ error: 'Failed to create review' });
  }
});

export default router;
