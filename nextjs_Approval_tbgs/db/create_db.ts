import 'dotenv/config';
import { Pool } from 'pg';
import { getDatabaseUrl } from './config';

async function createDatabase() {
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
    console.log(`Creating database "${dbName}"...`);
    await pool.query(`CREATE DATABASE "${dbName}"`);
    console.log(`Database "${dbName}" created successfully.`);
    process.exit(0);
  } catch (error: any) {
    if (error.code === '42P04') {
      console.log(`Database "${dbName}" already exists.`);
      process.exit(0);
    }
    console.error('Failed to create database:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

createDatabase();
