import 'dotenv/config';
import { Pool } from 'pg';
import { getDatabaseUrl } from './config';

async function dropDatabase() {
  const databaseUrl = getDatabaseUrl();
  const parsedUrl = new URL(databaseUrl);
  const dbName = parsedUrl.pathname.replace(/^\//, '');

  if (!dbName) {
    console.error('Could not extract database name from DATABASE_URL');
    process.exit(1);
  }

  parsedUrl.pathname = '/postgres';
  const adminUrl = parsedUrl.toString();

  const pool = new Pool({
    connectionString: adminUrl,
    connectionTimeoutMillis: 5000,
  });

  try {
    console.log(`Dropping database "${dbName}"...`);
    await pool.query(`DROP DATABASE IF EXISTS "${dbName}" WITH (FORCE)`);
    console.log(`Database "${dbName}" dropped successfully.`);
    process.exit(0);
  } catch (error) {
    console.error('Failed to drop database:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

dropDatabase();
