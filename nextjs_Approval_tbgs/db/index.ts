import 'dotenv/config';
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { getDatabaseUrl } from "./config";
import * as schema from "./schema";

const globalForDb = global as unknown as {
  pool: Pool | undefined;
  db: ReturnType<typeof drizzle<typeof schema>> | undefined;
};

const pool = globalForDb.pool ?? new Pool({
  connectionString: getDatabaseUrl(),
  max: 20, // Increase max connections slightly for dev concurrency
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

if (process.env.NODE_ENV !== "production") {
  globalForDb.pool = pool;
}

export const db = globalForDb.db ?? drizzle(pool, { schema });

if (process.env.NODE_ENV !== "production") {
  globalForDb.db = db;
}
