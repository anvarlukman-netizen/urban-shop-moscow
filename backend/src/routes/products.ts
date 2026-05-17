import { Router, Request, Response } from 'express';
import { db } from '../db';
import { products, parseProduct } from '../db/schema';
import { eq, like, and, or, SQL } from 'drizzle-orm';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const { category, brand, gender, search, isNew, isHot, limit = '50' } = req.query as Record<string, string>;

    const conditions: SQL[] = [eq(products.inStock, true)];
    if (category) conditions.push(eq(products.category, category));
    if (brand) conditions.push(eq(products.brand, brand));
    if (gender && gender !== 'all') {
      conditions.push(or(eq(products.gender, gender), eq(products.gender, 'unisex'))!);
    }
    if (isNew === 'true') conditions.push(eq(products.isNew, true));
    if (isHot === 'true') conditions.push(eq(products.isHot, true));
    if (search) {
      conditions.push(or(like(products.name, `%${search}%`), like(products.brand, `%${search}%`))!);
    }

    const rows = await db
      .select()
      .from(products)
      .where(and(...conditions))
      .limit(Number(limit))
      .orderBy(products.createdAt);

    const parsed = rows.map((r) => {
      const p = parseProduct(r);
      const totalStock = Object.values(p.stockBySize).reduce((a, b) => a + b, 0);
      return { ...p, totalStock };
    });

    res.json(parsed);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

router.get('/brands', async (_req: Request, res: Response) => {
  try {
    const rows = await db.selectDistinct({ brand: products.brand }).from(products);
    res.json(rows.map((r) => r.brand).sort());
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch brands' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const [raw] = await db.select().from(products).where(eq(products.id, id));
    if (!raw) return res.status(404).json({ error: 'Product not found' });

    const product = parseProduct(raw);

    const relatedRaw = await db
      .select()
      .from(products)
      .where(and(eq(products.category, raw.category), eq(products.inStock, true)))
      .limit(4);

    const related = relatedRaw
      .filter((r) => r.id !== id)
      .slice(0, 3)
      .map(parseProduct);

    res.json({ product, related });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

export default router;
