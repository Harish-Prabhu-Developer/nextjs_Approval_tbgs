import { defineConfig } from 'drizzle-kit';
import 'dotenv/config';
import { getDatabaseUrl } from './db/config';

export default defineConfig({
  schema: './db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: getDatabaseUrl(),
  },
  verbose: true,
  strict: true,
});
