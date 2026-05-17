import { defineConfig } from 'drizzle-kit';
import path from 'path';

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'turso',
  dbCredentials: {
    url: `file:${path.join(__dirname, 'data/shop.db')}`,
  },
});
