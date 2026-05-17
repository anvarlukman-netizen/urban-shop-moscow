import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from './schema';
import path from 'path';
import fs from 'fs';

const DATA_DIR = path.join(__dirname, '../../data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const client = createClient({
  url: `file:${path.join(DATA_DIR, 'shop.db')}`,
});

export const db = drizzle(client, { schema });
