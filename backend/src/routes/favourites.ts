import { Router, Request, Response } from 'express';
import { db } from '../db';
import { favourites, products, parseProduct } from '../db/schema';
import { and, eq, inArray } from 'drizzle-orm';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const telegramId = String(req.telegramUser?.id ?? 0);
    const favs = await db.select().from(favourites).where(eq(favourites.telegramId, telegramId));
    if (!favs.length) return res.json([]);

    const ids = favs.map((f) => f.productId);
    const rows = await db.select().from(products).where(inArray(products.id, ids));
    res.json(rows.map(parseProduct));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch favourites' });
  }
});

router.post('/:productId', async (req: Request, res: Response) => {
  try {
    const telegramId = String(req.telegramUser?.id ?? 0);
    const productId = Number(req.params.productId);

    const [existing] = await db.select().from(favourites).where(
      and(eq(favourites.telegramId, telegramId), eq(favourites.productId, productId))
    );

    if (existing) {
      await db.delete(favourites).where(
        and(eq(favourites.telegramId, telegramId), eq(favourites.productId, productId))
      );
      res.json({ action: 'removed' });
    } else {
      await db.insert(favourites).values({ telegramId, productId });
      res.json({ action: 'added' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to toggle favourite' });
  }
});

export default router;
