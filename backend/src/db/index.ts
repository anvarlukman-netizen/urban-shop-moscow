import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from './schema';
import path from 'path';
import fs from 'fs';

const tursoUrl = process.env.TURSO_DATABASE_URL;
const tursoToken = process.env.TURSO_AUTH_TOKEN;

let clientConfig: Parameters<typeof createClient>[0];

if (tursoUrl && tursoToken) {
  clientConfig = { url: tursoUrl, authToken: tursoToken };
} else {
  const DATA_DIR = path.join(__dirname, '../../data');
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  clientConfig = { url: `file:${path.join(DATA_DIR, 'shop.db')}` };
}

const client = createClient(clientConfig);
export const db = drizzle(client, { schema });
