import { Router, Request, Response } from 'express';
import multer from 'multer';
import { db } from '../db';
import { products, parseProduct } from '../db/schema';
import { eq } from 'drizzle-orm';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

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

// POST upload image → GitHub repo → GitHub Pages
router.post('/upload', upload.single('file'), async (req: Request, res: Response) => {
  try {
    const ghToken = process.env.GITHUB_TOKEN;
    const ghRepo = 'anvarlukman-netizen/urban-shop-moscow';

    if (!ghToken) return res.status(500).json({ error: 'GITHUB_TOKEN not configured' });
    if (!req.file) return res.status(400).json({ error: 'No file provided' });

    const ext = req.file.originalname.split('.').pop()?.toLowerCase() || 'jpg';
    const name = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const filePath = `frontend/public/uploads/${name}`;
    const content = req.file.buffer.toString('base64');

    const r = await fetch(`https://api.github.com/repos/${ghRepo}/contents/${filePath}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${ghToken}`,
        'Content-Type': 'application/json',
        'User-Agent': 'urban-shop-admin',
      },
      body: JSON.stringify({ message: `upload: ${name}`, content }),
    });

    const data = await r.json() as { content?: object; message?: string };
    if (!r.ok) return res.status(500).json({ error: data.message || 'GitHub upload failed' });

    res.json({ url: `https://anvarlukman-netizen.github.io/urban-shop-moscow/uploads/${name}` });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: String(err) });
  }
});

export default router;
