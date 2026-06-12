require('dotenv').config();
const { drizzle } = require('drizzle-orm/node-postgres');
const { Pool } = require('pg');
const { sql } = require('drizzle-orm');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});
const db = drizzle(pool);

async function run() {
  try {
    const poCountResult = await db.execute(sql`SELECT count(*) FROM tbl_purchase_order_hdr WHERE status_entry = 'PENDING'`);
    console.log("PO Count:", poCountResult.rows);
    
    const otherCountsResult = await db.execute(sql`SELECT approval_type as type, count(*) FROM tbl_approval_requests WHERE status_entry = 'PENDING' GROUP BY approval_type`);
    console.log("Other Counts:", otherCountsResult.rows);
  } catch (e) {
    console.error("DB Error:", e);
  } finally {
    pool.end();
  }
}
run();
