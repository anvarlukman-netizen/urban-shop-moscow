import { Router, Request, Response } from 'express';
import { db } from '../db';
import { products, parseProduct } from '../db/schema';
import { eq } from 'drizzle-orm';

const router = Router();

// GET all products (admin, включая неактивные)
router.get('/products', async (_req: Request, res: Response) => {
  try {
    const rows = await db.select().from(products).orderBy(products.id);
    const parsed = rows.map(parseProduct);
    res.json(parsed);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// POST create product
router.post('/products', async (req: Request, res: Response) => {
  try {
    const {
      name, brand, category, gender, price,
      description, article, colorway, material,
      images, sizes, stockBySize,
      isNew, isHot, inStock,
    } = req.body;

    const [row] = await db.insert(products).values({
      name, brand, category, gender,
      price: Number(price),
      description: description || '',
      article: article || '',
      colorway: colorway || '',
      material: material || '',
      images: JSON.stringify(images || []),
      sizes: JSON.stringify(sizes || []),
      stockBySize: JSON.stringify(stockBySize || {}),
      isNew: Boolean(isNew),
      isHot: Boolean(isHot),
      inStock: inStock !== false,
    }).returning();

    res.status(201).json(parseProduct(row));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// PUT update product
router.put('/products/:id', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const {
      name, brand, category, gender, price,
      description, article, colorway, material,
      images, sizes, stockBySize,
      isNew, isHot, inStock,
    } = req.body;

    const [row] = await db.update(products).set({
      name, brand, category, gender,
      price: Number(price),
      description: description || '',
      article: article || '',
      colorway: colorway || '',
      material: material || '',
      images: JSON.stringify(images || []),
      sizes: JSON.stringify(sizes || []),
      stockBySize: JSON.stringify(stockBySize || {}),
      isNew: Boolean(isNew),
      isHot: Boolean(isHot),
      inStock: Boolean(inStock),
    }).where(eq(products.id, id)).returning();

    if (!row) return res.status(404).json({ error: 'Product not found' });
    res.json(parseProduct(row));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// DELETE product
router.delete('/products/:id', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    await db.delete(products).where(eq(products.id, id));
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// POST upload image → imgbb
router.post('/upload', async (req: Request, res: Response) => {
  try {
    const { imageBase64 } = req.body;
    const apiKey = process.env.IMGBB_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: 'IMGBB_API_KEY not configured' });
    }

    const formData = new URLSearchParams();
    formData.append('key', apiKey);
    formData.append('image', imageBase64);

    const r = await fetch('https://api.imgbb.com/1/upload', {
      method: 'POST',
      body: formData,
    });

    const data = await r.json() as { data?: { url: string }; error?: { message: string } };
    if (!r.ok || !data.data) {
      return res.status(500).json({ error: data.error?.message || 'Upload failed' });
    }

    res.json({ url: data.data.url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Upload failed' });
  }
});

export default router;
